const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "public", "roadmaps");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

function fixJsonLiteralNewlines(text) {
  let result = "";
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    let char = text[i];

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      result += char;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString && (char === "\n" || char === "\r")) {
      if (char === "\r") {
        if (text[i + 1] === "\n") {
          i++; // skip \n
        }
      }
      result += "\\n";
    } else {
      result += char;
    }
  }
  return result;
}

let count = 0;
files.forEach((file) => {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, "utf8");
  let fixed = fixJsonLiteralNewlines(content);

  // Also verify it parses correctly now
  try {
    JSON.parse(fixed);
    fs.writeFileSync(p, fixed);
    count++;
  } catch (e) {
    console.error("Failed to parse fixed JSON for " + file + ":", e.message);
  }
});
console.log("Fixed " + count + " files.");
