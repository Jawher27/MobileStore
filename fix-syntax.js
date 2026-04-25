const fs = require("fs");
let content = fs.readFileSync("components/supplier-admin-view.tsx", "utf8");

// The file has literal backslashes escaping backticks and dollars.
// Let's replace \\` with ` and \\$ with $
content = content.replace(/\\`/g, "`");
content = content.replace(/\\\$/g, "$");

fs.writeFileSync("components/supplier-admin-view.tsx", content);
