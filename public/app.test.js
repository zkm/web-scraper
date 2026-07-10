/**
 * @jest-environment jsdom
 */

function setupDom() {
  document.body.innerHTML = `
    <input id="search" />
    <select id="sort"><option value="rank">Rank</option></select>
    <button id="refresh"></button>
    <button id="theme"></button>
    <p id="status"></p>
    <div id="error" hidden><button id="retry"></button></div>
    <section id="grid"></section>
  `;
}

function requireApp() {
  jest.resetModules();
  return require("./app.js");
}

describe("theme persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    setupDom();
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hits: [] }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("falls back to system preference when nothing is saved", () => {
    const { resolveInitialTheme } = requireApp();

    expect(resolveInitialTheme(localStorage, true)).toBe("dark");
    expect(resolveInitialTheme(localStorage, false)).toBe("light");
  });

  it("prefers the saved theme over system preference", () => {
    localStorage.setItem("theme", "dark");
    const { resolveInitialTheme } = requireApp();

    expect(resolveInitialTheme(localStorage, false)).toBe("dark");
  });

  it("applies the theme to the root element and toggle button", () => {
    const { applyTheme } = requireApp();
    const root = document.documentElement;
    const button = document.getElementById("theme");

    applyTheme("dark", root, button);
    expect(root.dataset.theme).toBe("dark");
    expect(button.textContent).toBe("☀️");

    applyTheme("light", root, button);
    expect(root.dataset.theme).toBe("light");
    expect(button.textContent).toBe("🌙");
  });

  it("applies the system-preferred theme on load", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });

    requireApp();

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.getElementById("theme").textContent).toBe("☀️");
  });

  it("persists the theme to localStorage when the toggle button is clicked", () => {
    requireApp();
    const button = document.getElementById("theme");

    button.click();

    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    button.click();

    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
