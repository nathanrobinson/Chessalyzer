import {
  Tabulator,
  DownloadModule,
  ExportModule,
  FilterModule,
  FormatModule,
  InteractionModule,
  SortModule,
} from "tabulator-tables";
import { ReviewApi } from "./review";

export class TableApi {
  #reviewApi = new ReviewApi();
  #tableParams = {
    height: 500, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    filterMode: "local",
    sortMode: "local",
    //layout: "fitColumns", //fit columns to width of table (optional)
    columns: [
      //Define Table Columns
      {
        formatter: () =>
          "<md-filled-tonal-button>Review</md-filled-tonal-button>",
        hozAlign: "center",
        width: 70,
        cellClick: (e, cell) => this.#reviewGame(cell.getRow().getData()),
      },
      { title: "Type", field: "game.time_class" },
      { title: "Played As", field: "playedAs" },
      { title: "Rating", field: "player.rating" },
      { title: "Accuracy", field: "playerAccuracy" },
      {
        title: "Opponent",
        field: "opponentUrl",
        formatter: "link",
        formatterParams: {
          target: "_blank",
          labelField: "opponent.username",
        },
      },
      { title: "Opp. Rating", field: "opponent.rating" },
      { title: "Opp. Accuracy", field: "opponentAccuracy" },
      { title: "Result", field: "player.result" },
      {
        title: "Date",
        field: "date",
      },
      {
        title: "Game Link",
        field: "game.url",
        formatter: "link",
        formatterParams: {
          target: "_blank",
        },
      },
    ],
  };
  #reviewTableParams = {
    height: 200, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    filterMode: "local",
    sortMode: "local",
    //layout: "fitColumns", //fit columns to width of table (optional)
    columns: [
      //Define Table Columns
      {
        title: "Move",
        hozAlign: "center",
        field: "index",
        sorter: "number",
        formatter: (cell) => {
          const rowData = cell.getRow().getData();
          return `<md-filled-tonal-button href="${rowData.url}" target="_blank">${rowData.index}</md-filled-tonal-button>`;
        },
        hozAlign: "center",
        width: 70,
      },
      { title: "Best Move", field: "bestMove.move" },
      { title: "Played", field: "actualScore.move" },
      { title: "Best Win %", field: "bestMove.win" },
      { title: "Played Win %", field: "actualScore.win" },
      { title: "Win Diff", field: "winDiff" },
      { title: "Best Score", field: "bestMove.score" },
      { title: "Played Score", field: "actualScore.score" },
      { title: "Score Diff", field: "scoreDiff" },
      { title: "Best Mate", field: "bestMove.mate" },
      { title: "Played Mate", field: "actualScore.mate" },
      { title: "Draw Diff", field: "drawDiff" },
      { title: "Loss Diff", field: "lossDiff" },
      { title: "Best Draw %", field: "bestMove.draw" },
      { title: "Best Loss %", field: "bestMove.loss" },
      { title: "Played Draw %", field: "actualScore.draw" },
      { title: "Played Loss %", field: "actualScore.loss" },
    ],
  };
  #table;

  constructor() {
    Tabulator.registerModule([
      DownloadModule,
      ExportModule,
      FilterModule,
      FormatModule,
      InteractionModule,
      SortModule,
    ]);
    this.#table = new Tabulator("#results-table", this.#tableParams);
    this.#setUpFilters();
    this.#enableDownload();
  }

  formatTable(username, games) {
    const data = [];

    console.dir(games);

    games.forEach((game) => {
      const white = String(game.white.username);
      const playedAsWhite = white.toLowerCase() === username.toLowerCase();
      const player = playedAsWhite ? game.white : game.black;
      const opponent = playedAsWhite ? game.black : game.white;
      const date = new Date(Number(game.end_time) * 1000);

      data.push({
        playedAs: playedAsWhite ? "White" : "Black",
        game,
        player,
        opponent,
        opponentUrl: `https://www.chess.com/member/${opponent.username}`,
        date: date.toLocaleDateString(),
        playerAccuracy: playedAsWhite
          ? game.accuracies?.white
          : game.accuracies?.black,
        opponentAccuracy: playedAsWhite
          ? game.accuracies?.black
          : game.accuracies?.white,
      });
    });

    this.#table.setData(data);
  }

  #setUpFilters() {
    //Define variables for input elements
    const timeClassEl = document.getElementById("filter-time-class");
    timeClassEl.addEventListener("change", (e) => {
      const value = timeClassEl.value;
      if (value) {
        this.#table.setFilter("game.time_class", "=", value);
      } else {
        this.#table.clearFilter();
      }
    });
  }

  #enableDownload() {
    document
      .getElementById("download-games-excel")
      .addEventListener("click", (e) =>
        this.#table.download("xlsx", "chess_games.xlsx", {
          sheetName: `${document.getElementById("username").value}'s Games`,
        })
      );

    document
      .getElementById("download-games-csv")
      .addEventListener("click", (e) =>
        this.#table.download("csv", "chess_games.csv", { bom: true })
      );
  }

  async #reviewGame(data) {
    const worstMoves = await this.#reviewApi.reviewGame(data);
    document.getElementById("review-div").innerHTML = `
      <md-icon-button id="download-moves-excel" title="Download Excel">
        <md-icon>table</md-icon>
      </md-icon-button>
      <md-icon-button id="download-moves-csv" title="Download csv">
        <md-icon>csv</md-icon>
      </md-icon-button>
      <table id="review-table"></table>
      `;
    const reviewTable = new Tabulator("#review-table", this.#reviewTableParams);
    reviewTable.on("tableBuilt", () => reviewTable.setData(worstMoves));
    document
      .getElementById("download-moves-excel")
      .addEventListener("click", (e) =>
        reviewTable.download("xlsx", "chess_games.xlsx", {
          sheetName: "Moves",
        })
      );
    document
      .getElementById("download-moves-csv")
      .addEventListener("click", (e) =>
        reviewTable.download("csv", "chess_games.csv", { bom: true })
      );
  }
}
