import { readFileSync } from "node:fs";
import babelParser from "@babel/parser";
import _traverse from "@babel/traverse";
import { transformFromAst } from "@babel/core";
import path from "node:path";

const traverse = _traverse.default;

let ID = 0;
function createAsset(filename) {
    const content = readFileSync(filename, "utf-8");
    const ast = babelParser.parse(content, {
        sourceType: "module",
    });
    const deps = [];
    traverse(ast, {
        ImportDeclaration: ({ node }) => {
            deps.push(node.source.value);
        },
    });
    const { code } = transformFromAst(ast, null, {
        presets: ["@babel/env"],
    });

    const id = ID++;
    return {
        id,
        filename,
        deps,
        code,
    };
}

function createGraph(entry) {
    const mainAsset = createAsset(entry);

    const graph = [mainAsset];

    for (const asset of graph) {
        asset.mapping = {};
        const { filename, deps } = asset;
        const dirname = path.dirname(filename);

        deps.forEach((relativePath) => {
            const absolutePath = path.join(dirname, relativePath);

            const child = createAsset(absolutePath);

            asset.mapping[relativePath] = child.id;

            graph.push(child);
        });
    }

    return graph;
}

function bundle(graph) {
    let modules = "";
    graph.forEach((mod) => {
        modules += `${mod.id}: [
            function (require, module, exports) {
              ${mod.code}
            },
            ${JSON.stringify(mod.mapping)},
          ],`;
    });
    const result = `
    (function(modules){
        function require(id){
            const [fn, mapping] = modules[id];

            function localRequire(name){
                return require(mapping[name])
            };
            const module = { exports: {} };
            fn(localRequire, module, module.exports);
            return module.exports;
        }
        require(0);
    })({${modules}})
`;
    return result;
}

const graph = createGraph("deps/entry.js");
const result = bundle(graph);
console.log(result);
