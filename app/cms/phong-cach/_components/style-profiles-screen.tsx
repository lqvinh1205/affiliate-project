import { connection } from "next/server";
import { STYLE_PLATFORMS } from "@/modules/style-profiles/constants";
import { listStyleProfilesForCms } from "@/modules/style-profiles/cms-queries";
import { StyleProfileForm } from "@/modules/style-profiles/components/style-profile-form.client";

// Hồ sơ phong cách `/cms/phong-cach` (UX-DR81, FR-18): ba phần Website / Threads / Facebook, mỗi phần một form.
// Đọc lúc request (CMS không cache — AD-7).
export async function StyleProfilesScreen() {
  await connection();
  const profiles = await listStyleProfilesForCms();
  return (
    <div className="space-y-space-lg">
      <div className="space-y-space-sm">
        <h1 className="text-headline-lg-mobile lg:text-headline-lg">Hồ sơ phong cách</h1>
        <p className="text-body-sm text-on-surface-variant">
          AI viết theo hồ sơ của từng nơi đăng. Sửa hồ sơ chỉ áp dụng cho nội dung tạo từ giờ; nội dung đã tạo giữ nguyên.
        </p>
      </div>
      {profiles.map((p) => (
        <section
          key={p.platform}
          aria-labelledby={`style-${p.platform}`}
          className="space-y-space-md rounded-xl border bg-card p-space-md"
        >
          <h2 id={`style-${p.platform}`} className="text-headline-sm">
            {STYLE_PLATFORMS[p.platform].label}
          </h2>
          {!p.id && <p className="text-body-sm text-on-surface-variant">Đang dùng giá trị khởi tạo.</p>}
          <StyleProfileForm profile={p} />
        </section>
      ))}
    </div>
  );
}
