import { EngineWrapper } from "./engine-wrapper";
import { Chess } from "chess.js";

export class ReviewApi {
  #engine;

  constructor() {
    this.#initEngine()
      .then(() => console.log("ready"))
      .catch((err) => console.error(err));
  }

  async #initEngine() {
    const stockfish = await Stockfish();
    this.#engine = new EngineWrapper(stockfish, () => {});
    await this.#engine.initialize({ Threads: 6, UCI_ShowWDL: true });
  }

  async reviewGame(data) {
    this.#setupProgress();
    const scores = [];

    console.log("reviewing:", data);
    await this.#engine.initializeGame();
    this.#engine.send("position startpos");

    const pgn = String(data.game.pgn);

    const isWhite = data.playedAs === "White";

    const moves = this.#getMoves(pgn, isWhite);
    console.dir(moves);

    for (let c = 0; c < moves.length; c++) {
      const moveScore = await this.#evaluateMove(moves[c]);
      moveScore.index = c;
      moveScore.url = `${data.game.url.replace("/game/", "/analysis/game/")}?tab=analysis&move=${c * 2 + (isWhite ? 0 : 1)}`;
      scores.push(moveScore);
      this.#reportProgress(c, moves.length);
    }

    return scores;
  }

  async #evaluateMove(move) {
    // get score for best move
    const bestMove = await this.#getBestMove(move.before);

    // get score for actual move
    const actualScore = await this.#getBestMove(move.after);
    actualScore.move = move.san;
    actualScore.score *= -1;
    actualScore.mate *= -1;
    const loss = actualScore.win;
    actualScore.win = actualScore.loss;
    actualScore.loss = loss;

    return {
      bestMove,
      actualScore,
      scoreDiff: actualScore.score - bestMove.score,
      missedMate: bestMove.mate - actualScore.mate,
      winDiff: actualScore.win - bestMove.win,
      drawDiff: actualScore.draw - bestMove.draw,
      lossDiff: actualScore.loss - bestMove.loss,
    };
  }

  async #getBestMove(fen) {
    const DEPTH = 17; // number of halfmoves the engine looks ahead

    this.#engine.send(`position fen ${fen}`);

    this.#engine.send(`go depth ${DEPTH}`);
    const lines = await this.#engine.receiveUntil((line) =>
      line.startsWith("bestmove")
    );
    const score_line = lines[lines.length - 2];
    const score =
      Number(score_line.replace(/^.* score cp /, "").replace(/ .*$/, "")) / 100;
    const mate = Number(
      score_line.replace(/^.* score mate /, "").replace(/ .*$/, "")
    );
    const winDrawLoss = score_line
      .replace(/^.* wdl /, "")
      .replace(/ \D.*/, "")
      .split(" ")
      .map((x) => Number(x) / 10);
    const last_line = lines[lines.length - 1];
    const bestMove = last_line.split(" ")[1];

    console.log(fen, { last_line, score_line });
    let move;

    if (!!bestMove)
      try {
        const chess = new Chess(fen);
        chess.move(bestMove);
        const history = chess.history();
        move = history[history.length - 1];
      } catch {}

    return {
      move,
      score,
      mate,
      win: winDrawLoss[0],
      draw: winDrawLoss[1],
      loss: winDrawLoss[2],
    };
  }

  #getMoves(pgn, isWhite) {
    const chess = new Chess();
    chess.loadPgn(pgn);

    return chess
      .history({ verbose: true })
      .filter((move) => isWhite === (move.color === "w"));
  }

  #setupProgress() {
    document.getElementById("review-div").innerHTML = `
    <div class="progress-wrapper">
      <md-circular-progress id="review-progress-bar" value="0" max="100" indeterminate="true"></md-circular-progress>
    </div>`;
  }

  #reportProgress(step, total) {
    const percent = Math.round((Number(step) / Number(total)) * 100);
    if (percent > 10) {
      const progress = document.getElementById("review-progress-bar");
      progress.indeterminate = false;
      progress.value = percent;
    }
  }
}
