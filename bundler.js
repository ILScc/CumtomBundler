const fs = require("node:fs");
const acorn = require("acorn");

function createAsset(filename) {
    const fContent = fs.readFileSync(filename, "utf-8");
    const ast = acorn.parse(fContent, {
        sourceType: "module",
        ecmaVersion: "latest",
    });
    console.log(ast);
}
createAsset("./deps/entry.js");
