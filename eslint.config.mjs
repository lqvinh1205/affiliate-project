import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Ranh giới module (spine AD-2, AD-9, AD-17). Bảng tầng duy nhất: module chỉ import
// module ở tầng thấp hơn, cùng tầng không import nhau.
const TIERS = [
  ["categories", "style-profiles"], // T0
  ["products", "inspirations"], // T1
  ["research", "posts", "banners"], // T2
  ["engagement", "content-sets", "bio"], // T3
  ["suggestions"], // T4
];
const MODULES = TIERS.flat();

// AD-9: `modules/suggestions/actions.ts` được import `service.ts` và `prompts/` của các module này.
const AD9_ACTIONS_FILE = "modules/suggestions/actions.ts";
const AD9_TARGETS = ["posts", "products", "content-sets", "research"];

// File cũ được miễn luật `app/**` (import `@/lib/*`, `@/components/site|cms/*`, `@/platform/db`).
// Chuyển file nào sang cấu trúc mới thì bỏ nó khỏi danh sách (AD-17). Không dùng glob.
const LEGACY_APP_FILES = [
  // Chỉ còn các action AI cũ (`createPost`, `runSeoCheck`, `runThreads`, import `@/lib/ai`); chuyển ở Epic 4 (`platform/ai`).
  "app/cms/actions.ts",
];

// Đường dẫn tường minh: thoát ký tự glob như `[`, `(` trong tên route.
const literalPath = (p) => p.replace(/[[\]()*?{}!]/g, "\\$&");
const any = (names) => names.join("|");
const INTERNAL_END = "(\\.tsx?)?(/|$)";
const regex = (pattern, message) => ({ regex: pattern, message: `${message} (AD-2).` });

const LEGACY_CODE = [
  regex("^@/lib(/|$)", "Không import code cũ `@/lib/*`; dùng vị trí mới theo docs/cong-thuc/chuyen-code-cu.md"),
  regex(
    "^@/components/(site|cms)(/|$)",
    "Không import code cũ `@/components/site|cms/*`; dùng vị trí mới theo docs/cong-thuc/chuyen-code-cu.md",
  ),
];
const NO_RELATIVE_UP = regex("^\\.\\./", "Không import đường dẫn tương đối `../`; dùng alias `@/` để luật tầng kiểm được");
const NO_APP = regex("^@/app(/|$)", "Không import `@/app/*` từ ngoài `app/`: hướng phụ thuộc là app → modules → platform");

// Hạn chế cho file trong `modules/<name>/**`; `allowAd9` mở `service.ts`, `prompts/` của AD9_TARGETS.
function moduleRestrictions(name, tier, allowAd9 = false) {
  const sameOrHigher = TIERS.slice(tier).flat().filter((m) => m !== name);
  const others = MODULES.filter((m) => m !== name);
  const patterns = [];
  if (sameOrHigher.length > 0) {
    patterns.push(
      regex(
        `^@/modules/(${any(sameOrHigher)})(/|$)`,
        `Module \`${name}\` (T${tier}) chỉ được import module ở tầng thấp hơn, không import module cùng tầng hoặc tầng cao hơn`,
      ),
    );
  }
  const internalsMsg = `Không import \`service.ts\`, \`actions.ts\`, \`schema.ts\`, \`prompts/\` của module khác; chỉ dùng \`queries.ts\`, \`cms-queries.ts\`, \`types.ts\`, \`constants.ts\`, \`tags.ts\`, \`components/\``;
  if (allowAd9) {
    const rest = others.filter((m) => !AD9_TARGETS.includes(m));
    patterns.push(
      regex(`^@/modules/(${any(others)})/(actions|schema)${INTERNAL_END}`, internalsMsg),
      regex(
        `^@/modules/(${any(rest)})/(service${INTERNAL_END}|prompts(/|$))`,
        `Ngoại lệ AD-9 chỉ cho import \`service.ts\`, \`prompts/\` của ${AD9_TARGETS.join(", ")}`,
      ),
    );
  } else {
    patterns.push(regex(`^@/modules/(${any(others)})/((service|actions|schema)${INTERNAL_END}|prompts(/|$))`, internalsMsg));
  }
  patterns.push(NO_RELATIVE_UP, NO_APP, ...LEGACY_CODE);
  return ["error", { patterns }];
}

const moduleBlocks = TIERS.flatMap((names, tier) =>
  names.map((name) => ({
    files: [`modules/${name}/**/*.{ts,tsx}`],
    ignores: name === "suggestions" ? [AD9_ACTIONS_FILE] : [],
    rules: { "no-restricted-imports": moduleRestrictions(name, tier) },
  })),
);

const boundaryBlocks = [
  ...moduleBlocks,
  {
    files: [AD9_ACTIONS_FILE],
    rules: { "no-restricted-imports": moduleRestrictions("suggestions", TIERS.length - 1, true) },
  },
  {
    files: ["platform/**/*.{ts,tsx}", "components/shared/**/*.{ts,tsx}", "components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            regex("^@/modules(/|$)", "`platform/` và `components/` không import `modules/`"),
            NO_RELATIVE_UP,
            NO_APP,
            ...LEGACY_CODE,
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    // Test DB của route (`*.db.test.ts`) dựng dữ liệu bằng `db`/`service`: luật riêng ở khối dưới.
    ignores: [...LEGACY_APP_FILES.map(literalPath), "app/**/*.db.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            regex(`^@/platform/db${INTERNAL_END}`, "`app/` không import `@/platform/db`; đọc qua `queries.ts` của module"),
            regex(`^@/modules/[^/]+/service${INTERNAL_END}`, "`app/` không import `service.ts`; gọi qua `actions.ts` của module"),
            NO_RELATIVE_UP,
            ...LEGACY_CODE,
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/*.db.test.ts"],
    ignores: LEGACY_APP_FILES.map(literalPath),
    rules: { "no-restricted-imports": ["error", { patterns: [NO_RELATIVE_UP, ...LEGACY_CODE] }] },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: { "import/no-cycle": "error" },
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...boundaryBlocks,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
