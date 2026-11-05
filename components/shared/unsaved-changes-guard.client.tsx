"use client";

import { useEffect } from "react";

const MESSAGE = "Bạn có thay đổi chưa lưu. Rời trang?";
const SENTINEL = "__unsavedChangesGuard";

// Link nội bộ mở ở tab hiện tại (bỏ qua tab mới, tải file, phím bổ trợ, chỉ đổi #neo).
function leavingLink(e: MouseEvent) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element | null)?.closest?.("a[href]");
  if (!(a instanceof HTMLAnchorElement) || a.hasAttribute("download")) return null;
  if (a.target && a.target !== "_self") return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return null; // đi ra ngoài: `beforeunload` lo
  if (url.pathname === location.pathname && url.search === location.search) return null;
  return a;
}

const isSentinel = () => Boolean((history.state as Record<string, unknown> | null)?.[SENTINEL]);
const pushSentinel = () => history.pushState({ ...history.state, [SENTINEL]: true }, "", location.href);

// Hỏi trước khi rời form có thay đổi chưa lưu (UX-DR59):
// - đóng/tải lại tab: `beforeunload`;
// - bấm link trong app: listener pha capture, chạy trước `next/link`;
// - nút Back/Forward: khi form bẩn đẩy một mục lịch sử "chặn" cùng URL; Back rơi về mục trước đó thì hỏi,
//   huỷ thì đẩy lại mục chặn, đồng ý thì lùi tiếp. Hết bẩn chỉ gỡ listener; mục chặn còn lại trong
//   lịch sử (cùng URL), nên lần Back kế tiếp không đổi trang.
// Không chặn điều hướng bằng code (`router.push`/`router.replace`) — nơi gọi tự quyết định.
export function UnsavedChangesGuard({ when }: { when: boolean }) {
  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (!leavingLink(e) || window.confirm(MESSAGE)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const cleanup = () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
    const onPopState = () => {
      if (isSentinel()) return; // Forward quay lại mục chặn
      if (!window.confirm(MESSAGE)) {
        pushSentinel();
        return;
      }
      cleanup();
      history.back();
    };
    if (!isSentinel()) pushSentinel();
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return cleanup;
  }, [when]);

  return null;
}
