import Form from "next/form";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LIST_PATH,
  SORT_PARAM,
  STATUS_PARAM,
  type PostListFilters,
} from "@/app/cms/bai-viet/_components/post-list-params";

// Tìm Bài web theo tiêu đề (`?q=`), giữ bộ lọc trạng thái và cách sắp xếp.
export function PostSearchForm({ filters }: { filters: PostListFilters }) {
  return (
    <Form action={LIST_PATH} role="search" className="flex gap-2" key={filters.q}>
      {filters.status && <input type="hidden" name={STATUS_PARAM} value={filters.status} />}
      {filters.sort && <input type="hidden" name={SORT_PARAM} value={filters.sort} />}
      <label htmlFor="post-search" className="sr-only">
        Tìm Bài web theo tiêu đề
      </label>
      <Input id="post-search" type="search" name="q" defaultValue={filters.q} placeholder="Tìm theo tiêu đề" autoComplete="off" />
      <Button type="submit" variant="outline" size="lg">
        <Search aria-hidden /> Tìm
      </Button>
    </Form>
  );
}

