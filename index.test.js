const axios = require("axios");

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
      scrapeArticles("https://news.ycombinator.com/")
    ).rejects.toThrow("Network error");
  });
});
