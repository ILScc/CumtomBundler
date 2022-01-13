import { readFileSync } from "node:fs";
import { parse } from "acorn";
import _traverse from "@babel/traverse";

const traverse = _traverse.default;
let ID = 0;

function createAsset(filename) {
    const fContent = readFileSync(filename, "utf-8");
    const ast = parse(fContent, {
        sourceType: "module",
        ecmaVersion: "latest",
    });
    const deps = [];
    traverse(ast, {
        ImportDeclaration: ({ node }) => {
            deps.push(node.source.value);
        },
    });
    const id = ID++;
    return {
        id,
        filename,
        deps,
    };
}
const mainAsset = createAsset("./deps/entry.js");
console.log(mainAsset);
