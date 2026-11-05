import { describe, expect, it } from "vitest";
import { acceptAttribute, IMAGE_MAX_BYTES, uploadError, VIDEO_MAX_BYTES } from "@/platform/upload-rules";

describe("uploadError", () => {
  it("nhận ảnh > 10 MB trong giới hạn ảnh", () => {
    expect(uploadError("image/jpeg", 12 * 1024 * 1024)).toBeNull();
  });

  it("nhận video tới 100 MB, từ chối quá 100 MB", () => {
    expect(uploadError("video/mp4", VIDEO_MAX_BYTES)).toBeNull();
    expect(uploadError("video/mp4", VIDEO_MAX_BYTES + 1)).toBe("Video tối đa 100 MB");
  });

  it("ảnh quá giới hạn báo tiếng Việt", () => {
    expect(uploadError("image/png", IMAGE_MAX_BYTES + 1)).toBe("Ảnh tối đa 25 MB");
  });

  it.each(["application/x-msdownload", "image/svg+xml", "text/html", ""])("từ chối loại %s", (type) => {
    expect(uploadError(type, 10)).toMatch(/^Chỉ nhận ảnh/);
  });

  it("trường chỉ nhận ảnh thì từ chối video", () => {
    expect(uploadError("video/mp4", 10, "image")).toBe("Chỉ nhận ảnh JPG, PNG, WebP, GIF hoặc AVIF");
  });

  it("file rỗng bị từ chối; chưa biết dung lượng thì chỉ kiểm loại", () => {
    expect(uploadError("image/png", 0)).toBe("File rỗng, chọn file khác");
    expect(uploadError("image/png", null)).toBeNull();
  });
});

describe("acceptAttribute", () => {
  it("trường ảnh không có loại video", () => {
    expect(acceptAttribute("image")).not.toContain("video/");
    expect(acceptAttribute("media")).toContain("video/mp4");
  });
});
