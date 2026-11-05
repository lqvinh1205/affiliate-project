import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync, rmdirSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Kiểm luật ranh giới module trong eslint.config.mjs theo I/O Matrix của Story 1.3 (AD-2, AD-9).
const root = fileURLToPath(new URL(".", import.meta.url));
const eslint = new ESLint({ cwd: root });
// `import/no-cycle` lỗi khi file ảo (không có trên đĩa) import file thật, nên tắt nó khi lint file ảo;
// luật này được kiểm riêng bằng file thật ở cuối.
const eslintVirtual = new ESLint({ cwd: root, overrideConfig: { rules: { "import/no-cycle": "off" } } });

async function restricted(filePath: string, code: string) {
  const [result] = await eslintVirtual.lintText(code, { filePath: join(root, filePath) });
  return result.messages.filter((m) => m.ruleId === "no-restricted-imports");
}

describe("ranh giới module (no-restricted-imports)", () => {
  it("module tầng thấp import module tầng cao thì báo lỗi nêu AD-2", async () => {
    const errors = await restricted("modules/products/x.ts", `import { a } from "@/modules/posts/queries";\nexport { a };\n`);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("AD-2");
  });

  it("module cùng tầng import nhau thì báo lỗi", async () => {
    const errors = await restricted("modules/posts/x.ts", `import { a } from "@/modules/research/queries";\nexport { a };\n`);
    expect(errors).toHaveLength(1);
  });

  it.each(["service", "actions", "schema", "prompts/web.prompt"])(
    "import `%s` của module khác thì báo lỗi",
    async (file) => {
      const errors = await restricted("modules/posts/x.ts", `import { a } from "@/modules/products/${file}";\nexport { a };\n`);
      expect(errors).toHaveLength(1);
    },
  );

  it("import hợp lệ giữa module và trong cùng module không báo lỗi", async () => {
    const fromSuggestions = await restricted(
      "modules/suggestions/x.ts",
      [
        `import { a } from "@/modules/posts/queries";`,
        `import { b } from "@/modules/categories/types";`,
        `import { c } from "@/modules/products/tags";`,
        `import { d } from "@/modules/products/components/y";`,
        `export { a, b, c, d };`,
      ].join("\n"),
    );
    const withinPosts = await restricted("modules/posts/x.ts", `import { a } from "@/modules/posts/service";\nexport { a };\n`);
    expect(fromSuggestions).toEqual([]);
    expect(withinPosts).toEqual([]);
  });

  it("ngoại lệ AD-9: suggestions/actions.ts được import service và prompts của module đích", async () => {
    const errors = await restricted(
      "modules/suggestions/actions.ts",
      [
        `import { a } from "@/modules/posts/service";`,
        `import { b } from "@/modules/research/prompts/z.prompt";`,
        `export { a, b };`,
      ].join("\n"),
    );
    expect(errors).toEqual([]);
  });

  it("ngoại lệ AD-9 không mở actions/schema hay service của module ngoài danh sách", async () => {
    const errors = await restricted(
      "modules/suggestions/actions.ts",
      [
        `import { a } from "@/modules/posts/actions";`,
        `import { b } from "@/modules/products/schema";`,
        `import { c } from "@/modules/categories/service";`,
        `export { a, b, c };`,
      ].join("\n"),
    );
    expect(errors).toHaveLength(3);
  });

  it.each(["service/inner", "service.ts", "actions.ts", "schema/x"])(
    "import đường dẫn con `%s` của module khác thì báo lỗi",
    async (file) => {
      const errors = await restricted("modules/posts/x.ts", `import { a } from "@/modules/products/${file}";\nexport { a };\n`);
      expect(errors).toHaveLength(1);
    },
  );

  it("module import `@/app/*` thì báo lỗi", async () => {
    const errors = await restricted("modules/posts/x.ts", `import { a } from "@/app/cms/layout";\nexport { a };\n`);
    expect(errors).toHaveLength(1);
  });

  it.each([
    ["modules/products/x.ts", "../posts/queries"],
    ["modules/posts/x.ts", "../products/service"],
    ["modules/suggestions/actions.ts", "../posts/service"],
    ["platform/x.ts", "../modules/posts/queries"],
    ["components/shared/x.ts", "../../modules/posts/queries"],
    ["components/ui/x.ts", "../../modules/posts/queries"],
    ["app/cms/moi/page.tsx", "../../../modules/posts/service"],
  ])("%s import tương đối `%s` thì báo lỗi", async (file, spec) => {
    const errors = await restricted(file, `import { a } from "${spec}";\nexport { a };\n`);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("@/");
  });

  it.each(["platform/x.ts", "components/shared/x.ts", "components/ui/x.ts"])(
    "%s import modules hoặc app thì báo lỗi",
    async (file) => {
      const errors = await restricted(
        file,
        `import { a } from "@/modules/posts/queries";\nimport { b } from "@/app/cms/layout";\nexport { a, b };\n`,
      );
      expect(errors).toHaveLength(2);
    },
  );

  it("file mới trong app/ import đường dẫn con của platform/db hoặc service thì báo lỗi", async () => {
    const errors = await restricted(
      "app/cms/moi/page.tsx",
      `import { db } from "@/platform/db/client";\nimport { a } from "@/modules/posts/service/inner";\nexport { db, a };\n`,
    );
    expect(errors).toHaveLength(2);
  });

  it("file mới trong app/ import platform/db hoặc service thì báo lỗi", async () => {
    const errors = await restricted(
      "app/cms/moi/page.tsx",
      `import { db } from "@/platform/db";\nimport { a } from "@/modules/posts/service";\nexport { db, a };\n`,
    );
    expect(errors).toHaveLength(2);
  });

  it.each(["modules/posts/x.ts", "platform/x.ts", "app/cms/moi/page.tsx"])(
    "file mới %s import code cũ thì báo lỗi",
    async (file) => {
      const errors = await restricted(
        file,
        [
          `import { a } from "@/lib/posts";`,
          `import { b } from "@/components/site/x";`,
          `import { c } from "@/components/cms/x";`,
          `export { a, b, c };`,
        ].join("\n"),
      );
      expect(errors).toHaveLength(3);
    },
  );
});

describe("vòng import (import/no-cycle)", () => {
  const modulesDir = join(root, "modules");
  const createdModulesDir = !existsSync(modulesDir);
  let dir = "";

  beforeAll(() => {
    mkdirSync(modulesDir, { recursive: true });
    dir = mkdtempSync(join(modulesDir, "tmp-no-cycle-"));
    writeFileSync(join(dir, "a.ts"), `import { b } from "./b";\nexport const a = () => b();\n`);
    // Một chiều qua alias `@/` để chắc resolver TypeScript hiểu paths trong tsconfig.
    writeFileSync(join(dir, "b.ts"), `import { a } from "@/${relative(root, dir)}/a";\nexport const b = () => a();\n`);
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
    if (createdModulesDir && readdirSync(modulesDir).length === 0) rmdirSync(modulesDir);
  });

  it("hai file trong module import vòng nhau thì báo lỗi", async () => {
    const [result] = await eslint.lintFiles([relative(root, join(dir, "a.ts"))]);
    expect(result.messages.filter((m) => m.ruleId === "import/no-cycle")).toHaveLength(1);
  }, 30_000);
});
