const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");

const PORT = process.env.PORT || 8000;
const HN_URL = "https://news.ycombinator.com/";
const CACHE_TTL_MS = 60 * 1000;

const app = express();
app.use(express.static(path.join(__dirname, "public")));

async function scrapeArticles(url) {
  const response = await axios(url);
  const html = response.data;
  const $ = cheerio.load(html);
  const articles = [];

  $(".athing").each(function () {
    const row = $(this);
    const titleLink = row.find(".titleline > a").first();
    const subtext = row.next("tr").find(".subtext");

    const points = parseInt(subtext.find(".score").text(), 10) || 0;
    const commentsText = subtext.find("a").last().text();
    const commentsMatch = commentsText.match(/(\d+)\s+comment/);

    articles.push({
      id: row.attr("id") || null,
      rank: parseInt(row.find(".rank").text(), 10) || null,
      title: titleLink.text(),
      url: titleLink.attr("href"),
      domain: row.find(".sitestr").text() || null,
      points,
      author: subtext.find(".hnuser").text() || null,
      age: subtext.find(".age a").text() || null,
      comments: commentsMatch ? parseInt(commentsMatch[1], 10) : 0,
    });
  });

  return articles;
}

let cache = { articles: null, fetchedAt: 0 };

async function getArticles({ refresh = false } = {}) {
  const now = Date.now();
  if (!refresh && cache.articles && now - cache.fetchedAt < CACHE_TTL_MS) {
    return {
      articles: cache.articles,
      fetchedAt: cache.fetchedAt,
      cached: true,
    };
  }
  const articles = await scrapeArticles(HN_URL);
  cache = { articles, fetchedAt: now };
  return { articles, fetchedAt: now, cached: false };
}

app.get("/api/articles", async (req, res) => {
  try {
    const refresh = req.query.refresh === "true";
    const { articles, fetchedAt, cached } = await getArticles({ refresh });
    res.json({
      source: HN_URL,
      fetchedAt,
      cached,
      count: articles.length,
      articles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

// Legacy endpoint: plain array, kept for backwards compatibility
app.get("/articles", async (req, res) => {
  try {
    const { articles } = await getArticles();
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.get("/debug", async (req, res) => {
  try {
    const response = await axios(HN_URL);
    res.type("html").send(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
    console.log(`UI:  http://localhost:${PORT}/`);
    console.log(`API: http://localhost:${PORT}/api/articles`);
  });
}

module.exports = { app, scrapeArticles, getArticles };
