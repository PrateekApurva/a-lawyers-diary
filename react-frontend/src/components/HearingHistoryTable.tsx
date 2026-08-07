import type { Hearing } from "../types";

const COLUMNS = [
  "Status",
  "Filing date",
  "Court",
  "Party",
  "Stage",
  "Previous date",
  "Upcoming date",
  "Result",
];

export default function HearingHistoryTable({ hearings }: { hearings: Hearing[] }) {
  const rows = [...hearings].reverse(); // most recent first

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
            {COLUMNS.map((c) => (
              <th key={c} className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr
              key={h.id}
              className="border-b border-slate-100 last:border-0 dark:border-slate-800"
            >
              <td className="px-4 py-3">
                {h.is_current ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Current
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">Closed</span>
                )}
              </td>
              <td className="px-4 py-3">{h.filing_date ?? "—"}</td>
              <td className="px-4 py-3">{h.court_name}</td>
              <td className="px-4 py-3">{h.party_name}</td>
              <td className="px-4 py-3">{h.position_stage}</td>
              <td className="px-4 py-3">{h.previous_date ?? "—"}</td>
              <td className="px-4 py-3">{h.upcoming_date ?? "—"}</td>
              <td className="px-4 py-3">{h.result ?? (h.is_current ? "Pending" : "—")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
