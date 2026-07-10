const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");
const refreshBtn = document.getElementById("refresh");
const themeBtn = document.getElementById("theme");
const retryBtn = document.getElementById("retry");

let articles = [];

/* Theme: respect system preference, allow manual override persisted in localStorage */
function resolveInitialTheme(storage, prefersDark) {
  return storage.getItem("theme") || (prefersDark ? "dark" : "light");
}

function applyTheme(theme, root, button) {
  root.dataset.theme = theme;
  button.textContent = theme === "dark" ? "☀️" : "🌙";
}

const savedTheme = resolveInitialTheme(
  localStorage,
  matchMedia("(prefers-color-scheme: dark)").matches,
);
applyTheme(savedTheme, document.documentElement, themeBtn);

themeBtn.addEventListener("click", () => {
  const next =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next, document.documentElement, themeBtn);
});

/* Rendering */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function renderSkeletons(count = 12) {
  grid.innerHTML = Array.from(
    { length: count },
    () =>
      `<article class="card skeleton">
      <div class="line short"></div>
      <div class="line tall"></div>
      <div class="line"></div>
      <div class="line short"></div>
    </article>`,
  ).join("");
}

function articleCard(a) {
  const hnLink = a.id ? `https://news.ycombinator.com/item?id=${a.id}` : null;
  const rawHref =
    a.url && a.url.startsWith("item?")
      ? `https://news.ycombinator.com/${a.url}`
      : a.url;
  const href = rawHref && /^https?:\/\//i.test(rawHref) ? rawHref : "#";
  return `<article class="card">
    <div class="card-top">
      <span class="rank">#${a.rank ?? "–"}</span>
      ${a.domain ? `<span class="domain">${escapeHTML(a.domain)}</span>` : ""}
    </div>
    <h2 class="card-title">
      <a href="${escapeHTML(href)}" target="_blank" rel="noopener">${escapeHTML(a.title)}</a>
    </h2>
    <div class="card-meta">
      <span>▲ ${a.points ?? 0} points</span>
      ${
        hnLink
          ? `<a href="${hnLink}" target="_blank" rel="noopener">💬 ${a.comments ?? 0} comments</a>`
          : `<span>💬 ${a.comments ?? 0} comments</span>`
      }
      ${a.author ? `<span>by ${escapeHTML(a.author)}</span>` : ""}
      ${a.age ? `<span>${escapeHTML(a.age)}</span>` : ""}
    </div>
  </article>`;
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const sortBy = sortSelect.value;

  let visible = articles.filter(
    (a) =>
      !query ||
      (a.title || "").toLowerCase().includes(query) ||
      (a.domain || "").toLowerCase().includes(query) ||
      (a.author || "").toLowerCase().includes(query),
  );

  visible = [...visible].sort((a, b) => {
    if (sortBy === "points") return (b.points || 0) - (a.points || 0);
    if (sortBy === "comments") return (b.comments || 0) - (a.comments || 0);
    return (a.rank || 0) - (b.rank || 0);
  });

  grid.innerHTML = visible.length
    ? visible.map(articleCard).join("")
    : `<p class="status">No articles match “${escapeHTML(searchInput.value)}”.</p>`;
}

/* Data */
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date) / 1000);
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function load({ refresh: _refresh = false } = {}) {
  errorEl.hidden = true;
  grid.hidden = false;
  statusEl.textContent = "Loading…";
  renderSkeletons();

  try {
    const res = await fetch(
      "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30",
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    articles = data.hits.map((hit, i) => ({
      rank: i + 1,
      id: hit.objectID,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      domain: hit.url ? domainFromUrl(hit.url) : null,
      title: hit.title,
      points: hit.points ?? 0,
      comments: hit.num_comments ?? 0,
      author: hit.author,
      age: timeAgo(new Date(hit.created_at)),
    }));

    const when = new Date().toLocaleTimeString();
    statusEl.textContent = `${articles.length} articles · updated ${when}`;
    render();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "";
    grid.hidden = true;
    errorEl.hidden = false;
  }
}

searchInput.addEventListener("input", render);
sortSelect.addEventListener("change", render);
refreshBtn.addEventListener("click", () => load({ refresh: true }));
retryBtn.addEventListener("click", () => load({ refresh: true }));

load();

if (typeof module !== "undefined") {
  module.exports = { resolveInitialTheme, applyTheme };
}
