"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Italic, List, ListOrdered, Pilcrow, Quote, type LucideIcon } from "lucide-react";
import { sanitizePostHtml } from "@/platform/html/sanitize";

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
          className={`inline-flex size-touch-target items-center justify-center rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary lg:size-9 ${
            active[i] ? "bg-primary-fixed text-on-primary-fixed" : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <t.Icon className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      ))}
    </div>
  );
}

// PostEditor — ô soạn thân bài (UX-DR50): Tiptap tối giản, thanh công cụ dính trên ô soạn, vùng soạn cùng kiểu chữ
// trang public (`article-body`). Dán từ nơi khác: lọc qua `sanitizePostHtml` ngay khi dán; server lọc lại khi lưu.
// Chỉ đọc `value` lúc mount (form RHF — AD-12); thân rỗng trả "".
export function PostBodyEditor({
  id,
  labelledBy,
  describedBy,
  value,
  onChange,
  onBlur,
  invalid,
}: {
  id: string;
  labelledBy: string;
  describedBy?: string;
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
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
