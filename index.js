const tasklanguage2 = require("tl2");
const u = require("awadau");

/**
 * @typedef {(storage:{origin:{argv:{}},argv:{},entry?:string})=>{}} parserFunc
 * @typedef {(storage:{origin:{argv:{}},argv:{},entry?:string, _?:[], args?:{}, kwargs?:{}})=>{}} performFunc
 */
module.exports = class {
  constructor() {
    this.storage = {};
    this._tl2 = new tasklanguage2(this.storage);
    this._execution = {};
    this.help = {
      helpDoc: {},
      helpDocDisplay: async (entry, doc) => console.log(doc[entry]),
    };
  }

  addHelpDocEntry(entry, doc) {
    this.help.helpDoc[entry] = doc;
  }

  /**
   * @param {parserFunc} parserFunc
   */
  addParser(parserFunc = async () => {}) {
    this.parser = parserFunc;
  }

  /**
   * @param {string} entryName
   * @param {performFunc} performFunc
   */
  addCommand(entryName, performFunc = async () => {}) {
    this._execution[entryName] = performFunc;
  }

  async run() {
    let tl2 = this._tl2;
    tl2.add("<initialize>", (storage) => {
      storage.origin = { argv: process.argv };
      storage.argv = u.arrayExtract(process.argv, 2);
    });

    tl2.add("<collect>", (storage) => {
      storage.entry = storage.argv[0];
    });

    tl2.add("<doc>", async (storage, next) => {
      if (u.contains(storage.argv, ["--help"])) {
        await this.help.helpDocDisplay(storage.entry, this.help.helpDoc);
        return next("<final>");
      }
    });

    tl2.add("<parsing>", (storage) => {
      if (!this.parser) {
        this.parser = (storage) => {
          let argv = storage.argv;
          storage._ = [];
          storage.args = {};
          storage.kwargs = {};
          if (u.len(argv) == 1) return;

          let keyLenFinder = (key) => u.len(u.refind(key.toString(), /^-{0,}/));
          let keyFinder = (key) => u.reSub(key, /^-+/, "");
          let previous = { status: "open", target: [storage._] };

          let equalProcess = () => {
            let product = [];
            let unfold = (i) => [
              u.refind(i, u.regexBetweenOutNonGreedy(/^/, "=")),
              u.refind(i, u.regexBetweenOutNonGreedy("=", "$")),
            ];
            for (let i of u.arrayExtract(argv, 1))
              product = u.arrayAdd(product, ...(u.refind(i, /^-+\w+=/) ? unfold(i) : [i]));
            return product;
          };

          // previous: {status: open}
          // 0 : previous.target all add
          // 1+ : set previous target [] -> {status: close}

          // previous: {status: close}
          // 0 : previous.target all add -> {status: open}
          // 1+ : push to previous.target []

          for (let i of equalProcess()) {
            let amount = keyLenFinder(i);
            if (amount < 0) throw `yargs-lite can't convert ${i} to string`;

            if (amount == 0) {
              for (let j of previous.target) j.push(i);
              if (previous.status == "close") previous.status = "open";
              continue;
            }

            let key = keyFinder(i);
            if (amount == 1) for (let k of key) storage.args[k] = [];
            if (amount > 1) storage.kwargs[key] = [];

            if (previous.status == "close") {
              if (amount == 1) for (let k of key) previous.target.push(storage.args[k]);
              if (amount > 1) previous.target.push(storage.kwargs[key]);
            } else {
              if (amount == 1) {
                previous.target = [];
                for (let k of key) previous.target.push(storage.args[k]);
              }
              if (amount > 1) previous.target = [storage.kwargs[key]];
              previous.status = "close";
            }
          }
        };
      }
      this.parser.bind(storage);
      this.parser(storage);
    });

    tl2.add("<distribute>", (storage, next) => {
      if (!this._execution[storage.entry]) return next("<final>");
      return this._execution[storage.entry](storage);
    });

    tl2.add("<final>", tl2._NOOP);

    return tl2.runAuto();
  }
};
