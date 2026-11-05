"use client";

import { ErrorScreen } from "@/components/shared/error-screen.client";

export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} />;
}
