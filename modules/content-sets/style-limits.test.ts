import { describe, expect, it } from "vitest";
import { FACEBOOK_WORDS_MAX, THREADS_PARTS_MAX, THREADS_POST_MAX } from "@/modules/content-sets/constants";
import { WEB_POST_SECTIONS_MAX, WEB_POST_WORDS_MAX } from "@/modules/posts/constants";
import { STYLE_HARD_LIMITS } from "@/modules/style-profiles/constants";

// AD-25: giới hạn cứng nằm ở module chủ nội dung; `style-profiles` (tầng T0) không import được nên chép lại — test này
// giữ hai nơi bằng nhau.
describe("giới hạn cứng của Hồ sơ phong cách khớp module chủ", () => {
  it("Website theo `posts`, Threads/Facebook theo `content-sets`", () => {
    expect(STYLE_HARD_LIMITS.WEBSITE).toEqual({ lengthMax: WEB_POST_WORDS_MAX, partsMax: WEB_POST_SECTIONS_MAX });
    expect(STYLE_HARD_LIMITS.THREADS).toEqual({ lengthMax: THREADS_POST_MAX, partsMax: THREADS_PARTS_MAX });
    expect(STYLE_HARD_LIMITS.FACEBOOK).toEqual({ lengthMax: FACEBOOK_WORDS_MAX, partsMax: null });
  });
});
