const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "..", "node_modules", "base32.js", "index.js");

if (!fs.existsSync(target)) {
  process.exit(0);
}

const before = "return new Buffer(bytes);";
const after = "return Buffer.from(bytes);";
const source = fs.readFileSync(target, "utf8");

if (source.includes(after)) {
  process.exit(0);
}

if (!source.includes(before)) {
  console.warn("base32.js patch skipped: expected Buffer constructor call was not found.");
  process.exit(0);
}

fs.writeFileSync(target, source.replace(before, after));
