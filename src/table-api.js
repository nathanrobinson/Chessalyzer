import {
  Tabulator,
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
        formatter: () => "<button>Review</button>",
        hozAlign: "center",
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
        title: "Move Link",
        field: "url",
        formatter: "link",
        formatterParams: {
          labelField: "index",
          target: "_blank",
        },
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
      FilterModule,
      FormatModule,
      InteractionModule,
      SortModule,
    ]);
    this.#table = new Tabulator("#results-table", this.#tableParams);
    this.#setUpFilters();
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
    const fieldEl = document.getElementById("filter-field");
    const typeEl = document.getElementById("filter-type");
    const valueEl = document.getElementById("filter-value");

    //Trigger setFilter function with correct parameters
    //Update filters on value change
    document.getElementById("filter-form").addEventListener("click", (e) => {
      e.preventDefault();
      var filterVal = fieldEl.options[fieldEl.selectedIndex].value;
      var typeVal = typeEl.options[typeEl.selectedIndex].value
        .replace("gte", ">=")
        .replace("lte", "<=")
        .replace("gt", ">")
        .replace("lt", "<");

      var filter = filterVal;

      if (filterVal) {
        this.#table.setFilter(filter, typeVal, valueEl.value);
      }
    });

    //Clear filters on "Clear Filters" button click
    document.getElementById("filter-clear").addEventListener("click", () => {
      fieldEl.value = "";
      typeEl.value = "=";
      valueEl.value = "";

      this.#table.clearFilter();
    });
  }

  async #reviewGame(data) {
    const worstMoves = await this.#reviewApi.reviewGame(data);
    document.getElementById("review-div").innerHTML =
      '<table id="review-table"></table>';
    const reviewTable = new Tabulator("#review-table", this.#reviewTableParams);
    reviewTable.on("tableBuilt", () => reviewTable.setData(worstMoves));
  }
}
