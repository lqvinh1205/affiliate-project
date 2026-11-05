import "dotenv/config";
import { defineConfig } from "vitest/config";
import baseConfig from "./vitest.config";

// Test tích hợp DB (spine AD-16): chỉ `*.db.test.ts`, chạy trên database test riêng.
// `vitest.db.setup.ts` kiểm TEST_DATABASE_URL trước khi chạm DB ([QD-07]).
// Chỉ lấy `resolve` (alias) của cấu hình chính; `include`/`exclude` khai báo lại vì mergeConfig nối mảng.
export default defineConfig({
  resolve: baseConfig.resolve,
  test: {
    include: ["**/*.db.test.ts"],
    exclude: ["node_modules/**", ".next/**", "generated/**"],
    globalSetup: ["./vitest.db.setup.ts"],
    // `platform/db` đọc DATABASE_URL lúc import; trỏ nó về DB test cho mọi file test.
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "", DIRECT_URL: "" },
    // Các file dùng chung một DB: chạy lần lượt.
    fileParallelism: false,
  },
});
