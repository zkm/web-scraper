const PORT = 8000;
const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");

const app = express();

const url = "https://news.ycombinator.com/";

async function scrapeArticles(url) {
  const response = await axios(url);
  const html = response.data;
  const $ = cheerio.load(html);
  const articles = [];

  $(".athing").each(function () {
    const title = $(this).find(".titleline > a").text();
    const url = $(this).find(".titleline > a").attr("href");
    const rank = $(this).find(".rank").text();
    articles.push({
      rank,
      title,
      url,
    });
  });

  return articles;
}

app.get("/articles", async (req, res) => {
  try {
    const articles = await scrapeArticles(url);
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.get("/debug", async (req, res) => {
  try {
    const response = await axios(url);
    const html = response.data;
    res.type('html').send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
  console.log(`View articles at: http://localhost:${PORT}/articles`);
  console.log(`Debug HTML at: http://localhost:${PORT}/debug`);
});

module.exports = { scrapeArticles };

