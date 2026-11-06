import { describe, expect, it } from "vitest";
import { scoreRiskEval } from "@/scripts/risk-eval/score";

const samples = [
  { text: "Hiệu quả 100% sau một lần dùng.", risky: true },
  { text: "Chữa khỏi mụn trong 3 ngày.", risky: true },
  { text: "Nồi rửa được bằng máy rửa bát.", risky: false },
  { text: "Màu kem, hợp bếp nhỏ.", risky: false },
];

describe("scoreRiskEval (FR-23)", () => {
  it("mục rỗng hoặc mảnh ngắn không khớp câu nào", () => {
    const r = scoreRiskEval(samples, [
      { sentence: "   ", reason: "x" },
      { sentence: "100%", reason: "x" },
    ]);
    expect(r.caught).toBe(0);
    expect(r.falsePositive).toHaveLength(0);
    expect(r.pass).toBe(false);
  });

  it("khớp cả câu sau chuẩn hoá (hoa/thường, khoảng trắng, dấu chấm cuối)", () => {
    const r = scoreRiskEval(samples, [
      { sentence: " hiệu quả 100%   sau một lần dùng ", reason: "x" },
      { sentence: "Chữa khỏi mụn trong 3 ngày.", reason: "x" },
      { sentence: "Màu kem, hợp bếp nhỏ.", reason: "x" },
    ]);
    expect(r).toMatchObject({ caught: 2, recall: 1, fpr: 0.5, pass: false });
    expect(r.falsePositive.map((s) => s.text)).toEqual(["Màu kem, hợp bếp nhỏ."]);
  });
});
