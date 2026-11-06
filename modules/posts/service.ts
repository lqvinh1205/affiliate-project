import "server-only";
import type { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/platform/db";
import { UserError } from "@/platform/errors";
import { visibleText } from "@/platform/html/content";
import { sanitizePostHtml } from "@/platform/html/sanitize";
import { toSearchText } from "@/platform/search-text";
import { slugify } from "@/platform/slug";
import { visibleProductWhere } from "@/modules/products/queries";
import { POST_SLUG_MAX, SEARCH_RESULTS_LIMIT } from "@/modules/posts/constants";
import { newestFirst, postCardSelect, publishedPostWhere, toPostCard } from "@/modules/posts/queries";
import type { WebPostPayload } from "@/modules/posts/prompts/web-post.prompt";
import type {
  deletePostInputSchema,
  postDraftInputSchema,
  PostInput,
  setPostStatusInputSchema,
} from "@/modules/posts/schema";

const NOT_FOUND = "Không tìm thấy Bài web. Có thể đã bị xoá.";
const SLUG_TAKEN = "Đường dẫn đã được bài khác dùng. Chọn đường dẫn khác.";
const CATEGORY_GONE = "Danh mục đã chọn không còn tồn tại. Tải lại trang rồi chọn lại.";
const PRODUCT_UNAVAILABLE = "Có Sản phẩm vừa bị ẩn hoặc không còn trong Kho. Gỡ nó khỏi bài rồi lưu lại.";
const EMPTY_CONTENT = "Bài chưa có nội dung, chưa thể xuất bản";
const AI_TARGET_PUBLISHED = "Bài đã xuất bản — sửa tay ở Soạn Bài web";
const PUBLISHED_EMPTY = "Bài đang xuất bản không được để trống thân bài. Viết nội dung hoặc chuyển bài về nháp trước.";

type Tx = Prisma.TransactionClient;

function prismaCode(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError ? e.code : null;
}

// Cột tìm kiếm không dấu (FR-36): tiêu đề, tóm tắt, thẻ, chữ thân bài (HTML đã sanitize) — ghi ở mọi lần ghi bài.
function searchTextOf(p: { title: string; excerpt: string | null; tags: string[]; content: string }) {
  return toSearchText(p.title, p.excerpt, ...p.tags, visibleText(p.content));
}

function inTransaction<T>(tx: Tx | undefined, fn: (tx: Tx) => Promise<T>) {
  return tx ? fn(tx) : db.$transaction(fn);
}

// Slug đang thuộc bài khác: là slug hiện tại của bài khác, hoặc slug cũ còn chuyển hướng tới bài khác.
async function slugOwnedByOther(c: Tx, slug: string, postId?: string) {
  const [post, redirect] = await Promise.all([
    c.post.findFirst({ where: { slug, NOT: { id: postId } }, select: { id: true } }),
    c.postSlugRedirect.findFirst({ where: { oldSlug: slug, NOT: { postId } }, select: { id: true } }),
  ]);
  return Boolean(post || redirect);
}

// Slug tự tạo từ tiêu đề, thêm hậu tố -2, -3… khi bài khác đang giữ; gốc được cắt để cả hậu tố vẫn ≤ POST_SLUG_MAX.
async function freePostSlug(c: Tx, title: string, postId?: string) {
  const root = slugify(title) || "bai-viet";
  for (let i = 1; ; i++) {
    const suffix = i === 1 ? "" : `-${i}`;
    const slug = `${root.slice(0, POST_SLUG_MAX - suffix.length).replace(/-+$/, "")}${suffix}`;
    if (!(await slugOwnedByOther(c, slug, postId))) return slug;
  }
}

// P2003 (khoá ngoại): Sản phẩm không còn (`PostProduct_productId_fkey`) hay Danh mục không còn (`Post_categoryId_fkey`).
function isProductFkError(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && JSON.stringify(e.meta ?? {}).includes("PostProduct_productId_fkey");
}

function mapWriteError(e: unknown): never {
  if (prismaCode(e) === "P2002") throw new UserError(SLUG_TAKEN);
  if (prismaCode(e) === "P2003") throw new UserError(isProductFkError(e) ? PRODUCT_UNAVAILABLE : CATEGORY_GONE);
  if (prismaCode(e) === "P2025") throw new UserError(NOT_FOUND);
  throw e;
}

// Lưu Bài web (FR-26, FR-27, FR-4):
// - HTML thân bài qua `sanitizePostHtml` (AD-22); slug trống → tạo từ tiêu đề, slug bài khác đang giữ → UserError;
// - bài đã từng xuất bản đổi slug → ghi slug cũ vào `PostSlugRedirect` để `/bai-viet/<cũ>` trả 308 (AD-20); mọi slug
//   cũ trỏ theo `postId` nên đổi nhiều lần vẫn tới slug cuối; quay lại slug cũ thì bỏ bản ghi trùng;
// - `productIds` ghi lại `PostProduct` đúng thứ tự; chỉ gắn mới được Sản phẩm đang hiện; không đụng bảng `Product`.
export async function savePostRecord(data: PostInput, tx?: Tx) {
  const { id, productIds, content, slug: wantedSlug, ...fields } = data;
  try {
    return await inTransaction(tx, async (c) => {
      const current = await c.post.findUnique({
        where: { id },
        select: { slug: true, status: true, publishedAt: true, postProducts: { select: { productId: true } } },
      });
      if (!current) throw new UserError(NOT_FOUND);
      const html = sanitizePostHtml(content);
      if (current.status === "PUBLISHED" && !visibleText(html)) throw new UserError(PUBLISHED_EMPTY);

      let slug = wantedSlug;
      if (!slug) slug = await freePostSlug(c, fields.title, id);
      else if (await slugOwnedByOther(c, slug, id)) throw new UserError(SLUG_TAKEN);

      const attached = new Set(current.postProducts.map((p) => p.productId));
      const added = productIds.filter((p) => !attached.has(p));
      if (added.length > 0) {
        const visible = await c.product.count({ where: { id: { in: added }, ...visibleProductWhere } });
        if (visible !== added.length) throw new UserError(PRODUCT_UNAVAILABLE);
      }

      await c.postSlugRedirect.deleteMany({ where: { oldSlug: slug, postId: id } });
      if (slug !== current.slug && current.publishedAt) {
        await c.postSlugRedirect.create({ data: { oldSlug: current.slug, postId: id } });
      }

      const saved = await c.post.update({
        where: { id },
        data: { ...fields, slug, content: html, searchText: searchTextOf({ ...fields, content: html }) },
        select: { id: true, slug: true },
      });
      await c.postProduct.deleteMany({ where: { postId: id } });
      await c.postProduct.createMany({
        data: productIds.map((productId, sortOrder) => ({ postId: id, productId, sortOrder })),
      });
      return saved;
    });
  } catch (e) {
    mapWriteError(e);
  }
}

// Xuất bản / chuyển về nháp. Thân bài không có chữ nào (vd chỉ `<p></p>`) thì chưa xuất bản được. Giữ ngày đăng gốc
// khi chuyển về nháp rồi xuất bản lại.
export async function setPostStatusRecord(data: z.infer<typeof setPostStatusInputSchema>, tx?: Tx) {
  try {
    return await inTransaction(tx, async (c) => {
      const current = await c.post.findUnique({ where: { id: data.id }, select: { publishedAt: true, content: true } });
      if (!current) throw new UserError(NOT_FOUND);
      if (data.status === "PUBLISHED" && !visibleText(current.content)) throw new UserError(EMPTY_CONTENT);
      return c.post.update({
        where: { id: data.id },
        data: {
          status: data.status,
          publishedAt: data.status === "PUBLISHED" ? (current.publishedAt ?? new Date()) : current.publishedAt,
        },
        select: { id: true, status: true },
      });
    });
  } catch (e) {
    mapWriteError(e);
  }
}

// Bài nháp mới (trình tạo bài: AI viết hoặc bản trống): HTML qua `sanitizePostHtml`, slug tự tạo từ tiêu đề.
export async function createPostDraftRecord(data: z.infer<typeof postDraftInputSchema>, tx?: Tx) {
  const { slug: wantedSlug, content, ...fields } = data;
  try {
    return await inTransaction(tx, async (c) => {
      let slug = wantedSlug;
      if (!slug) slug = await freePostSlug(c, fields.title);
      else if (await slugOwnedByOther(c, slug)) throw new UserError(SLUG_TAKEN);
      const html = sanitizePostHtml(content);
      return c.post.create({
        data: { ...fields, slug, content: html, searchText: searchTextOf({ ...fields, content: html }) },
        select: { id: true, slug: true },
      });
    });
  } catch (e) {
    mapWriteError(e);
  }
}

// Xoá bài: `PostProduct`, `PostSlugRedirect` của bài xoá theo cascade; Sản phẩm trong Kho giữ nguyên (FR-4).
export async function deletePostRecord(data: z.infer<typeof deletePostInputSchema>, tx?: Tx) {
  try {
    await (tx ?? db).post.delete({ where: { id: data.id } });
  } catch (e) {
    if (prismaCode(e) === "P2025") return; // đã bị xoá: coi như xong
    throw e;
  }
}

// Duyệt gợi ý `WEB_POST` (gọi từ `modules/suggestions/actions.ts`, AD-9, AD-19), trong transaction của Duyệt:
// - `postId` null → tạo `Post` nháp (slug từ tiêu đề) gắn Sản phẩm của Bộ nội dung theo thứ tự;
// - có `postId` → chỉ ghi vào bài còn `DRAFT` (bài đã xuất bản → `UserError`, Vinh sửa tay); slug và Sản phẩm của
//   bài giữ nguyên.
// HTML qua `sanitizePostHtml` (AD-22). Danh mục, Loại bài gợi ý được tự điền (FR-11), Vinh đổi được ở Soạn Bài web.
export async function applyWebPostSuggestionRecord(
  data: { postId: string | null; payload: WebPostPayload; productIds: string[] },
  tx?: Tx,
) {
  const { title, excerpt, content, tags, seoTitle, seoDescription, seoKeywords, postType, categoryId } = data.payload;
  const fields = {
    title,
    excerpt: excerpt || null,
    content: sanitizePostHtml(content),
    tags,
    seoTitle: seoTitle || null,
    seoDescription: seoDescription || null,
    seoKeywords,
    postType,
    categoryId,
  };
  const searchText = searchTextOf(fields);
  try {
    return await inTransaction(tx, async (c) => {
      if (data.postId) {
        const current = await c.post.findUnique({ where: { id: data.postId }, select: { status: true } });
        if (!current) throw new UserError(NOT_FOUND);
        if (current.status !== "DRAFT") throw new UserError(AI_TARGET_PUBLISHED);
        return c.post.update({ where: { id: data.postId }, data: { ...fields, searchText }, select: { id: true } });
      }
      const slug = await freePostSlug(c, title);
      return c.post.create({
        data: {
          ...fields,
          searchText,
          slug,
          postProducts: { create: data.productIds.map((productId, sortOrder) => ({ productId, sortOrder })) },
        },
        select: { id: true },
      });
    });
  } catch (e) {
    mapWriteError(e);
  }
}

// Tìm Bài web đã xuất bản cho action công khai `searchPosts` (FR-36, AD-5: đọc không cache cho action công khai chỉ
// đọc). Bài khớp khi `searchText` chứa đủ mọi từ đã gấp không dấu; mới xuất bản trước; trả tối đa
// `SEARCH_RESULTS_LIMIT` thẻ và tổng số bài khớp.
export async function searchPostsRecord(terms: string[]) {
  const where = {
    ...publishedPostWhere,
    AND: terms.map((t) => ({ searchText: { contains: t } })),
  } satisfies Prisma.PostWhereInput;
  const [rows, total] = await db.$transaction([
    db.post.findMany({ where, orderBy: [...newestFirst], take: SEARCH_RESULTS_LIMIT, select: postCardSelect }),
    db.post.count({ where }),
  ]);
  return { items: rows.map(toPostCard), total };
}
