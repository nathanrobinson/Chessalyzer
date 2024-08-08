import { ChessApi } from "./src/chess-api";
import { TableApi } from "./src/table-api";
import "@material/web/all.js";
import { styles as typescaleStyles } from "@material/web/typography/md-typescale-styles.js";

(function (fn) {
  document.adoptedStyleSheets.push(typescaleStyles.styleSheet);
  // see if DOM is already available
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    // call on next available tick
    setTimeout(fn, 1);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
})(function () {
  function enableDarkMode() {
    const Tag = document.documentElement; /* Get <html> tag */
    const Switch = document.getElementById("dark-switch");
    Tag.dataset.theme = "dark";
    Switch.addEventListener("change", () => {
      Switch.selected ? (Tag.dataset.theme = "dark") : (Tag.dataset.theme = "");
    });

    const normalButton = document.getElementById("theme-normal");
    normalButton.addEventListener("click", (e) =>
      setContrast("", normalButton)
    );

    const mediumButton = document.getElementById("theme-medium");
    mediumButton.addEventListener("click", (e) =>
      setContrast("mc", mediumButton)
    );

    const highButton = document.getElementById("theme-high");
    highButton.addEventListener("click", (e) => setContrast("hc", highButton));

    function setContrast(contrast, source) {
      normalButton.selected = false;
      mediumButton.selected = false;
      highButton.selected = false;
      source.selected = true;
      Tag.dataset.contrast = contrast;
    }
  }

  enableDarkMode();

  const tableApi = new TableApi();

  const usernameInput = document.getElementById("username");

  usernameInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await loadGames();
    }
  });

  document.getElementById("load-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    await loadGames();
  });

  async function loadGames() {
    const username = String(usernameInput.value);

    if (!!username) {
      const api = new ChessApi();
      const games = await api.getPlayersGames(username);

      tableApi.formatTable(username, games);
    } else {
      console.error("Invalid username: ", username);
    }
  }
});
