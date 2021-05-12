## yargs-lite

    "yargs is too heavy, and too slow"

well, maybe I'm stupid and implement `yargs` in a wrong way, but if you want to build a lite command line tool, try this one out (only ~10x faster for my own use case?)

## setup

1. go to your project directory and create `bin` folder

2. create `bin/index.js` and put `#!/usr/bin/env node` on the top of the file

3. (optional) `chmod 777 bin/index.js`

4. `package.json` : `{..."scripts":{ "myscript": "./bin/index.js" }, "bin": {"myscript": "bin/index.js"}}`

5. use `npm run myscript` or call `./bin/index.js` directly

6. under `bin/index.js` checkout [example](##example)

7. (opitonal) link you command, or put it under path variables so you can use your command directly. i.e. `sudo -u root ln -s bin/index.js /usr/bin/myscript`

## example

```js
#!/usr/bin/env node
const yargslite = require("../index");
let yargs = new yargslite();

yargs.addHelpDocEntry("--help", "general help page\ndisplay:\tdisplay storage");

yargs.addCommand("display", (storage) => console.log(storage));
yargs.addHelpDocEntry("display", "display the storage from yargs");

yargs.run();
```

---

```bash
./bin/index.js display
```

=>

```
{
  origin: { argv: [...]},
  argv: [ 'display' ],
  entry: 'display',
  _: [],
  args: {},
  kwargs: {}
}
```

---

```bash
./bin/index.js --help
./bin/index.js display --help
```

=>

```
general help page
display:      display storage

display the storage from yargs
```

```bash
./bin/index.js display 10 -a 11 -cd 12 --e --f 13
```

=>

```
{
  origin: { argv: [...]},
  argv: [ ... ],
  entry: 'display',
  _: [ '10' ],
  args: { a: [ '11' ], c: [ '12' ], d: [ '12' ] },
  kwargs: { e: [ '13' ], f: [ '13' ] }
}
```

---

## Adv.

#### Change help doc display

```js
let fancyLogger = (content) => console.log("---", content, "---");
yargs.help.helpDocDisplay = (entry, doc) => fancyLogger(doc[entry]);
```

#### Super fast doc loading

```js
yargs.help.helpDoc = require("pre-defined-doc.json");
```

#### Define your own parser

```js
yargs.addParser((storage) => {
  storage.args = { "-v": "10" };
  storage.kwargs = { "--value": "ten" };
  storage.extra = "message";
});

yargs.addCommand("test", (storage) => console.log(storage.args, storage.kwargs, storage.extra));
```

and run

`./bin/index.js test`

=>

`{ '-v': '10' } { '--value': 'ten' } message`

## pattern and logic

let's define some parameters as

`./s a b -c -d --e --f g`

and ignore the entry (full command should be something like `./bin/index.js -c a --e b`), and the default result contains `{args:{}, kwargs:{}, _:[]}`

straight-forward case example

```bash
# 1 to 1 pair
./s -c a -d b       # args:{c:[a], d:[b]}
./s --e a --f b     # kwargs:{e:[a], f:[b]}

./s a               # _:[a]
```

ambiguous case example

```bash
# n to 1 pair
./s -cd a           # args:{c:[a], d:[a]}
./s -c -d a         # args:{c:[a], d:[a]}
./s -c -d --f b     # args:{c:[b], d:[b]}    kwargs:{f:[b]}

# other example
./s a -cd b g       # _:[a], args:{c:[b,g], d:[b,g]}
./s a --f b g       # _:[a], kwargs:{f:[b,g]}
./s a b g           # _:[a,b,g]
./s a -c abg        # _:[a], args:{c:[a,b,g]}
./s a --ef b g      # _:[a], kwargs:{ef:[b,g]}

./s a -cd           # _:[a], args:{c:[], d:[]}
./s a -cd g -cd     # _:[a], args:{c:[], d:[]}
./s a ---ef         # _:[a], kwargs:{ef:[]}
```
