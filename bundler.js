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
    const fillGraph = (filepath) => {
        const asset = createAsset(filepath);
        const { id, deps } = asset;
        const dirname = path.dirname(filepath);
        graph[id] = asset;
        graph[id].mapping = {};
        if (id) {
            graph[id - 1].mapping[filepath] = id;
        }
        if (!deps.length) {
            return;
        }

        deps.forEach((child) => {
            const abspath = path.join(dirname, child);
            fillGraph(abspath);
        });
    };
    fillGraph(entry);
    return graph;
}
console.log(createGraph("deps/entry.js"));
