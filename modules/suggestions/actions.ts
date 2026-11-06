"use server";

import { updateTag } from "next/cache";
import { after } from "next/server";
import type { Platform, SuggestionKind } from "@/generated/prisma/enums";
import { ask } from "@/platform/ai/ask";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { firstError } from "@/platform/validation/errors";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import { getContentSetForCms, getContentSetIdForPostForCms } from "@/modules/content-sets/cms-queries";
import { PLATFORM_PART_LABEL, type SocialPlatform } from "@/modules/content-sets/constants";
import { facebookPayloadSchema, facebookPostPrompt, toFacebookPayload } from "@/modules/content-sets/prompts/facebook-post.prompt";
import {
  LinkCommentTooLongError,
  linkCommentPayloadSchema,
  linkCommentPrompt,
  linkCommentSchemaFor,
  toLinkCommentPayload,
} from "@/modules/content-sets/prompts/link-comment.prompt";
import {
  threadsApprovalSchema,
  threadsPayloadSchema,
  threadsPostPrompt,
  toThreadsPayload,
  type SocialPostInput,
} from "@/modules/content-sets/prompts/threads-post.prompt";
import {
  createContentSetRecord,
  setContentSetPostRecord,
  setContentSetProductsRecord,
  setLinkCommentRecord,
  upsertSocialPostRecord,
} from "@/modules/content-sets/service";
import { CONTENT_SETS_TAG } from "@/modules/content-sets/tags";
import { getPostForCms } from "@/modules/posts/cms-queries";
import { toWebPostPayload, webPostPayloadSchema, webPostPrompt } from "@/modules/posts/prompts/web-post.prompt";
import { applyWebPostSuggestionRecord } from "@/modules/posts/service";
import { POSTS_TAG } from "@/modules/posts/tags";
import { getProductForCms } from "@/modules/products/cms-queries";
import { setProductCategoryRecord } from "@/modules/products/service";
import { PRODUCTS_TAG } from "@/modules/products/tags";
import {
  productCategoryPayloadSchema,
  researchProductPrompt,
  researchProfileSchema,
  toResearchPayloads,
} from "@/modules/research/prompts/research-product.prompt";
import { getResearchProfileForCms } from "@/modules/research/cms-queries";
import type { ResearchProfileData } from "@/modules/research/types";
import { upsertResearchProfileRecord } from "@/modules/research/service";
import { getStyleProfileForCms } from "@/modules/style-profiles/cms-queries";
import { getSuggestionForCms } from "@/modules/suggestions/cms-queries";
import { describeSource } from "@/modules/suggestions/content-source";
import { RESEARCH_TAG } from "@/modules/research/tags";
import {
  CONTENT_SET_KINDS,
  GENERATING_TIMEOUT_MS,
  PART_FAILED,
  RESEARCH_FAILED,
  type ContentSetKind,
} from "@/modules/suggestions/constants";
import {
  addContentSetPlatformInputSchema,
  approveSuggestionInputSchema,
  createContentSetInputSchema,
  createSocialFromPostInputSchema,
  recordSuggestionCopyInputSchema,
  regenerateSuggestionInputSchema,
  rejectSuggestionInputSchema,
  researchProductInputSchema,
  type AddContentSetPlatformInput,
  type ApproveSuggestionInput,
  type CreateContentSetInput,
  type CreateSocialFromPostInput,
  type RecordSuggestionCopyInput,
  type RegenerateSuggestionInput,
  type RejectSuggestionInput,
  type ResearchProductInput,
} from "@/modules/suggestions/schema";
import {
  approveSuggestionRecord,
  completeResearchRecords,
  completeSuggestionRecord,
  failSuggestionsRecord,
  recordSuggestionCopyRecord,
  rejectSuggestionRecord,
  startContentSetPartsRecord,
  startResearchRecords,
  type ApprovingSuggestion,
  type ContentSetPartSpec,
} from "@/modules/suggestions/service";

// Điểm điều phối duy nhất cho tạo và Duyệt Gợi ý AI (spine AD-9). Tạo: ghi `GENERATING`, trả về ngay, gọi AI trong
// `after()` (AD-18); callback chỉ ghi `Suggestion` (CMS, không cache) nên không `updateTag`. Duyệt: một transaction
// upsert vào đích rồi `updateTag` tag của module đích.

type Product = NonNullable<Awaited<ReturnType<typeof getProductForCms>>>;

const PRODUCT_NOT_FOUND = "Không tìm thấy Sản phẩm. Có thể đã bị xoá.";

// Nghiên cứu Sản phẩm (FR-6..FR-11): một lần gọi AI có tìm web và đọc ảnh, ghi thành hai gợi ý `RESEARCH`
// và `PRODUCT_CATEGORY`. Dùng cho cả lần đầu và Tạo lại kèm chỉ dẫn (FR-21): Tạo lại thay cả hai gợi ý đang chờ.
export async function researchProduct(input: ResearchProductInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = researchProductInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { productId, instruction } = parsed.data;
    const product = await getProductForCms(productId);
    if (!product) throw new UserError(PRODUCT_NOT_FOUND);
    const ids = await startResearchRecords({
      productId,
      promptId: researchProductPrompt.id,
      promptVersion: researchProductPrompt.version,
      staleBefore: new Date(Date.now() - GENERATING_TIMEOUT_MS),
    });
    after(() => runResearch(product, instruction, ids));
    return { id: ids.researchId };
  });
}

// Chạy trong `after()`: không có `run()` bao ngoài nên tự ghi `FAILED` khi lỗi. `UserError` (vd mọi nhà AI lỗi) giữ
// thông báo của nó; lỗi bất ngờ ghi thông báo chung rồi ném tiếp để Next ghi log.
async function runResearch(product: Product, instruction: string | null, ids: { researchId: string; categoryId: string }) {
  try {
    const categories = await listCategoryOptionsForCms();
    const images = [...new Set([product.image, ...product.rawImageUrls].filter((u): u is string => !!u))];
    const res = await ask({
      prompt: researchProductPrompt,
      input: {
        name: product.name,
        priceText: product.priceText,
        affiliateUrl: product.affiliateUrl,
        rawText: product.rawText,
        rawReviews: product.rawReviews,
        imageCount: images.length,
        categories: categories.map((c) => ({ id: c.id, name: c.name })),
        instruction,
      },
      images,
      webSearch: true,
    });
    const { profile, category } = toResearchPayloads(res.data, {
      hasReviews: !!product.rawReviews?.trim(),
      hasImages: images.length > 0 && !res.skipped.includes("images"),
      categories,
    });
    await completeResearchRecords({ ...ids, profile, category, sources: res.sources ?? [], skipped: res.skipped });
  } catch (e) {
    const message = e instanceof UserError ? `Chưa nghiên cứu được Sản phẩm. ${e.message}` : RESEARCH_FAILED;
    await failSuggestionsRecord({ ids: [ids.researchId, ids.categoryId], message });
    if (!(e instanceof UserError)) throw e;
  }
}

// Duyệt (FR-22, AD-19) — upsert vào đích của `kind` trong một transaction, rồi `updateTag` tag của module đích:
// - `RESEARCH` → `ResearchProfile` theo Sản phẩm; `PRODUCT_CATEGORY` → `Product.categoryId`;
// - `WEB_POST` → `Post` nháp của Bộ nội dung (tạo khi chưa có, khoá `ContentSet.postId`; bài đã xuất bản → `UserError`);
// - `THREADS_POST` / `FACEBOOK_POST` → `SocialPost` (`contentSetId` + `platform`); `LINK_COMMENT` → `linkComment`
//   (cần bài cùng nền tảng đã Duyệt).
// `payload` gửi lên là nội dung đã sửa; khác bản AI thì ghi `editedBeforeApproval`. Bản AI giữ nguyên (bất biến).
export async function approveSuggestion(input: ApproveSuggestionInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = approveSuggestionInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { id, payload } = parsed.data;
    const approved = await approveSuggestionRecord(id, (s, tx) => applyApproval(s, payload, tx));
    // Hồ sơ chỉ hiện trong CMS (tag `research`); Danh mục của Sản phẩm đổi chip/điều hướng site (tag `products`, AD-7);
    // Bài web nháp (tag `posts`); bài mạng xã hội chỉ ở CMS (tag `content-sets`).
    const tags: Record<SuggestionKind, string[]> = {
      RESEARCH: [RESEARCH_TAG],
      PRODUCT_CATEGORY: [PRODUCTS_TAG],
      WEB_POST: [POSTS_TAG, CONTENT_SETS_TAG],
      THREADS_POST: [CONTENT_SETS_TAG],
      FACEBOOK_POST: [CONTENT_SETS_TAG],
      LINK_COMMENT: [CONTENT_SETS_TAG],
    };
    for (const tag of tags[approved.kind]) updateTag(tag);
    return { id: approved.id };
  });
}

type Tx = Parameters<Parameters<typeof approveSuggestionRecord>[1]>[1];

// Nội dung Duyệt: bản đã sửa (parse bằng Zod của module chủ đích) hoặc nguyên bản AI.
function approvalData<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: import("zod").ZodError } }, original: unknown, edited: unknown) {
  const r = schema.safeParse(edited === undefined ? original : edited);
  if (!r.success) throw new UserError(firstError(r.error));
  return r.data;
}

const changed = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);

async function applyApproval(s: ApprovingSuggestion, edited: unknown, tx: Tx): Promise<{ edited: boolean }> {
  if (s.kind === "RESEARCH" || s.kind === "PRODUCT_CATEGORY") {
    if (!s.productId) throw new UserError("Gợi ý không gắn Sản phẩm nào.");
    if (s.kind === "RESEARCH") {
      const original = researchProfileSchema.parse(s.payload);
      const data = approvalData(researchProfileSchema, original, edited);
      await upsertResearchProfileRecord({ productId: s.productId, data }, tx);
      return { edited: changed(data, original) };
    }
    const { categoryId } = productCategoryPayloadSchema.parse(s.payload);
    await setProductCategoryRecord({ id: s.productId, categoryId }, tx);
    return { edited: false };
  }

  if (!s.contentSetId || !s.platform) throw new UserError("Gợi ý không gắn Bộ nội dung nào.");
  const contentSetId = s.contentSetId;
  if (s.kind === "WEB_POST") {
    const original = webPostPayloadSchema.parse(s.payload);
    const data = approvalData(webPostPayloadSchema, original, edited);
    const set = await getContentSetForCms(contentSetId);
    if (!set) throw new UserError("Không tìm thấy Bộ nội dung. Có thể đã bị xoá.");
    const post = await applyWebPostSuggestionRecord(
      { postId: set.postId, payload: data, productIds: set.products.map((p) => p.id) },
      tx,
    );
    if (!set.postId) await setContentSetPostRecord({ contentSetId, postId: post.id }, tx);
    return { edited: changed(data, original) };
  }

  const platform = s.platform as SocialPlatform;
  if (s.kind === "LINK_COMMENT") {
    const original = linkCommentPayloadSchema.parse(s.payload);
    const data = approvalData(linkCommentSchemaFor(platform), original, edited);
    await setLinkCommentRecord({ contentSetId, platform, linkComment: data.comment, firstCopiedAt: s.firstCopiedAt }, tx);
    return { edited: changed(data, original) };
  }

  let parts: string[];
  let edit: boolean;
  if (s.kind === "THREADS_POST") {
    const original = threadsPayloadSchema.parse(s.payload);
    const data = approvalData(threadsApprovalSchema, original, edited);
    if (data.posts.length !== original.posts.length) {
      throw new UserError("Không thêm/xoá bài trong chuỗi. Muốn đổi số bài thì Tạo lại.");
    }
    parts = data.posts;
    edit = changed(data.posts, original.posts);
  } else {
    const original = facebookPayloadSchema.parse(s.payload);
    const data = approvalData(facebookPayloadSchema, original, edited);
    parts = [data.body];
    edit = changed(data, original);
  }
  const style = await getStyleProfileForCms(platform);
  await upsertSocialPostRecord(
    { contentSetId, platform, parts, styleProfileId: style.id, firstCopiedAt: s.firstCopiedAt },
    tx,
  );
  return { edited: edit };
}

// Từ chối (FR-22): thẻ thu còn đầu thẻ + "Tạo lại" (UX-DR41). Chỉ đổi `Suggestion` (CMS, không cache).
export async function rejectSuggestion(input: RejectSuggestionInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = rejectSuggestionInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    return rejectSuggestionRecord(parsed.data);
  });
}

// ---------- Bộ nội dung (Epic 5) ----------

const SET_NOT_FOUND = "Không tìm thấy Bộ nội dung. Có thể đã bị xoá.";
const NEEDS_PRODUCT = "Gắn ít nhất một Sản phẩm để có Link affiliate cho Bình luận";

const PROMPT_OF: Record<ContentSetKind, { id: string; version: number }> = {
  WEB_POST: webPostPrompt,
  THREADS_POST: threadsPostPrompt,
  FACEBOOK_POST: facebookPostPrompt,
  LINK_COMMENT: linkCommentPrompt,
};

// Các phần của một nền tảng (FR-12, FR-17): Bài web một phần; Threads/Facebook là bài + Bình luận kèm link.
function partsOf(platform: Platform): ContentSetPartSpec[] {
  const kinds: ContentSetKind[] =
    platform === "WEBSITE" ? ["WEB_POST"] : [platform === "THREADS" ? "THREADS_POST" : "FACEBOOK_POST", "LINK_COMMENT"];
  return kinds.map((kind) => ({ kind, platform, promptId: PROMPT_OF[kind].id, promptVersion: PROMPT_OF[kind].version }));
}

const staleBefore = () => new Date(Date.now() - GENERATING_TIMEOUT_MS);
const existsMessage = (part: ContentSetPartSpec) => `Bộ đã có ${PLATFORM_PART_LABEL[part.platform]}`;

function parse<T>(r: { success: true; data: T } | { success: false; error: import("zod").ZodError }): T {
  if (!r.success) throw new UserError(firstError(r.error));
  return r.data;
}

// Lựa chọn Góc viết / Người đọc của hồ sơ đã Duyệt, theo `id` ổn định (AD-19).
function pickChoice(
  profiles: Map<string, ResearchProfileData>,
  ref: { productId: string; id: string },
  kind: "angles" | "audiences",
  edit: string | null,
) {
  const list = profiles.get(ref.productId)?.[kind] ?? [];
  const found = list.find((c) => c.id === ref.id);
  if (!found) {
    throw new UserError(kind === "angles" ? "Góc viết đã chọn không còn trong hồ sơ. Chọn lại." : "Người đọc đã chọn không còn trong hồ sơ. Chọn lại.");
  }
  return { id: found.id, name: found.name, text: "hook" in found ? found.hook : found.reason, edit };
}

// "Tạo bộ nội dung" (FR-12, UX-DR47): mọi Sản phẩm phải có Hồ sơ nghiên cứu đã Duyệt; ghi `ContentSet` +
// `ContentSetProduct` + một gợi ý `GENERATING` mỗi phần trong một transaction, trả về ngay; AI chạy trong `after()`,
// mỗi phần một lần gọi, song song và độc lập (AD-18).
export async function createContentSet(input: CreateContentSetInput): Promise<Result<{ contentSetId: string }>> {
  return run(async () => {
    const data = parse(createContentSetInputSchema.safeParse(input));
    const products = await Promise.all(data.productIds.map((id) => getProductForCms(id)));
    const profiles = new Map<string, ResearchProfileData>();
    for (const [i, product] of products.entries()) {
      if (!product) throw new UserError(PRODUCT_NOT_FOUND);
      const profile = await getResearchProfileForCms(product.id);
      if (!profile) {
        throw new UserError(i === 0 ? "Duyệt Hồ sơ nghiên cứu trước" : `'${product.name}' chưa có hồ sơ đã duyệt`);
      }
      profiles.set(product.id, profile.data);
    }
    const angle = pickChoice(profiles, data.angle!, "angles", data.angleEdit);
    const audience = pickChoice(profiles, data.audience!, "audiences", data.audienceEdit);
    const started = await startContentSetPartsRecord({
      contentSetId: null,
      createSet: async (tx) => (await createContentSetRecord({ productIds: data.productIds, angle, audience }, tx)).id,
      parts: data.platforms.flatMap(partsOf),
      mode: "add",
      existsMessage,
      staleBefore: staleBefore(),
    });
    after(() => runContentSetParts(started.contentSetId, started.parts, null));
    return { contentSetId: started.contentSetId };
  });
}

// "Thêm Bài {nền tảng}" vào bộ đang có (UX-DR75): tạo gợi ý mới vào cùng bộ.
export async function addContentSetPlatform(input: AddContentSetPlatformInput): Promise<Result<{ contentSetId: string }>> {
  return run(async () => {
    const { contentSetId, platform } = parse(addContentSetPlatformInputSchema.safeParse(input));
    const set = await getContentSetForCms(contentSetId);
    if (!set) throw new UserError(SET_NOT_FOUND);
    if (platform === "WEBSITE" && set.postId) throw new UserError("Bộ đã có Bài web");
    if (platform !== "WEBSITE" && set.products.length === 0) throw new UserError(NEEDS_PRODUCT);
    const started = await startContentSetPartsRecord({
      contentSetId,
      parts: partsOf(platform),
      mode: "add",
      existsMessage,
      staleBefore: staleBefore(),
    });
    after(() => runContentSetParts(contentSetId, started.parts, null));
    return { contentSetId };
  });
}

// "Tạo bài mạng xã hội" từ Bài web có sẵn (FR-16, Flow 7, UX-DR55): bài đã thuộc Bộ nội dung → tạo vào bộ đó;
// chưa thuộc → tạo bộ mới gắn Bài web và Sản phẩm của bài (nội dung bài làm nguồn). Bài chưa gắn Sản phẩm → `UserError`.
export async function createSocialFromPost(input: CreateSocialFromPostInput): Promise<Result<{ contentSetId: string }>> {
  return run(async () => {
    const { postId, platforms } = parse(createSocialFromPostInputSchema.safeParse(input));
    const post = await getPostForCms(postId);
    if (!post) throw new UserError("Không tìm thấy Bài web. Có thể đã bị xoá.");
    const productIds = post.postProducts.map((pp) => pp.product.id);
    if (productIds.length === 0) throw new UserError(NEEDS_PRODUCT);
    const contentSetId = await getContentSetIdForPostForCms(postId);
    // Bộ đã có: Sản phẩm của bộ theo Sản phẩm hiện tại của bài, để Bình luận kèm link khớp bài (đã sửa ở Soạn Bài web).
    if (contentSetId) await setContentSetProductsRecord({ contentSetId, productIds });
    const started = await startContentSetPartsRecord({
      contentSetId,
      createSet: async (tx) => (await createContentSetRecord({ productIds, postId }, tx)).id,
      parts: platforms.flatMap(partsOf),
      mode: "add",
      existsMessage,
      staleBefore: staleBefore(),
    });
    after(() => runContentSetParts(started.contentSetId, started.parts, null));
    return { contentSetId: started.contentSetId };
  });
}

// Tạo lại một phần của Bộ nội dung kèm chỉ dẫn (FR-21, Story 5.7): gợi ý hiện hành (kể cả đã Duyệt) → `SUPERSEDED`,
// gợi ý mới mang `parentSuggestionId`; các phần khác giữ nguyên. Đích đã Duyệt (Post, SocialPost) không bị xoá.
export async function regenerateSuggestion(input: RegenerateSuggestionInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const { id, instruction } = parse(regenerateSuggestionInputSchema.safeParse(input));
    const s = await getSuggestionForCms(id);
    if (!s) throw new UserError("Không tìm thấy gợi ý. Tải lại trang.");
    if (!s.contentSetId || !s.platform || !(CONTENT_SET_KINDS as readonly string[]).includes(s.kind)) {
      throw new UserError("Gợi ý này tạo lại ở màn Sản phẩm.");
    }
    const kind = s.kind as ContentSetKind;
    const started = await startContentSetPartsRecord({
      contentSetId: s.contentSetId,
      parts: [{ kind, platform: s.platform, promptId: PROMPT_OF[kind].id, promptVersion: PROMPT_OF[kind].version }],
      mode: "regenerate",
      expectLatestId: id,
      staleBefore: staleBefore(),
    });
    after(() => runContentSetParts(started.contentSetId, started.parts, instruction));
    return { id: started.parts[0].id };
  });
}

// Sao chép gợi ý chưa Duyệt (FR-19, FR-22, AD-21): ghi `firstCopiedAt` lần đầu. Chỉ đổi `Suggestion` (CMS).
export async function recordSuggestionCopy(input: RecordSuggestionCopyInput): Promise<Result<{ id: string }>> {
  return run(async () => recordSuggestionCopyRecord(parse(recordSuggestionCopyInputSchema.safeParse(input))));
}

// ---------- Chạy AI trong `after()` ----------

const choiceText = (name: string | null, text: string | null, edit: string | null) =>
  name ? `${name}${edit || text ? ` — ${edit || text}` : ""}` : null;

// Chạy các phần vừa tạo (AD-18): mỗi phần một lần gọi AI, song song, độc lập — phần lỗi chỉ ghi `FAILED` cho chính nó
// (FR-12). Không có `run()` bao ngoài nên tự ghi `FAILED`; lỗi bất ngờ ném tiếp sau cùng để Next ghi log.
async function runContentSetParts(
  contentSetId: string,
  parts: { id: string; kind: SuggestionKind; platform: Platform }[],
  instruction: string | null,
) {
  let context: Awaited<ReturnType<typeof loadContext>>;
  try {
    context = await loadContext(contentSetId);
  } catch (e) {
    for (const p of parts) await failSuggestionsRecord({ ids: [p.id], message: PART_FAILED[p.kind as ContentSetKind] });
    throw e;
  }
  const results = await Promise.allSettled(parts.map((p) => runPart(p, context, instruction)));
  const unexpected = results.find((r) => r.status === "rejected");
  if (unexpected) throw (unexpected as PromiseRejectedResult).reason;
}

async function loadContext(contentSetId: string) {
  const set = await getContentSetForCms(contentSetId);
  if (!set) throw new UserError(SET_NOT_FOUND);
  const profiles = await Promise.all(set.products.map(async (p) => (await getResearchProfileForCms(p.id))?.data ?? null));
  // Bộ tạo từ Bài web có sẵn (không có Góc viết): nội dung bài làm nguồn (FR-16).
  const post = set.postId && !set.angleId ? await getPostForCms(set.postId) : null;
  const social: SocialPostInput = {
    source: describeSource(set.products, profiles, post),
    productNames: set.products.map((p) => p.name),
    angle: choiceText(set.angleName, set.angleHook, set.angleEdit) ?? (post ? `Theo Bài web "${post.title}"` : null),
    audience: choiceText(set.audienceName, set.audienceReason, set.audienceEdit),
    instruction: null,
  };
  return { set, social };
}

async function runPart(
  part: { id: string; kind: SuggestionKind; platform: Platform },
  { set, social }: Awaited<ReturnType<typeof loadContext>>,
  instruction: string | null,
) {
  const kind = part.kind as ContentSetKind;
  try {
    const style = await getStyleProfileForCms(part.platform);
    const input = { ...social, instruction };
    let result: { payload: unknown; riskWarnings: unknown };
    if (kind === "WEB_POST") {
      const categories = await listCategoryOptionsForCms();
      const res = await ask({ prompt: webPostPrompt, input: { ...input, categories }, style });
      result = toWebPostPayload(res.data, { categories });
    } else if (kind === "THREADS_POST") {
      result = toThreadsPayload((await ask({ prompt: threadsPostPrompt, input, style })).data);
    } else if (kind === "FACEBOOK_POST") {
      result = toFacebookPayload((await ask({ prompt: facebookPostPrompt, input, style })).data);
    } else {
      const products = set.products.map((p) => ({ name: p.name, affiliateUrl: p.affiliateUrl }));
      const res = await ask({
        prompt: linkCommentPrompt,
        input: {
          platform: part.platform as SocialPlatform,
          products,
          angle: social.angle,
          disclosure: style.disclosure,
          instruction,
        },
        style,
      });
      result = toLinkCommentPayload(res.data, { platform: part.platform as SocialPlatform, products, disclosure: style.disclosure });
    }
    await completeSuggestionRecord({ id: part.id, ...result });
  } catch (e) {
    // Câu chung UX-DR96, trừ lỗi Tạo lại cũng không sửa được (link quá dài) — nói rõ cần sửa gì.
    const message = e instanceof LinkCommentTooLongError ? e.message : PART_FAILED[kind];
    await failSuggestionsRecord({ ids: [part.id], message });
    if (!(e instanceof UserError)) throw e;
  }
}
