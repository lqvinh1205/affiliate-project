# TÀI LIỆU TOÀN DIỆN TRIỂN KHAI DỰ ÁN HỆ THỐNG AI AFFILIATE AUTOMATION
## Dự án: Website Mẹo Vặt Cuộc Sống & Gom Link Đồ Đẹp (Next.js 14+)

---

## I. TỔNG QUAN HỆ THỐNG & KIẾN TRÚC CÔNG NGHỆ

Hệ thống được thiết kế theo mô hình Full-stack hiện đại, tận dụng tối đa thế mạnh của **Next.js 14+ (App Router)** chạy trên môi trường Vercel/Node.js để tối ưu hóa đồng thời cả SEO lẫn khả năng xử lý logic Back-end bằng AI.

### 1. Kiến trúc phân tầng kỹ thuật
*   **Front-end (User-Facing):** Sử dụng chiến lược **Incremental Static Regeneration (ISR)**. Khi người dùng truy cập bài viết, Next.js phục vụ các trang HTML tĩnh đã được tối ưu hóa SEO. Khi có bài viết mới hoặc cập nhật từ CMS, trang được tái cấu trúc ngầm (Revalidate) mà không làm gián đoạn trải nghiệm hoặc ảnh hưởng tốc độ tải.
*   **Back-end & API Routes:** Chạy trực tiếp trên cấu trúc Route Handlers của Next.js, xử lý phân quyền, điều phối luồng dữ liệu giữa Database, OpenAI API và Proxy Scraper.
*   **Database ORM:** **Prisma ORM** kết nối với cơ sở dữ liệu **Supabase (PostgreSQL)**, đảm bảo tính toàn vẹn dữ liệu thông qua cấu trúc kiểu dữ liệu chặt chẽ (Type-safe).
*   **AI & Social Engine:** Tích hợp trực tiếp bộ SDK của **OpenAI (GPT-4o)** kết hợp giải pháp xoay vòng IP từ **ScrapingBee** để xử lý bài toán vượt rào chặn (Anti-bot) của sàn Shopee.

---

## II. THIẾT KẾ CƠ SỞ DỮ LIỆU CHUẨN (PRISMA SCHEMA)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Post {
  id             String    @id @default(uuid())
  title          String
  slug           String    @unique
  content        String    @db.Text
  excerpt        String?   @db.VarChar(500)
  featuredImage  String
  category       Category  // MEO_VAT hoặc GOM_LINK
  tags           String[]
  seoTitle       String?
  seoDescription String?
  seoKeywords    String[]
  status         Status    @default(DRAFT)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  products       Product[]
}

model Product {
  id           String @id @default(uuid())
  name         String
  image        String
  shopeeUrl    String // Hệ thống tự chuyển đổi tự động thành Link Affiliate chứa mã ID tracking của bạn
  price        String?
  postId       String
  post         Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
}

enum Category {
  MEO_VAT
  GOM_LINK
}

enum Status {
  DRAFT
  PUBLISHED
}
```

---

## III. THIẾT LẬP MÔI TRƯỜNG VÀ CÀI ĐẶT DỰ ÁN (.ENV)

Tạo file `.env` tại thư mục gốc của dự án Next.js và cấu hình chính xác các khóa sau:

```env
# Kết nối cơ sở dữ liệu Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Trí tuệ nhân tạo OpenAI API
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Proxy cào dữ liệu Shopee vượt tường lửa
SCRAPINGBEE_API_KEY="SB-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Định dạng cấu trúc Link Affiliate mặc định của bạn
SHOPEE_AFFILIATE_ID="xxxxxxx"
NEXT_PUBLIC_SITE_URL="https://meovatcuocsong.vn"
```

---

## IV. TRIỂN KHAI SOURCE CODE CÁC CHỨC NĂNG LÕI (CORE API ROUTES)

### 1. API Cào link Shopee & AI sinh bài viết tự động
Tập tin này xử lý tác vụ: Nhận URL Shopee -> Gọi ScrapingBee lấy HTML sạch -> Cheerio lọc dữ liệu sơ bộ -> OpenAI phân tích và trả về cấu trúc JSON chuẩn SEO cho Blog.

```typescript
// app/api/generate-post/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import * as cheerio from 'cheerio';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { shopeeUrl, category } = await req.json();
    if (!shopeeUrl) return NextResponse.json({ error: 'Thiếu đường dẫn sản phẩm Shopee' }, { status: 400 });

    // Gọi API ScrapingBee để lấy mã nguồn HTML tránh bị Shopee block IP
    const scrapingBeeKey = process.env.SCRAPINGBEE_API_KEY;
    const proxyUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeKey}&url=${encodeURIComponent(shopeeUrl)}&render_js=false`;
    
    const scraperRes = await fetch(proxyUrl);
    const html = await scraperRes.text();
    const $ = cheerio.load(html);
    
    const rawTitle = $('title').text() || 'Sản phẩm hot trend';
    const rawDescription = $('meta[name="description"]').attr('content') || rawTitle;

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Bạn là chuyên gia Content Creator cho trang web "Mẹo Vặt Cuộc Sống". Văn phong của bạn cá nhân hóa sâu sắc, sử dụng ngôn ngữ hóm hỉnh, Gen-Z.'
        },
        {
          role: 'user',
          content: `Hãy viết bài viết chuẩn SEO thuộc danh mục [${category}] dựa trên sản phẩm này: Title: ${rawTitle}. Mô tả: ${rawDescription}.
          Yêu cầu cấu trúc kết quả trả về đúng định dạng JSON sau:
          {
            "title": "Tiêu đề bài viết kích thích tương tác cao",
            "seoDescription": "Thẻ mô tả chuẩn SEO",
            "content": "Nội dung bài viết chi tiết, chia nhỏ thành các thẻ h2, h3, lồng ghép mẹo vặt thực tế và khéo léo chèn sản phẩm này vào",
            "tags": ["tag1", "tag2"]
          }`
        }
      ],
      response_format: { type: "json_object" }
    });

    return NextResponse.json(JSON.parse(aiResponse.choices[0].message.content || '{}'));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 2. API Chuyển đổi bài viết từ Website thành Chuỗi đăng Threads/Facebook
Module này đảm nhiệm việc "xé nhỏ" bài viết dài trên blog thành chuỗi kịch bản ngắn gọn, định dạng phân đoạn bắt mắt để kéo traffic trực tiếp từ mạng xã hội về trang web.

```typescript
// app/api/convert-social/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { title, content, webLink } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Bạn là chuyên gia tối ưu chuyển đổi từ Threads/Facebook về Website. Bạn chia nội dung dài thành các đoạn hội thoại siêu ngắn gọn (dưới 250 kí tự mỗi đoạn), dùng nhiều emoji làm điểm nhấn.'
        },
        {
          role: 'user',
          content: `Hãy convert bài blog này thành chuỗi kịch bản đăng Threads. Bài viết: ${title}. Nội dung bài: ${content}. Đoạn kết thúc bắt buộc phải chèn CTA kêu gọi click vào link bio này để đọc bài chi tiết: ${webLink}`
        }
      ]
    });

    return NextResponse.json({ threadsScript: response.choices[0].message.content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 3. API Trợ lý AI Phân tích và chấm điểm SEO trực tiếp
```typescript
// app/api/analyze-seo/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { title, content, targetKeywords } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Bạn là chuyên gia kiểm định SEO kỹ thuật. Chấm điểm bài viết trên thang điểm 100.' },
        { role: 'user', content: `Từ khóa: ${targetKeywords.join(', ')}. Hãy phân tích tiêu đề: ${title} và nội dung bài: ${content}. Trả về định dạng JSON: { "seoScore": 90, "suggestions": ["Thêm từ khóa vào dòng đầu", "Bổ sung ảnh minh họa"] }` }
      ],
      response_format: { type: "json_object" }
    });

    return NextResponse.json(JSON.parse(response.choices[0].message.content || '{}'));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## V. GIAO DIỆN ADMIN MANAGEMENT MOBILE-FIRST (TAILWIND CSS)

Thành phần quản trị được thiết kế chuyên biệt để hoạt động mượt mà trên trình duyệt di động, giúp bạn thực hiện mọi thao tác sản xuất nội dung khi đang di chuyển chỉ với một tay.

```tsx
// app/cms/page.tsx
'use client';
import { useState } from 'react';

export default function MobileCMS() {
  const [shopeeUrl, setShopeeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [postData, setPostData] = useState<any>(null);
  const [socialScript, setSocialScript] = useState('');

  const generatePost = async () => {
    setLoading(true);
    const res = await fetch('/api/generate-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopeeUrl, category: 'GOM_LINK' }),
    });
    const data = await res.json();
    setPostData(data);
    setLoading(false);
  };

  const convertToSocial = async () => {
    const res = await fetch('/api/convert-social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: postData.title, content: postData.content, webLink: 'https://site.com/slug' }),
    });
    const data = await res.json();
    setSocialScript(data.threadsScript);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 p-4 max-w-md mx-auto border-x border-slate-200 font-sans">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">🚀 AI Affiliate Dashboard</h1>
        <p className="text-xs text-slate-500">Tự động hóa quy trình viết bài & rải link</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-4">
        <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wide">Nhập URL sản phẩm Shopee</label>
        <input 
          type="text" 
          placeholder="https://shopee.vn/..." 
          className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          value={shopeeUrl}
          onChange={(e) => setShopeeUrl(e.target.value)}
        />
        <button 
          onClick={generatePost}
          disabled={loading}
          className="w-full mt-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 rounded-xl font-medium text-sm shadow-md active:scale-[0.98] transition-all"
        >
          {loading ? '🤖 AI đang dọn dữ liệu & viết...' : '✨ Tự động xuất bản nội dung'}
        </button>
      </div>

      {postData && (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-4">
          <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-extrabold uppercase">Bản nháp Blog</span>
          <h2 className="text-base font-bold mt-2 text-slate-800">{postData.title}</h2>
          <div className="text-xs text-slate-600 mt-2 border-t pt-2 max-h-40 overflow-y-auto" dangerouslySetInnerHTML={{ __html: postData.content }} />
          <button 
            onClick={convertToSocial}
            className="w-full mt-4 bg-slate-900 text-white p-3 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
          >
            🧵 Chuyển đổi thành Script Threads
          </button>
        </div>
      )}

      {socialScript && (
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
          <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-extrabold uppercase">Kịch bản bài đăng MXH</span>
          <pre className="text-xs text-slate-700 mt-2 whitespace-pre-wrap font-mono bg-white p-3 rounded-xl border border-amber-100">{socialScript}</pre>
          <button 
            onClick={() => { navigator.clipboard.writeText(socialScript); alert('Đã sao chép kịch bản!'); }}
            className="w-full mt-3 bg-white border border-amber-300 text-amber-800 p-2 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-all"
          >
            📋 Sao chép toàn bộ chuỗi Threads
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## VI. DANH SÁCH BỘ DỮ LIỆU CHẠY THỬ (10 MOCKUP POSTS CHO SEO)

Dưới đây là danh sách tóm lược cấu trúc 10 bài viết mẫu giúp kiểm thử hệ thống UI tĩnh và cấu trúc liên kết nội bộ (Internal Linking) đạt tiêu chuẩn tối đa:

1.  **Bài 1 (MEO_VAT):** `meo-tay-vet-o-vang-noi-chien-khong-dau` - Mẹo làm sạch mỡ két bẩn bằng Baking Soda & Giấm. (Affiliate: Giấy nến lót nồi, Bột Baking Soda).
2.  **Bài 2 (GOM_LINK):** `tong-hop-do-decor-phong-ngu-han-quoc-gia-re` - Gom các sản phẩm biến đổi không gian phòng ngủ dưới 100k. (Affiliate: Đèn ngủ vintage, thảm nỉ be, tranh canvas).
3.  **Bài 3 (MEO_VAT):** `cach-gap-quan-ao-nhanh-gon-khong-bi-nhau` - Ứng dụng phương pháp KonMari tối giản tủ đồ. (Affiliate: Hộp chia ngăn oxford).
4.  **Bài 4 (GOM_LINK):** `top-do-gia-dung-thong-minh-cho-nha-bep-nho` - Top thiết bị cứu cánh không gian bếp chung cư nhỏ. (Affiliate: Kệ gia vị xoay 360, máy xay tỏi kéo tay).
5.  **Bài 5 (MEO_VAT):** `meo-giu-quan-ao-khong-bi-phai-mau-khi-giat` - Kỹ thuật khóa màu quần jeans mới bằng giấm trắng. (Affiliate: Set túi giặt lưới bảo vệ).
6.  **Bài 6 (GOM_LINK):** `phu-kien-thoi-trang-hot-trend-gia-sinh-vien` - Điểm danh các món kẹp tóc và khuyên tai bạc sành điệu từ 10k. (Affiliate: Kẹp tóc đính đá, khuyên tai bạc S925).
7.  **Bài 7 (MEO_VAT):** `meo-cham-soc-cay-thiet-moc-lan-trong-nha-luon-xanh-tot` - Quy trình kiểm soát độ ẩm phòng tránh thối rễ cây phong thủy. (Affiliate: Bình xịt áp suất cao, phân trùn quế).
8.  **Bài 8 (GOM_LINK):** `hop-quet-dung-cu-hoc-tap-cute-nang-suat-lam-viec` - Gom link đồ setup bàn học tăng cảm hứng làm việc. (Affiliate: Kệ nhựa 2 tầng mini, Hộp bút gel 0.5mm).
9.  **Bài 9 (MEO_VAT):** `meo-se-khit-lo-chan-long-tai-nha-hieu-qua` - Quy trình làm sạch sâu bã nhờn bằng đất sét an toàn. (Affiliate: Mặt nạ đất sét RE:NK, cọ quét silicon).
10. **Bài 10 (GOM_LINK):** `nhung-mon-do-du-lich-tien-loi-phai-co-trong-vali` - Tối ưu hóa không gian lưu trữ vali cho những chuyến đi xa. (Affiliate: Bộ chai chiết mỹ phẩm, bàn ủi hơi nước mini).
