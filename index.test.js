const axios = require("axios");
const request = require("supertest");

jest.mock("axios");

const { scrapeArticles } = require("./index");

const mockHTML = `
  <table>
    <tr class="athing" id="101">
      <td><span class="rank">1.</span></td>
      <td class="title">
        <span class="titleline">
          <a href="https://example.com/article1">Test Article 1</a>
          <span class="sitebit comhead">(<span class="sitestr">example.com</span>)</span>
        </span>
      </td>
    </tr>
    <tr>
      <td class="subtext">
        <span class="score">142 points</span> by
        <a class="hnuser">alice</a>
        <span class="age"><a>3 hours ago</a></span> |
        <a>87 comments</a>
      </td>
    </tr>
    <tr class="athing" id="102">
      <td><span class="rank">2.</span></td>
      <td class="title">
        <span class="titleline">
          <a href="https://example.org/article2">Test Article 2</a>
          <span class="sitebit comhead">(<span class="sitestr">example.org</span>)</span>
        </span>
      </td>
    </tr>
    <tr>
      <td class="subtext">
        <span class="score">9 points</span> by
        <a class="hnuser">bob</a>
        <span class="age"><a>1 hour ago</a></span> |
        <a>discuss</a>
      </td>
    </tr>
  </table>
`;

describe("scrapeArticles", () => {
  it("scrapes articles with full metadata from HN-style HTML", async () => {
    axios.mockResolvedValue({ data: mockHTML });

    const articles = await scrapeArticles("https://news.ycombinator.com/");

    expect(articles).toHaveLength(2);
    expect(articles[0]).toEqual({
      id: "101",
      rank: 1,
      title: "Test Article 1",
      url: "https://example.com/article1",
      domain: "example.com",
      points: 142,
      author: "alice",
      age: "3 hours ago",
      comments: 87,
    });
    expect(articles[1]).toMatchObject({
      id: "102",
      rank: 2,
      title: "Test Article 2",
      points: 9,
      author: "bob",
      comments: 0,
    });
  });

  it("returns an empty array when no articles are found", async () => {
    axios.mockResolvedValue({ data: "<div>No articles here</div>" });

    const articles = await scrapeArticles("https://news.ycombinator.com/");

    expect(articles).toHaveLength(0);
  });

  it("propagates request errors", async () => {
    axios.mockRejectedValue(new Error("Network error"));

    await expect(
      scrapeArticles("https://news.ycombinator.com/"),
    ).rejects.toThrow("Network error");
  });
});

describe("getArticles", () => {
  let getArticles;
  let axiosMock;

  beforeEach(() => {
    jest.resetModules();
    axiosMock = require("axios");
    axiosMock.mockResolvedValue({ data: mockHTML });
    ({ getArticles } = require("./index"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches articles and returns cached: false on first call", async () => {
    const result = await getArticles();

    expect(result.cached).toBe(false);
    expect(result.articles).toHaveLength(2);
    expect(typeof result.fetchedAt).toBe("number");
  });

  it("serves cached articles within TTL without re-fetching", async () => {
    await getArticles();
    axiosMock.mockClear();

    const result = await getArticles();

    expect(result.cached).toBe(true);
    expect(axiosMock).not.toHaveBeenCalled();
  });

  it("re-fetches when the TTL has expired", async () => {
    const base = 1_000_000;
    jest.spyOn(Date, "now").mockReturnValue(base);
    await getArticles();
    axiosMock.mockClear();

    jest.spyOn(Date, "now").mockReturnValue(base + 61_000);
    const result = await getArticles();

    expect(result.cached).toBe(false);
    expect(axiosMock).toHaveBeenCalledTimes(1);
  });

  it("bypasses cache when refresh=true", async () => {
    await getArticles();
    axiosMock.mockClear();

    const result = await getArticles({ refresh: true });

    expect(result.cached).toBe(false);
    expect(axiosMock).toHaveBeenCalledTimes(1);
  });
});

describe("GET /api/articles", () => {
  let app;
  let axiosMock;

  beforeEach(() => {
    jest.resetModules();
    axiosMock = require("axios");
    axiosMock.mockResolvedValue({ data: mockHTML });
    ({ app } = require("./index"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 with the expected response envelope", async () => {
    const res = await request(app).get("/api/articles");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      source: "https://news.ycombinator.com/",
      cached: expect.any(Boolean),
      count: 2,
      fetchedAt: expect.any(Number),
      articles: expect.any(Array),
    });
    expect(res.body.articles).toHaveLength(2);
  });

  it("returns cached: false when refresh=true is passed", async () => {
    await request(app).get("/api/articles");

    const res = await request(app).get("/api/articles?refresh=true");

    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(false);
  });

  it("returns 500 with error message on scrape failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    axiosMock.mockRejectedValue(new Error("Upstream error"));

    const res = await request(app).get("/api/articles");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to fetch articles" });
  });
});

describe("GET /articles (legacy)", () => {
  let app;
  let axiosMock;

  beforeEach(() => {
    jest.resetModules();
    axiosMock = require("axios");
    axiosMock.mockResolvedValue({ data: mockHTML });
    ({ app } = require("./index"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 with a plain array of articles", async () => {
    const res = await request(app).get("/articles");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ id: "101", title: "Test Article 1" });
  });

  it("returns 500 with a plain text error on scrape failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    axiosMock.mockRejectedValue(new Error("Upstream error"));

    const res = await request(app).get("/articles");

    expect(res.status).toBe(500);
    expect(res.text).toBe("Internal server error");
  });
});

describe("GET /debug", () => {
  let app;
  let axiosMock;

  beforeEach(() => {
    jest.resetModules();
    axiosMock = require("axios");
    ({ app } = require("./index"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 with the raw HTML of the scraped page", async () => {
    axiosMock.mockResolvedValue({ data: mockHTML });

    const res = await request(app).get("/debug");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toBe(mockHTML);
  });

  it("returns 500 with a plain text error when the upstream request fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    axiosMock.mockRejectedValue(new Error("Upstream error"));

    const res = await request(app).get("/debug");

    expect(res.status).toBe(500);
    expect(res.text).toBe("Internal server error");
  });
});
