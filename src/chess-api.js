export class ChessApi {
  #formatMonth(month) {
    month = Number(month) + 1;
    if (month < 10) {
      return `0${month}`;
    }
    return `${month}`;
  }

  async #fetchGames(username, date) {
    const url = `https://api.chess.com/pub/player/${username}/games/${date.getFullYear()}/${this.#formatMonth(date.getMonth())}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const json = await response.json();
      return json;
    } catch (error) {
      console.error(error.message);
    }
    return { games: [] };
  }

  async getPlayersGames(username) {
    if (!!username) {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const previousMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      );

      const currentResults = await this.#fetchGames(username, currentMonth);

      const previousResults = await this.#fetchGames(username, previousMonth);

      const games = currentResults.games.concat(previousResults.games);

      return games;
    }
    return [];
  }
}
