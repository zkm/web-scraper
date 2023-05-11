const PORT = 8000;
const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");

const app = express();

const url = "https://www.aol.com/news";

async function scrapeArticles(url) {
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

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`));
