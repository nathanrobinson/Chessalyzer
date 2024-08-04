import { Queue } from "./queue";
//
// UCI Engine wrapper
//
export class EngineWrapper {
  constructor(engine, log = console.log) {
    this.engine = engine;
    this.queue = new Queue();
    this.engine.addMessageListener((line) => this.queue.put(line));
    this.log = log;
  }

  send(command) {
    this.log(">>(engine)", command);
    this.engine.postMessage(command);
  }

  async receive() {
    const line = await this.queue.get();
    this.log("<<(engine)", line);
    return line;
  }

  async receiveUntil(predicate) {
    const lines = [];
    while (true) {
      const line = await this.receive();
      lines.push(line);
      if (predicate(line)) {
        break;
      }
    }
    return lines;
  }

  async waitReadyAsync() {
    this.send("isready");
    await this.receiveUntil((line) => line === "readyok");
  }

  async initialize(options = {}) {
    this.send("uci");
    await this.receiveUntil((line) => line === "uciok");
    for (const name in options) {
      this.send(`setoption name ${name} value ${options[name]}`);
    }
    this.send("isready");
    await this.receiveUntil((line) => line === "readyok");
  }

  async initializeGame() {
    this.send("ucinewgame");
    this.send("isready");
    await this.receiveUntil((line) => line === "readyok");
  }
}
