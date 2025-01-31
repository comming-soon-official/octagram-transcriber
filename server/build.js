const { build } = require("esbuild");
const path = require("path");
const { execSync } = require("child_process");

const sharedConfig = {
  bundle: true,
  minify: false,
};

execSync("rm -rf dist");

const entries = {
  server: path.resolve(__dirname, "src/index.ts"),
};

Object.entries(entries).map((value) => {
  const [name, path] = value;

  build({
    ...sharedConfig,
    entryPoints: [path],
    platform: "node", // for CJS
    target: "esnext",
    tsconfig: "./tsconfig.json",
    outfile: `dist/${name}.bundle.js`,
    sourcemap: true,
    plugins: [],
    loader: { ".node": "file" },
  });
});
