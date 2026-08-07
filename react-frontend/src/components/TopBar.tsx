import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

export default function TopBar({
  title,
  actions,
}: {
  title?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">{title}</div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {actions}
        <ThemeToggle />
      </div>
    </div>
  );
}
