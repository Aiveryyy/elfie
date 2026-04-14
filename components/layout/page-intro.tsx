import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageIntro({
  eyebrow,
  title,
  copy,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("page-header", className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <p className="page-eyebrow">{eyebrow}</p>
          <div className="space-y-3">
            <h1 className="page-title">{title}</h1>
            <p className="page-copy">{copy}</p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
