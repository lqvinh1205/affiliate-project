import { describe, expect, it } from "vitest";
import type { ResearchProfileData } from "@/modules/research/types";
import { describeSource, SOURCE_MAX } from "@/modules/suggestions/content-source";

// Hồ sơ đầy cỡ giới hạn nghiên cứu (~11k ký tự): một mình đã gần hết ngân sách nguồn.
function fullProfile(tag: string): ResearchProfileData {
  return {
    info: Array.from({ length: 8 }, (_, i) => ({ id: `info-${i}`, text: `${tag} ${"i".repeat(590)}`, sourceUrl: null })),
    infoNote: "n".repeat(300),
    imageDescription: "a".repeat(1500),
    reviewSummary: {
      praise: Array.from({ length: 5 }, () => "p".repeat(300)),
      complaints: Array.from({ length: 5 }, () => "c".repeat(300)),
      fit: Array.from({ length: 5 }, () => "f".repeat(300)),
    },
    audiences: [],
    angles: [],
  } as unknown as ResearchProfileData;
}

describe("describeSource (nguồn cho prompt Bộ nội dung)", () => {
  it("bộ 3 Sản phẩm hồ sơ đầy: cả 3 Sản phẩm đều vào nguồn, tổng ≤ SOURCE_MAX", () => {
    const names = ["Nồi", "Chảo", "Kệ"];
    const out = describeSource(
      names.map((name) => ({ name })),
      names.map((n) => fullProfile(n)),
      null,
    );
    expect(out.length).toBeLessThanOrEqual(SOURCE_MAX);
    for (const [i, n] of names.entries()) expect(out).toContain(`Sản phẩm ${i + 1}: ${n}`);
  });

  it("bộ từ Bài web có sẵn: bài (nguồn chính) đứng đầu và không bị cắt mất bởi hồ sơ Sản phẩm", () => {
    const out = describeSource(
      [{ name: "Nồi" }, { name: "Chảo" }],
      [fullProfile("Nồi"), fullProfile("Chảo")],
      { title: "Mẹo dùng nồi", excerpt: "Tóm tắt", content: `<p>Lót giấy nến.</p><p>${"b".repeat(3000)}</p>` },
    );
    expect(out.length).toBeLessThanOrEqual(SOURCE_MAX);
    expect(out.startsWith("Bài web có sẵn (nguồn chính):")).toBe(true);
    expect(out).toContain("Lót giấy nến.");
    expect(out).toContain("Sản phẩm 2: Chảo");
  });

  it("nguồn ngắn giữ nguyên, không thêm dấu cắt", () => {
    const out = describeSource([{ name: "Nồi" }], [null], null);
    expect(out).toBe("Sản phẩm 1: Nồi\n- (chưa có Hồ sơ nghiên cứu)");
  });
});
