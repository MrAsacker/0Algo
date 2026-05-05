const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "public", "roadmaps");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

let count = 0;
files.forEach((file) => {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, "utf8");

  // 1. Ensure newline before closing ``` if it's immediately after code
  content = content.replace(/([^\n])```/g, "$1\n```");

  // 2. Ensure newline after opening ``` if it's missing
  content = content.replace(
    /```(?!\\n)(?!json|js|python|cpp|java|c\+\+|javascript|ts|typescript|pseudocode|text|html|css)([A-Za-z0-9])/g,
    "```\n$1"
  );

  // 3. Basic newline additions inside code blocks
  content = content.replace(/```([\s\S]*?)```/g, (match, inner) => {
    let fixed = inner;
    fixed = fixed.replace(/\)if /g, ")\nif ");
    fixed = fixed.replace(/\{if /g, "{\nif ");
    fixed = fixed.replace(/\)return /g, ")\nreturn ");
    fixed = fixed.replace(/\}else/g, "}\nelse");
    fixed = fixed.replace(/;([a-zA-Z])/g, ";\n$1");
    return "```" + fixed + "```";
  });

  fs.writeFileSync(p, content);
  count++;
});
console.log("Processed " + count + " files.");
