import { ChessApi } from "./src/chess-api";
import { TableApi } from "./src/table-api";

(function (fn) {
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
  const tableApi = new TableApi();

  const usernameInput = document.getElementById("username");

  document.getElementById("load-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = String(usernameInput.value);

    if (!!username) {
      const api = new ChessApi();
      const games = await api.getPlayersGames(username);

      tableApi.formatTable(username, games);
    } else {
      console.error("Invalid username: ", username);
    }
  });
});
