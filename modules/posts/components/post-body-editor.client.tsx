"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Italic, List, ListOrdered, Pilcrow, Quote, type LucideIcon } from "lucide-react";
import { sanitizePostHtml } from "@/platform/html/sanitize";
import { sentencePattern } from "@/components/shared/select-sentence";
import { cn } from "@/components/ui/lib/utils";

// Chỉ bật đúng các định dạng của allowlist `sanitizePostHtml` (UX-DR50, AD-22): H2, H3, đoạn, danh sách, trích dẫn
// (Callout "Mẹo nhỏ"), đậm, nghiêng. Không link, ảnh, bảng, code, gạch chân, gạch ngang, đường kẻ.
const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: false,
    underline: false,
    strike: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
  }),
];

type Tool = { label: string; Icon: LucideIcon; run: (e: Editor) => void; active: (e: Editor) => boolean };

const TOOLS: Tool[] = [
  { label: "Đoạn văn", Icon: Pilcrow, run: (e) => e.chain().focus().setParagraph().run(), active: (e) => e.isActive("paragraph") },
  {
    label: "Tiêu đề mục (H2)",
    Icon: Heading2,
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    active: (e) => e.isActive("heading", { level: 2 }),
  },
  {
    label: "Tiêu đề nhỏ (H3)",
    Icon: Heading3,
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    active: (e) => e.isActive("heading", { level: 3 }),
  },
  { label: "Danh sách", Icon: List, run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive("bulletList") },
  {
    label: "Danh sách đánh số",
    Icon: ListOrdered,
    run: (e) => e.chain().focus().toggleOrderedList().run(),
    active: (e) => e.isActive("orderedList"),
  },
  { label: "Mẹo nhỏ (trích dẫn)", Icon: Quote, run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive("blockquote") },
  { label: "Đậm", Icon: Bold, run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive("bold") },
  { label: "Nghiêng", Icon: Italic, run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive("italic") },
];

function Toolbar({ editor }: { editor: Editor }) {
  const active = useEditorState({ editor, selector: ({ editor: e }) => TOOLS.map((t) => (e ? t.active(e) : false)) });
  return (
    <div
      role="toolbar"
      aria-label="Định dạng thân bài"
      className="sticky-bar sticky top-14 z-10 flex flex-wrap gap-1 rounded-t-xl border-b p-1 lg:top-0"
    >
      {TOOLS.map((t, i) => (
        <button
          key={t.label}
          type="button"
          aria-label={t.label}
          title={t.label}
          aria-pressed={active[i]}
          onMouseDown={(e) => e.preventDefault()} // giữ vùng chọn trong ô soạn
          onClick={() => t.run(editor)}
          className={cn(
            "inline-flex size-touch-target items-center justify-center rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary lg:size-9",
            active[i] ? "bg-primary-fixed text-on-primary-fixed" : "text-on-surface-variant hover:bg-surface-container",
          )}
        >
          <t.Icon className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      ))}
    </div>
  );
}

// Vị trí (ProseMirror) của câu trong thân bài: ghép chữ của mọi nút text (khối mới chèn một khoảng trắng), tìm câu
// bỏ khác biệt khoảng trắng. Không thấy → null.
function findSentence(editor: Editor, sentence: string) {
  let text = "";
  const map: number[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      for (let i = 0; i < node.text.length; i++) {
        text += node.text[i];
        map.push(pos + i);
      }
    } else if (node.isBlock && text && !text.endsWith(" ")) {
      text += " ";
      map.push(-1);
    }
  });
  const m = sentencePattern(sentence)?.exec(text);
  if (!m) return null;
  const from = map[m.index];
  const to = map[m.index + m[0].length - 1];
  return from >= 0 && to >= 0 ? { from, to: to + 1 } : null;
}

// PostEditor — ô soạn thân bài (UX-DR50): Tiptap tối giản, thanh công cụ dính trên ô soạn, vùng soạn cùng kiểu chữ
// trang public (`article-body`). Dán từ nơi khác: lọc qua `sanitizePostHtml` ngay khi dán; server lọc lại khi lưu.
// Chỉ đọc `value` lúc mount (form RHF — AD-12); thân rỗng trả "". `highlight` (RiskWarning — UX-DR43): mỗi lần đổi
// `key`, tìm câu, bôi chọn và cuộn tới; không thấy thì gọi `onHighlightMissing`.
export function PostBodyEditor({
  id,
  labelledBy,
  describedBy,
  value,
  onChange,
  onBlur,
  invalid,
  highlight,
  onHighlightMissing,
}: {
  id: string;
  labelledBy: string;
  describedBy?: string;
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  highlight?: { sentence: string; key: number } | null;
  onHighlightMissing?: () => void;
}) {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: value,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelledBy,
        ...(describedBy && { "aria-describedby": describedBy }),
        class: "article-body min-h-64 px-space-md py-space-sm outline-none",
      },
      transformPastedHTML: sanitizePostHtml,
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
    onBlur: () => onBlur?.(),
  });

  useEffect(() => {
    if (!editor || !highlight) return;
    const range = findSentence(editor, highlight.sentence);
    if (!range) return void onHighlightMissing?.();
    editor.chain().focus().setTextSelection(range).scrollIntoView().run();
    // Chỉ chạy lại khi có lần chạm mới (`key`), không theo mỗi lần render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, highlight?.key]);

  return (
    <div
      data-invalid={invalid || undefined}
      className="rounded-xl border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-invalid:border-destructive"
    >
      {editor ? <Toolbar editor={editor} /> : <div className="h-touch-target border-b lg:h-11" aria-hidden />}
      <EditorContent editor={editor} />
    </div>
  );
}
