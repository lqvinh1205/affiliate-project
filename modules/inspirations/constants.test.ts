import { describe, expect, it } from "vitest";
import { inspirationFilterOf } from "@/modules/inspirations/constants";

describe("inspirationFilterOf (UX-DR76)", () => {
  it("giá trị đã biết → bộ lọc đó; thiếu hoặc lạ → Mới", () => {
    expect(inspirationFilterOf("bo-qua").status).toBe("SKIPPED");
    expect(inspirationFilterOf("da-dung").status).toBe("USED");
    for (const v of ["", "abc", "MOI", "NEW"]) expect(inspirationFilterOf(v).status).toBe("NEW");
  });
});
