"use client";

import { createContext, use, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { formatCount } from "@/platform/format";
import { getPostLikes, setPostLike } from "@/modules/engagement/actions";
import { LIKED_POST_KEY_PREFIX } from "@/modules/engagement/constants";
import { likeLabel, nextLikeCount, revertedLikeCount } from "@/modules/engagement/like-state";

type PostLikeState = { liked: boolean; count: number | null; popKey: number; toggle: () => void };

const PostLikeContext = createContext<PostLikeState | null>(null);

// "Đã thả tim" đọc từ `localStorage` như một nguồn ngoài (`useSyncExternalStore`): server và lúc hydrate là chưa thả;
// ghi xong báo cho mọi LikeButton, tab khác đổi thì nghe sự kiện `storage`.
const likedListeners = new Set<() => void>();
// Bản nhớ trong trang khi `localStorage` bị chặn (chế độ riêng tư chặt): nhớ tới khi tải lại trang.
const likedInMemory = new Map<string, boolean>();

function subscribeLiked(onChange: () => void) {
  likedListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    likedListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readLiked(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return likedInMemory.get(key) ?? false; // localStorage bị chặn
  }
}

function writeLiked(key: string, liked: boolean) {
  likedInMemory.set(key, liked);
  try {
    if (liked) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {
    // localStorage bị chặn: chỉ còn bản nhớ trong trang.
  }
  likedListeners.forEach((l) => l());
}

// Trạng thái thả tim của một bài, dùng chung cho mọi LikeButton trên trang (cuối bài, ArticleActionBar, cột phải
// desktop) (FR-35, UX-DR25). "Đã thả" nhớ theo trình duyệt (`localStorage`, AD-23); số tim đọc phía client qua action
// công khai sau khi trang tĩnh hiện (AD-6, AD-7). Chạm: đổi ngay (optimistic) ±1, gửi lên server; bị giới hạn tần suất
// / lỗi → hoàn trạng thái + Toast. Đang gửi thì bỏ qua chạm mới (một yêu cầu một lúc).
export function PostLikeProvider({ postId, children }: { postId: string; children: ReactNode }) {
  const key = LIKED_POST_KEY_PREFIX + postId;
  const stored = useSyncExternalStore(subscribeLiked, () => readLiked(key), () => false);
  // Trạng thái tạm (optimistic) trong lúc chờ server; null = theo `localStorage`.
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const liked = optimistic ?? stored;
  const [count, setCount] = useState<number | null>(null);
  const [popKey, setPopKey] = useState(0);
  const pending = useRef(false);
  // Đã có số từ một lần thả/bỏ tim: số của lần tải đầu (có thể về sau, đã cũ) không được ghi đè.
  const fresh = useRef(false);

  useEffect(() => {
    let active = true;
    void getPostLikes({ postId })
      .then((res) => {
        if (active && res.ok && !fresh.current) setCount(res.likes);
      })
      .catch(() => {}); // mất mạng: giữ "—"
    return () => {
      active = false;
    };
  }, [postId]);

  const toggle = () => {
    if (pending.current) return;
    pending.current = true;
    const next = !liked;
    const before = count;
    setOptimistic(next);
    setCount((c) => nextLikeCount(c, next));
    if (next) setPopKey((k) => k + 1);
    const revert = () => {
      setCount((c) => revertedLikeCount(before, c));
      toast("Chưa thả tim được, thử lại sau nhé");
    };
    void setPostLike({ postId, liked: next })
      .then((res) => {
        if (!res.ok) return revert();
        fresh.current = true;
        setCount(res.likes);
        writeLiked(key, next);
      })
      .catch(revert)
      .finally(() => {
        setOptimistic(null); // thành công: `localStorage` đã ghi `next`; lỗi: về trạng thái đã lưu
        pending.current = false;
      });
  };

  return <PostLikeContext value={{ liked, count, popKey, toggle }}>{children}</PostLikeContext>;
}

// LikeButton (UX-DR25): pill `surface-container-low`, tim + số; đã thả tim đặc `primary`. Số chưa tải / lỗi → "—"
// trong chỗ giữ cố định (không nhảy layout), vẫn bấm được. Tim nảy ≤ 200 ms khi thả, tắt khi reduced-motion.
// `aria-pressed` + nhãn có số (UX-DR89). Phải nằm trong `PostLikeProvider`.
export function LikeButton() {
  const state = use(PostLikeContext);
  if (!state) return null;
  const { liked, count, popKey, toggle } = state;
  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={likeLabel(liked, count)}
      onClick={toggle}
      className="inline-flex min-h-touch-target shrink-0 items-center gap-1.5 rounded-full bg-surface-container-low px-3.5 text-label-md text-primary outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <span key={popKey} className={popKey > 0 ? "inline-flex motion-safe:animate-[like-pop_200ms_ease-out]" : "inline-flex"}>
        <Heart className="size-5" strokeWidth={1.5} fill={liked ? "currentColor" : "none"} aria-hidden />
      </span>
      <span className="min-w-[3ch] text-left font-semibold tabular-nums" aria-hidden>
        {count === null ? "—" : formatCount(count)}
      </span>
    </button>
  );
}
