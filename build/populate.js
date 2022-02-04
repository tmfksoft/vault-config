#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = __importDefault(require("./index"));
console.log("Populating Vault Overrides, please wait!");
index_1.default.populate().then(function () {
    console.log("Done!");
    console.log("Please check that 'vault.json' looks correct.");
});
