# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This project uses Yarn Berry (`yarn@4.12.0`, pinned via `packageManager`).

```bash
yarn install                 # install deps
yarn start                   # run the server (http://localhost:8000)
yarn dev                     # run with Node's --watch for auto-reload
yarn test                    # run the full Jest suite (backend + frontend)
yarn test -t "name"          # run tests matching a name pattern
yarn jest index.test.js      # run a single test file
yarn jest public/app.test.js # run only the frontend theme tests
yarn lint                    # eslint .
yarn lint:fix                # eslint . --fix
yarn format                  # prettier --write .
yarn format:check            # prettier --check .
```

`PORT` env var overrides the default port (8000).

## Architecture

This repo has **two independent data paths that must not be confused**:

1. **Backend scraper** (`index.js`) — an Express app that fetches `https://news.ycombinator.com/` server-side with axios, parses the HTML with cheerio (`scrapeArticles`), and serves it via `/api/articles` (enveloped, cacheable), `/articles` (legacy plain array), and `/debug` (raw HTML passthrough). Results are cached in-module (`getArticles`, 60s TTL, `?refresh=true` bypasses it). `app`, `scrapeArticles`, and `getArticles` are exported for testing.
2. **Static UI** (`public/app.js`) — served as static files by Express (`express.static`) when running the server, but **also deployed standalone to GitHub Pages** (`.github/workflows/deploy.yml` uploads only the `public/` directory — there is no server on Pages). Because of this, `app.js` does **not** call `/api/articles`; it fetches directly from the public Algolia HN Search API (`hn.algolia.com/api/v1/search?tags=front_page`) client-side and normalizes that response into the same article shape (`rank`, `id`, `url`, `domain`, `title`, `points`, `comments`, `author`, `age`) independently of `index.js`'s scraper. When changing the article schema, both normalizers (`scrapeArticles` in `index.js` and the `.map()` in `load()` in `public/app.js`) need to be kept in sync manually — there's no shared code path between them.

Other notes:

- `public/app.js` builds card HTML via string templates (`articleCard`); it escapes text with `escapeHTML()` and restricts link `href`s to `http(s)://` via regex before interpolating, to prevent XSS from scraped/API content (see commit `630738d`) — preserve this when touching link rendering.
- Tests (`index.test.js`) mock `axios` with `jest.mock("axios")` and call `jest.resetModules()` before re-requiring `./index` in each `describe` block, since the module-level `cache` in `index.js` persists across `require`s otherwise.
- `public/app.js` is a plain `<script src="app.js">` (non-module) loaded by `index.html`, but it also exports `resolveInitialTheme` and `applyTheme` for testing via `if (typeof module !== "undefined") module.exports = { ... }` — this guard is a no-op in the browser (`module` is undefined there) but lets `public/app.test.js` `require()` it under Node. Everything else in `app.js` (DOM element lookups, the initial theme application, `load()`) still runs at module-load time, so any test that `require`s it needs a matching DOM already in place (see `setupDom()` in `public/app.test.js`, which mirrors the element IDs in `index.html`) plus mocked `matchMedia` and `fetch` set up _before_ the `require`, or it will throw.
- `public/app.test.js` opts into a DOM via a per-file `/** @jest-environment jsdom */` docblock rather than a global Jest config, since the backend suite (`index.test.js`) doesn't need one and stays on Jest's default `node` environment. This requires the `jest-environment-jsdom` dev dependency.
- ESLint (`eslint.config.js`) applies different global/sourceType profiles per directory: root `**/*.js` gets Node globals + CommonJS, `public/**/*.js` gets browser globals + script (non-module) sourceType, `**/*.test.js` adds the `eslint-plugin-jest` recommended rules and Jest globals. `public/app.test.js` matches both the `public/**/*.js` and `**/*.test.js` patterns, so it gets the union of Node, browser, and Jest globals.
