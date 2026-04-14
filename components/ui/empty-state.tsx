import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyState({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-muted)]/85">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="max-w-xl text-sm leading-6 text-slate-500">{copy}</p>
        {action}
      </CardContent>
    </Card>
  );
}
