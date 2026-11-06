import { describe, expect, it } from "vitest";
import { cleanRiskWarnings, RISK_SENTENCE_MAX, RISK_WARNINGS_MAX } from "@/platform/ai/rules";

describe("cleanRiskWarnings (FR-23)", () => {
  it("cắt khoảng trắng, bỏ câu trống và câu trùng, lý do trống có câu mặc định", () => {
    expect(
      cleanRiskWarnings([
        { sentence: " Chắc chắn hết mụn ", reason: " Cam kết tuyệt đối " },
        { sentence: "Chắc chắn hết mụn", reason: "trùng" },
        { sentence: " ", reason: "x" },
        { sentence: "Chỉ 99k", reason: "" },
      ]),
    ).toEqual([
      { sentence: "Chắc chắn hết mụn", reason: "Cam kết tuyệt đối" },
      { sentence: "Chỉ 99k", reason: "Câu có thể gây rủi ro" },
    ]);
  });

  it("giới hạn độ dài câu và số mục", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ sentence: `${i}${"x".repeat(600)}`, reason: "r" }));
    const out = cleanRiskWarnings(many);
    expect(out).toHaveLength(RISK_WARNINGS_MAX);
    expect(out[0].sentence).toHaveLength(RISK_SENTENCE_MAX);
  });
});
