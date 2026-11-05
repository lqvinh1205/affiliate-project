import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // CLI (migrate) cần kết nối trực tiếp, không qua pgbouncer. DIRECT_URL rỗng (test DB) → DATABASE_URL.
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
