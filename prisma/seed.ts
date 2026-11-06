import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type PostType } from "../generated/prisma/client";
import { postSearchText } from "../platform/search-text";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// 8 Danh mục Vinh đã duyệt (2026-11-05), theo thứ tự hiển thị; upsert theo slug.
const CATEGORIES = [
  { slug: "nha-bep", name: "Nhà bếp" },
  { slug: "nha-cua-decor", name: "Nhà cửa & Decor" },
  { slug: "giat-giu-tu-do", name: "Giặt giũ & Tủ đồ" },
  { slug: "lam-dep", name: "Làm đẹp" },
  { slug: "thoi-trang", name: "Thời trang" },
  { slug: "cay-canh", name: "Cây cảnh" },
  { slug: "hoc-tap-lam-viec", name: "Học tập & Làm việc" },
  { slug: "du-lich", name: "Du lịch" },
] as const;

type CategorySlug = (typeof CATEGORIES)[number]["slug"];

type SeedPost = {
  slug: string;
  category: PostType;
  categorySlug: CategorySlug;
  title: string;
  excerpt: string;
  tags: string[];
  content: string;
  products: { name: string; priceText: string }[];
};

// Link tạm trỏ tới trang tìm kiếm Shopee — thay bằng link affiliate thật trong CMS.
const placeholderLink = (name: string) =>
  `https://shopee.vn/search?keyword=${encodeURIComponent(name)}`;

const POSTS: SeedPost[] = [
  {
    slug: "meo-tay-vet-o-vang-noi-chien-khong-dau",
    categorySlug: "nha-bep",
    category: "MEO_VAT",
    title: "Mẹo tẩy vết ố vàng, dầu mỡ bám nồi chiên không dầu bằng baking soda và giấm",
    excerpt: "Hai nguyên liệu có sẵn trong bếp giúp lòng nồi chiên sạch mỡ két chỉ sau 15 phút ngâm.",
    tags: ["nhà bếp", "vệ sinh", "nồi chiên không dầu"],
    content: `<p>Sau vài tuần dùng liên tục, lòng nồi chiên không dầu thường bám một lớp mỡ vàng khó chịu. Tin vui là bạn không cần hóa chất mạnh.</p>
<h2>Chuẩn bị</h2>
<ul><li>2 thìa baking soda</li><li>100ml giấm trắng</li><li>Nước ấm, miếng bọt biển mềm</li></ul>
<h2>Các bước thực hiện</h2>
<p>Rút điện và để nồi nguội hẳn. Trộn baking soda với một ít nước thành hỗn hợp sệt, phủ lên các vết ố và để 10 phút. Xịt giấm lên trên cho sủi bọt, sau đó lau nhẹ bằng bọt biển rồi rửa lại bằng nước ấm.</p>
<h2>Giữ nồi sạch lâu hơn</h2>
<p>Lót giấy nến khi chiên đồ nhiều dầu và lau lòng nồi sau mỗi lần dùng — chỉ mất 1 phút nhưng tiết kiệm cả buổi cọ rửa.</p>`,
    products: [{ name: "Giấy nến lót nồi chiên không dầu", priceText: "~35.000đ" }, { name: "Bột baking soda đa năng", priceText: "~25.000đ" }],
  },
  {
    slug: "tong-hop-do-decor-phong-ngu-han-quoc-gia-re",
    categorySlug: "nha-cua-decor",
    category: "GOM_LINK",
    title: "Tổng hợp đồ decor phòng ngủ phong cách Hàn Quốc dưới 100k",
    excerpt: "Đèn ngủ vintage, thảm nỉ màu be và tranh canvas — ba món nhỏ đủ biến phòng ngủ thành góc chill.",
    tags: ["decor", "phòng ngủ", "dưới 100k"],
    content: `<p>Không cần sửa nhà, chỉ vài món decor đúng tông là căn phòng đã khác hẳn.</p>
<h2>Ánh sáng vàng ấm là chìa khóa</h2>
<p>Đèn ngủ vintage ánh vàng tạo cảm giác ấm cúng ngay lập tức, đặc biệt khi chụp ảnh buổi tối.</p>
<h2>Tông màu be – kem</h2>
<p>Một tấm thảm nỉ màu be giúp sàn nhà bớt trống và đồng bộ với chăn ga sáng màu.</p>
<h2>Điểm nhấn trên tường</h2>
<p>Tranh canvas tối giản treo đầu giường là cách rẻ nhất để có góc "sống ảo".</p>`,
    products: [{ name: "Đèn ngủ vintage để bàn", priceText: "~89.000đ" }, { name: "Thảm nỉ trải sàn màu be", priceText: "~75.000đ" }, { name: "Tranh canvas tối giản treo tường", priceText: "~59.000đ" }],
  },
  {
    slug: "cach-gap-quan-ao-nhanh-gon-khong-bi-nhau",
    categorySlug: "giat-giu-tu-do",
    category: "MEO_VAT",
    title: "Cách gấp quần áo nhanh gọn, không bị nhàu theo phương pháp KonMari",
    excerpt: "Gấp đứng thay vì chồng lên nhau giúp nhìn thấy mọi món đồ và tủ gọn hơn hẳn.",
    tags: ["sắp xếp", "tủ quần áo", "KonMari"],
    content: `<p>Phương pháp KonMari khuyên gấp quần áo thành hình chữ nhật nhỏ và xếp đứng trong ngăn kéo.</p>
<h2>Gấp áo thun</h2>
<p>Gập hai bên áo vào giữa, gấp đôi theo chiều dọc rồi gấp tiếp thành 3 phần để áo tự đứng được.</p>
<h2>Xếp đứng trong hộp chia ngăn</h2>
<p>Hộp chia ngăn giúp từng nếp áo không bị đổ, lấy một món không làm xô lệch cả chồng.</p>`,
    products: [{ name: "Hộp chia ngăn vải oxford đựng quần áo", priceText: "~45.000đ" }],
  },
  {
    slug: "top-do-gia-dung-thong-minh-cho-nha-bep-nho",
    categorySlug: "nha-bep",
    category: "GOM_LINK",
    title: "Top đồ gia dụng thông minh cho căn bếp chung cư nhỏ",
    excerpt: "Những món nhỏ gọn giúp tiết kiệm diện tích mà vẫn nấu nướng tiện tay.",
    tags: ["nhà bếp", "chung cư", "tiết kiệm diện tích"],
    content: `<p>Bếp chung cư thường chật, nên mỗi món đồ đều phải "đáng đồng tiền".</p>
<h2>Kệ gia vị xoay 360°</h2>
<p>Gom chai lọ vào một chỗ, xoay là lấy được, không còn cảnh lục tìm.</p>
<h2>Máy xay tỏi kéo tay</h2>
<p>Không cần điện, rửa nhanh và cất gọn trong ngăn kéo.</p>`,
    products: [{ name: "Kệ gia vị xoay 360 độ", priceText: "~99.000đ" }, { name: "Máy xay tỏi ớt kéo tay mini", priceText: "~29.000đ" }],
  },
  {
    slug: "meo-giu-quan-ao-khong-bi-phai-mau-khi-giat",
    categorySlug: "giat-giu-tu-do",
    category: "MEO_VAT",
    title: "Mẹo giữ quần áo không bị phai màu khi giặt, nhất là quần jeans mới",
    excerpt: "Ngâm giấm trắng trước lần giặt đầu tiên giúp hạn chế ra màu đáng kể.",
    tags: ["giặt giũ", "quần jeans", "giấm trắng"],
    content: `<p>Quần jeans mới thường ra màu nhiều ở vài lần giặt đầu. Một chút giấm có thể giúp ích.</p>
<h2>Ngâm giấm trước lần giặt đầu</h2>
<p>Pha 1 chén giấm trắng với chậu nước lạnh, lộn trái quần và ngâm khoảng 30 phút rồi phơi trong bóng râm.</p>
<h2>Giặt đúng cách những lần sau</h2>
<p>Luôn lộn trái, giặt nước lạnh và cho vào túi giặt lưới để hạn chế ma sát.</p>`,
    products: [{ name: "Set túi giặt lưới bảo vệ quần áo", priceText: "~39.000đ" }],
  },
  {
    slug: "phu-kien-thoi-trang-hot-trend-gia-sinh-vien",
    categorySlug: "thoi-trang",
    category: "GOM_LINK",
    title: "Phụ kiện thời trang hot trend giá sinh viên, chỉ từ 10k",
    excerpt: "Kẹp tóc đính đá và khuyên tai bạc nhỏ xinh giúp outfit đơn giản trở nên nổi bật.",
    tags: ["phụ kiện", "thời trang", "giá rẻ"],
    content: `<p>Phụ kiện là cách rẻ nhất để làm mới tủ đồ mà không cần mua thêm quần áo.</p>
<h2>Kẹp tóc đính đá</h2>
<p>Một chiếc kẹp nhỏ cài lệch bên là đủ để kiểu tóc đơn giản trông chỉn chu hơn.</p>
<h2>Khuyên tai bạc S925</h2>
<p>Bạc S925 ít gây kích ứng hơn hàng mạ thông thường, hợp cho người đeo hằng ngày.</p>`,
    products: [{ name: "Kẹp tóc đính đá phong cách Hàn", priceText: "~15.000đ" }, { name: "Khuyên tai bạc S925 tối giản", priceText: "~65.000đ" }],
  },
  {
    slug: "meo-cham-soc-cay-thiet-moc-lan-trong-nha-luon-xanh-tot",
    categorySlug: "cay-canh",
    category: "MEO_VAT",
    title: "Mẹo chăm sóc cây thiết mộc lan trong nhà luôn xanh tốt, không thối rễ",
    excerpt: "Tưới ít nhưng đúng lúc và giữ lá ẩm là bí quyết để cây phát triển ổn định.",
    tags: ["cây cảnh", "trong nhà", "chăm sóc cây"],
    content: `<p>Thiết mộc lan dễ trồng nhưng rất "ghét" úng nước — đây là lý do phổ biến nhất khiến cây vàng lá.</p>
<h2>Kiểm tra đất trước khi tưới</h2>
<p>Chỉ tưới khi lớp đất mặt khô khoảng 2–3cm. Mùa lạnh có thể giãn ra 10 ngày một lần.</p>
<h2>Phun sương cho lá</h2>
<p>Phòng máy lạnh khá khô, phun sương nhẹ lên lá giúp cây không bị cháy mép.</p>
<h2>Bón phân hữu cơ</h2>
<p>Phân trùn quế nhẹ, không gây nóng rễ, bón mỗi tháng một lần vào mùa cây phát triển.</p>`,
    products: [{ name: "Bình xịt phun sương áp suất", priceText: "~55.000đ" }, { name: "Phân trùn quế hữu cơ", priceText: "~30.000đ" }],
  },
  {
    slug: "goc-hoc-tap-cute-tang-nang-suat",
    categorySlug: "hoc-tap-lam-viec",
    category: "GOM_LINK",
    title: "Gom link đồ setup góc học tập cute, tăng hứng thú làm việc",
    excerpt: "Bàn học gọn gàng giúp bạn ngồi vào bàn dễ hơn — và vài món nhỏ xinh làm việc đó vui hơn.",
    tags: ["góc học tập", "setup bàn", "văn phòng phẩm"],
    content: `<p>Một góc học tập gọn gàng giúp bạn tập trung nhanh hơn ngay từ phút đầu.</p>
<h2>Kệ nhựa 2 tầng mini</h2>
<p>Nâng màn hình hoặc sách lên một tầng, tầng dưới để đồ lặt vặt — mặt bàn thoáng hẳn.</p>
<h2>Bút gel 0.5mm</h2>
<p>Viết êm, mực đều, nhiều màu pastel cho ai thích ghi chú đẹp.</p>`,
    products: [{ name: "Kệ nhựa 2 tầng mini để bàn", priceText: "~69.000đ" }, { name: "Hộp bút gel 0.5mm nhiều màu", priceText: "~42.000đ" }],
  },
  {
    slug: "meo-lam-sach-sau-lo-chan-long-tai-nha",
    categorySlug: "lam-dep",
    category: "MEO_VAT",
    title: "Mẹo làm sạch sâu lỗ chân lông tại nhà bằng mặt nạ đất sét",
    excerpt: "Đắp mặt nạ đất sét đúng cách 1–2 lần mỗi tuần giúp da bớt bóng dầu và trông thông thoáng hơn.",
    tags: ["chăm sóc da", "mặt nạ", "da dầu"],
    content: `<p>Mặt nạ đất sét giúp hút bớt dầu thừa trên da. Hiệu quả khác nhau tùy loại da — hãy thử trước ở vùng nhỏ.</p>
<h2>Các bước đắp mặt nạ</h2>
<p>Rửa mặt sạch, dùng cọ silicon tán một lớp mỏng, tránh vùng mắt và môi. Rửa sạch sau 10 phút, trước khi đất sét khô nứt hoàn toàn.</p>
<h2>Lưu ý</h2>
<p>Không đắp quá 2 lần mỗi tuần và luôn dưỡng ẩm sau đó. Nếu da kích ứng, ngưng dùng và hỏi ý kiến bác sĩ da liễu.</p>`,
    products: [{ name: "Mặt nạ đất sét làm sạch lỗ chân lông", priceText: "~79.000đ" }, { name: "Cọ quét mặt nạ silicon", priceText: "~12.000đ" }],
  },
  {
    slug: "nhung-mon-do-du-lich-tien-loi-phai-co-trong-vali",
    categorySlug: "du-lich",
    category: "GOM_LINK",
    title: "Những món đồ du lịch tiện lợi nên có trong vali",
    excerpt: "Vali gọn hơn, đi xa nhẹ nhàng hơn với vài món nhỏ mà có võ.",
    tags: ["du lịch", "vali", "đồ tiện ích"],
    content: `<p>Xếp vali thông minh giúp bạn mang đủ đồ mà vẫn dư chỗ cho quà về.</p>
<h2>Bộ chai chiết mỹ phẩm</h2>
<p>Chiết sữa rửa mặt, dầu gội ra chai nhỏ để mang lên máy bay đúng quy định.</p>
<h2>Bàn ủi hơi nước mini</h2>
<p>Gọn bằng chai nước, là phẳng áo sơ mi trong vài phút trước buổi hẹn.</p>`,
    products: [{ name: "Bộ chai chiết mỹ phẩm du lịch", priceText: "~49.000đ" }, { name: "Bàn ủi hơi nước cầm tay mini", priceText: "~199.000đ" }],
  },
];

async function main() {
  const categoryIds = new Map<string, string>();
  for (const [sortOrder, c] of CATEGORIES.entries()) {
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder },
      create: { name: c.name, slug: c.slug, sortOrder },
    });
    categoryIds.set(c.slug, row.id);
  }

  // Xoá bài (PostProduct theo cascade) rồi Sản phẩm mẫu không còn bài nào dùng. Sản phẩm mẫu nhận diện bằng
  // Link affiliate placeholder (không theo tên): Sản phẩm Vinh tạo trùng tên vẫn giữ nguyên.
  await db.post.deleteMany();
  await db.product.deleteMany({
    where: {
      affiliateUrl: { in: POSTS.flatMap((p) => p.products.map((x) => placeholderLink(x.name))) },
      postProducts: { none: {} },
    },
  });

  const now = Date.now();
  for (const [i, p] of POSTS.entries()) {
    const categoryId = categoryIds.get(p.categorySlug);
    await db.post.create({
      data: {
        slug: p.slug,
        postType: p.category,
        categoryId,
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        tags: p.tags,
        seoDescription: p.excerpt,
        seoKeywords: p.tags,
        // Như `posts/service.ts` (FR-36): tìm kiếm không dấu.
        searchText: postSearchText(p),
        status: "PUBLISHED",
        publishedAt: new Date(now - i * 86_400_000),
        postProducts: {
          create: p.products.map(({ name, priceText }, sortOrder) => ({
            sortOrder,
            product: {
              create: {
                name,
                priceText,
                priceUpdatedAt: new Date(now),
                affiliateUrl: placeholderLink(name),
                categoryId,
              },
            },
          })),
        },
      },
    });
  }

  // Danh mục ngoài danh sách (vd `nha-cua-doi-song` cũ) bị bỏ khi không còn Bài web/Sản phẩm nào dùng.
  await db.category.deleteMany({
    where: {
      slug: { notIn: CATEGORIES.map((c) => c.slug) },
      posts: { none: {} },
      products: { none: {} },
    },
  });
  console.log(`Seeded ${POSTS.length} posts, ${CATEGORIES.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
