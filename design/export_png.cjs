// Export the logo SVGs to PNGs with a transparent background.
//
// Needs @resvg/resvg-js, kept out of the project's dependencies:
//   npm install --prefix /tmp/resvg @resvg/resvg-js@2.6.2
//
// Usage (from the repo root):
//   NODE_PATH=/tmp/resvg/node_modules node design/export_png.cjs public public/png
const fs = require("node:fs");
const path = require("node:path");
const { Resvg } = require("@resvg/resvg-js");

const [srcDir = "public", outDir = "public/png"] = process.argv.slice(2);
const LOGOS = ["logo-seal", "logo-mark"];
const SIZES = [512, 1024, 2048];

fs.mkdirSync(outDir, { recursive: true });
for (const name of LOGOS) {
  const svg = fs.readFileSync(path.join(srcDir, `${name}.svg`));
  for (const size of SIZES) {
    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: size },
      background: "rgba(0, 0, 0, 0)",
    })
      .render()
      .asPng();
    const out = path.join(outDir, `${name}-${size}.png`);
    fs.writeFileSync(out, png);
    console.log(out, png.length);
  }
}
