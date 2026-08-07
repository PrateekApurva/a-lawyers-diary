import type { ReactNode } from "react";

const styles = {
  error:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
};

export default function Alert({
  kind,
  children,
}: {
  kind: keyof typeof styles;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-lg border px-4 py-2.5 text-sm ${styles[kind]}`} role="status">
      {children}
    </div>
  );
}
