import "server-only";
import type { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/platform/db";
import { UserError } from "@/platform/errors";
import { sanitizePostHtml } from "@/platform/html/sanitize";
import { slugify } from "@/platform/slug";
import { visibleProductWhere } from "@/modules/products/queries";
import type { deletePostInputSchema, PostInput, setPostStatusInputSchema } from "@/modules/posts/schema";

const NOT_FOUND = "Không tìm thấy Bài web. Có thể đã bị xoá.";
const SLUG_TAKEN = "Đường dẫn đã được bài khác dùng. Chọn đường dẫn khác.";
const CATEGORY_GONE = "Danh mục đã chọn không còn tồn tại. Tải lại trang rồi chọn lại.";
const PRODUCT_UNAVAILABLE = "Có Sản phẩm vừa bị ẩn hoặc không còn trong Kho. Gỡ nó khỏi bài rồi lưu lại.";
const EMPTY_CONTENT = "Bài chưa có nội dung, chưa thể xuất bản";

type Tx = Prisma.TransactionClient;

function prismaCode(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError ? e.code : null;
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

// Slug tự tạo từ tiêu đề, thêm hậu tố -2, -3… khi bài khác đang giữ (cả `createPost` cũ ở `app/cms/actions.ts` dùng).
export async function freePostSlug(c: Tx, title: string, postId?: string) {
  const root = slugify(title) || "bai-viet";
  for (let i = 1; ; i++) {
    const slug = i === 1 ? root : `${root}-${i}`;
    if (!(await slugOwnedByOther(c, slug, postId))) return slug;
  }
}

function mapWriteError(e: unknown): never {
  if (prismaCode(e) === "P2002") throw new UserError(SLUG_TAKEN);
  if (prismaCode(e) === "P2003") throw new UserError(CATEGORY_GONE);
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
        select: { slug: true, publishedAt: true, postProducts: { select: { productId: true } } },
      });
      if (!current) throw new UserError(NOT_FOUND);

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
        data: { ...fields, slug, content: sanitizePostHtml(content) },
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

// Xuất bản / chuyển về nháp. Giữ ngày đăng gốc khi chuyển về nháp rồi xuất bản lại.
export async function setPostStatusRecord(data: z.infer<typeof setPostStatusInputSchema>, tx?: Tx) {
  return inTransaction(tx, async (c) => {
    const current = await c.post.findUnique({ where: { id: data.id }, select: { publishedAt: true, content: true } });
    if (!current) throw new UserError(NOT_FOUND);
    if (data.status === "PUBLISHED" && !current.content.trim()) throw new UserError(EMPTY_CONTENT);
    return c.post.update({
      where: { id: data.id },
      data: {
        status: data.status,
        publishedAt: data.status === "PUBLISHED" ? (current.publishedAt ?? new Date()) : current.publishedAt,
      },
      select: { id: true, status: true, slug: true },
    });
  });
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
