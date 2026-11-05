// PostTags (UX-DR19): "#tag" chữ thường, không nền, không link; bài không có thẻ thì ẩn.
export function PostTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul aria-label="Thẻ" className="flex flex-wrap gap-space-sm text-label-sm text-on-surface-variant">
      {tags.map((t) => (
        <li key={t}>#{t.toLowerCase()}</li>
      ))}
    </ul>
  );
}
