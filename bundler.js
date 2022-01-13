import { readFileSync } from "node:fs";
import { parse } from "acorn";
import _traverse from "@babel/traverse";
import path from "node:path";

const traverse = _traverse.default;

let ID = 0;
function createAsset(filename) {
    const content = readFileSync(filename, "utf-8");
    const ast = parse(content, {
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

function createGraph(entry) {
    const graph = {};
    const buildDepsGraph = (entryPoint) => {
        const asset = createAsset(entryPoint);
        const { id, deps, filename } = asset;
        const dirname = path.dirname(filename);
        if (!deps.length) {
            return;
        }
        graph[id] = asset;
        deps.forEach((child) => {
            buildDepsGraph(path.join(dirname, child));
        });
    };
    buildDepsGraph(entry);
    return graph;
}
console.log(createGraph("deps/entry.js"));
