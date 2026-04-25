const fs = require("fs");
let content = fs.readFileSync("components/supplier-admin-view.tsx", "utf8");

// Fix stock update for colors
content = content.replace(
  ".update({ colors: newColors })",
  ".update({ colors: newColors, stock: Math.max(0, prod.stock - item.quantity) })",
);

// Replace status
content = content.replace(/'delivering'/g, "'approved'");
content = content.replace(/"delivering"/g, '"approved"');

fs.writeFileSync("components/supplier-admin-view.tsx", content);
console.log("Fixed stock and statuses in supplier-admin-view.tsx");
