import { Suspense } from "react";

import DocsClient from "./docs-client";

export default function DocsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background px-4 py-10 text-sm text-muted-foreground">
          Loading docs...
        </div>
      }
    >
      <DocsClient />
    </Suspense>
  );
}
