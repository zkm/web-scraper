const axios = require("axios");
const cheerio = require("cheerio");

// Mock axios
jest.mock("axios");

// Import the scraping function (we'll need to export it from index.js)
const scrapeArticles = async (url) => {
  const response = await axios(url);
  const html = response.data;
  const $ = cheerio.load(html);
  const articles = [];

  $(".ntk-stream-item", html).each(function () {
    const title = $(this).find(".ntk-list-item-title").text();
    const url = $(this).attr("href");
    articles.push({
      title,
      url,
    });
  });

  return articles;
};

describe("Web Scraper", () => {
  describe("scrapeArticles", () => {
    it("should scrape articles from HTML", async () => {
      // Mock HTML response
      const mockHTML = `
        <div class="ntk-stream-item" href="https://example.com/article1">
          <h3 class="ntk-list-item-title">Test Article 1</h3>
        </div>
        <div class="ntk-stream-item" href="https://example.com/article2">
          <h3 class="ntk-list-item-title">Test Article 2</h3>
        </div>
      `;

      axios.mockResolvedValue({ data: mockHTML });

      const articles = await scrapeArticles("https://www.aol.com/news");

      expect(articles).toHaveLength(2);
      expect(articles[0]).toEqual({
        title: "Test Article 1",
        url: "https://example.com/article1",
      });
      expect(articles[1]).toEqual({
        title: "Test Article 2",
        url: "https://example.com/article2",
      });
    });

    it("should return empty array when no articles found", async () => {
      const mockHTML = "<div>No articles here</div>";

      axios.mockResolvedValue({ data: mockHTML });

      const articles = await scrapeArticles("https://www.aol.com/news");

      expect(articles).toHaveLength(0);
    });

    it("should handle axios errors", async () => {
      axios.mockRejectedValue(new Error("Network error"));

      await expect(scrapeArticles("https://www.aol.com/news")).rejects.toThrow(
        "Network error"
      );
    });
  });
});
