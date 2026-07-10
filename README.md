# Web Scraper

A Node.js web scraper that extracts front-page articles from [Hacker News](https://news.ycombinator.com/) and serves them through a JSON API **and a modern, responsive web UI**. Built with Express, Axios, and Cheerio — no build step required.

## Features

- 📰 **Responsive web UI** — card grid layout that adapts from phone to desktop
- 🌙 **Dark / light theme** — follows your system preference, with a manual toggle persisted across visits
- 🔎 **Instant search** — filter articles by title, domain, or author as you type
- ↕️ **Sorting** — by rank, points, or comment count
- 💀 **Skeleton loading states** and graceful error handling with retry
- 📊 **Rich article metadata** — rank, title, URL, domain, points, author, age, and comment count
- ⚡ **In-memory caching** (60s TTL) so repeated requests don't hammer the source site
- 🧪 Jest test suite covering the scraper, API routes, and frontend theme logic

## Prerequisites

- Node.js 18 or later
- Yarn or npm

## Installation

```bash
yarn install
# or
npm install
```

## Usage

Start the server:

```bash
yarn start
```

Or with auto-reload during development (uses Node's built-in `--watch`):

```bash
yarn dev
```

Then open [http://localhost:8000](http://localhost:8000) for the web UI. The port can be overridden with the `PORT` environment variable.

### API Endpoints

| Endpoint            | Description                                                                         |
| ------------------- | ----------------------------------------------------------------------------------- |
| `GET /`             | Responsive web UI                                                                   |
| `GET /api/articles` | Articles with metadata, wrapped in an envelope (`?refresh=true` bypasses the cache) |
| `GET /articles`     | Legacy endpoint — plain array of articles                                           |
| `GET /debug`        | Raw HTML of the scraped page                                                        |

**`/api/articles` response format:**

```json
{
  "source": "https://news.ycombinator.com/",
  "fetchedAt": 1752148800000,
  "cached": false,
  "count": 30,
  "articles": [
    {
      "id": "101",
      "rank": 1,
      "title": "Article Title",
      "url": "https://example.com/article",
      "domain": "example.com",
      "points": 142,
      "author": "alice",
      "age": "3 hours ago",
      "comments": 87
    }
  ]
}
```

## Testing

```bash
yarn test           # run the Jest suite (backend + frontend)
yarn lint            # eslint .
yarn lint:fix        # eslint . --fix
yarn format          # prettier --write .
yarn format:check    # prettier --check .
```

Backend tests (`index.test.js`) run under Jest's default Node environment. Frontend tests (`public/app.test.js`) run under jsdom via a per-file `@jest-environment jsdom` docblock, since the rest of the suite doesn't need a DOM.

## Project Structure

```
├── index.js            # Express server + scraper
├── index.test.js       # Jest tests (scraper, caching, API routes)
├── eslint.config.js    # ESLint flat config (Node/browser/Jest globals per directory)
├── .prettierrc.json    # Prettier formatting rules
├── .prettierignore     # Files excluded from Prettier
├── public/
│   ├── index.html      # Web UI markup
│   ├── styles.css      # Responsive styles (CSS grid, custom properties, dark mode)
│   ├── app.js           # UI logic (fetch, search, sort, theme)
│   └── app.test.js      # Jest tests for theme persistence (jsdom)
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## Dependencies

- **express** — Web framework and static file serving
- **axios** — HTTP client for making requests
- **cheerio** — jQuery-like HTML parsing

## Dev Dependencies

- **jest** — Testing framework
- **jest-environment-jsdom** — DOM environment for frontend tests
- **supertest** — HTTP assertions against the Express app
- **eslint** / **@eslint/js** / **globals** — Linting
- **eslint-plugin-jest** — Jest-aware lint rules for test files
- **eslint-config-prettier** — Disables ESLint rules that conflict with Prettier
- **prettier** — Code formatting

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
