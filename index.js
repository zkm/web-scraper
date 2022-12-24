const PORT = 8000;
const axios = require("axios");
const cheerio = require("cheerio");
const { response } = require("express");
const express = require("express");

const app = express();

const url = "https://www.aol.com/news";

axios(url)
  .then((response) => {
    const html = response.data;
    const $ = cheerio.load(html);
    const articles = [];

    $(`.ntk-stream-item`, html).each(function () {
      const title = $(this).find(".ntk-list-item-title").text();
      const url = $(this).attr("href");
      articles.push({
        title,
        url,
      });
    });
    console.log(articles);
  })
  .catch((err) => console.log(err));

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`));
