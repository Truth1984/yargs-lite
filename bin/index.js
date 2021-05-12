#!/usr/bin/env node

const u = require("awadau");
const yargslite = require("../index");

let yargs = new yargslite();

yargs.addHelpDocEntry("--help", "general help page\ndisplay:\tdisplay storage");

yargs.addCommand("display", (storage) => console.log(storage));
yargs.addHelpDocEntry("display", "display the storage from yargs");

yargs.addCommand("add", (storage) => {
  let num = 0;
  storage._.map((i) => (num += u.float(i)));
  console.log(num);
});

yargs.run();
