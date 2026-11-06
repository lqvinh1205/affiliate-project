import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // "server-only" ném lỗi ngoài React Server; test dùng file rỗng có sẵn trong chính gói.
      { find: /^server-only$/, replacement: fromRoot("./node_modules/server-only/empty.js") },
      // "@/" như paths trong tsconfig.json.
      { find: /^@\//, replacement: fromRoot("./") },
    ],
  },
  test: {
    include: ["**/*.test.ts"],
    // Test tích hợp DB chạy riêng bằng `npm run test:db` (vitest.db.config.ts).
    exclude: ["node_modules/**", ".next/**", "generated/**", "**/*.db.test.ts"],
    // Suite không bao giờ gọi AI thật (spine AD-16): `platform/ai` dùng nhà giả lập.
    env: { AI_PROVIDERS: "fake" },
  },
});
