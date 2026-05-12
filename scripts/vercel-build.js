const { execSync } = require("child_process");

console.log("Running prisma generate...");
execSync("npx prisma generate", { stdio: "inherit" });

console.log("Running next build...");
execSync("npx next build", { stdio: "inherit" });
