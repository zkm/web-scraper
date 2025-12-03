# Web Scraper

A Node.js web scraper that extracts news articles from AOL News. Built with Express, Axios, and Cheerio.

## Features

- Express REST API server
- Web scraping with Cheerio
- JSON API endpoint for articles
- Jest testing suite

## Prerequisites

- Node.js (version 14 or later)
- Yarn or npm

## Installation

Install the dependencies:

```bash
yarn install
```

or

```bash
npm install
```

## Usage

### Development

Start the development server:

```bash
yarn dev
```

or

```bash
npm run dev
```

The server will start on port 8000.

### API Endpoint

Visit [http://localhost:8000/articles](http://localhost:8000/articles) to retrieve scraped articles in JSON format.

**Response format:**
```json
[
  {
    "title": "Article Title",
    "url": "https://example.com/article"
  }
]
```

## Testing

Run the test suite:

```bash
yarn test
```

or

```bash
npm test
```

## Project Structure

```
├── index.js          # Main application file
├── index.test.js     # Jest tests
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

## Dependencies

- **express** - Web framework
- **axios** - HTTP client for making requests
- **cheerio** - jQuery-like HTML parsing

## Dev Dependencies

- **jest** - Testing framework

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
