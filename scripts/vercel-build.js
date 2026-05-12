const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
const dbUrl = process.env.DATABASE_URL || "";
const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

if (isPostgres) {
  console.log("🔄 PostgreSQL detected — rewriting schema for production...");
  let schema = fs.readFileSync(schemaPath, "utf-8");
  schema = schema
    .replace(/provider\s*=\s*"sqlite"/, 'provider  = "postgresql"')
    .replace(
      /url\s*=\s*env\("DATABASE_URL"\)/,
      'url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")'
    );
  fs.writeFileSync(schemaPath, schema);
  console.log("✅ Schema updated to PostgreSQL");

  console.log("🔄 Running prisma db push...");
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
}

console.log("🔄 Running prisma generate...");
execSync("npx prisma generate", { stdio: "inherit" });

console.log("🔄 Running next build...");
execSync("npx next build", { stdio: "inherit" });
