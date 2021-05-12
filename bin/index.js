#!/usr/bin/env node

const yargslite = require("../index");

let yargs = new yargslite();

yargs.addHelpDocEntry("--help", "general help page\ndisplay:\tdisplay storage");

yargs.addCommand("display", (storage) => console.log(storage));
yargs.addHelpDocEntry("display", "display the storage from yargs");

yargs.run();
