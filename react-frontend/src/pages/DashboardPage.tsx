import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listCases, ApiError } from "../api/client";
import type { CaseListItem } from "../types";
import TopBar from "../components/TopBar";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import NewCaseForm from "../components/NewCaseForm";

// Open cases first, soonest upcoming date at the top (no date sorts to the
// end of the active group); closed cases always come after all active ones.
function sortCases(cases: CaseListItem[]): CaseListItem[] {
  const active = cases.filter((c) => c.status === "active");
  const closed = cases.filter((c) => c.status === "closed");

  active.sort((a, b) => {
    const aDate = a.current_hearing?.upcoming_date;
    const bDate = b.current_hearing?.upcoming_date;
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return aDate.localeCompare(bDate);
  });

  return [...active, ...closed];
}

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const refresh = useCallback(() => {
    if (!token) return;
    setError(null);
    listCases(token)
      .then(setCases)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load cases.");
      });
  }, [token, logout, navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-6">
      <TopBar
        title={<h1 className="text-2xl font-bold">⚖️ My Cases</h1>}
        actions={
          <>
            <Button
              variant="primary"
              onClick={() => setShowNewForm((v) => !v)}
            >
              + New
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              Log out
            </Button>
          </>
        }
      />

      {showNewForm && (
        <NewCaseForm
          onCreated={() => {
            setShowNewForm(false);
            refresh();
          }}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {error && <Alert kind="error">{error}</Alert>}

      {cases === null && !error && <p className="text-slate-500 dark:text-slate-400">Loading…</p>}

      {cases !== null && cases.length === 0 && (
        <Alert kind="info">
          No cases yet. Click <strong>+ New</strong> to add your first case.
        </Alert>
      )}

      {cases !== null && cases.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full border-collapse text-left text-xs sm:min-w-[720px] sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                <th className="whitespace-nowrap px-1.5 py-3 font-semibold text-slate-700 sm:px-4 dark:text-slate-200">
                  Case ID
                </th>
                <th className="px-1.5 py-3 font-semibold text-slate-700 sm:px-4 dark:text-slate-200">Name</th>
                <th className="hidden px-4 py-3 font-semibold text-slate-700 sm:table-cell dark:text-slate-200">
                  Court
                </th>
                <th className="hidden px-4 py-3 font-semibold text-slate-700 sm:table-cell dark:text-slate-200">
                  Previous date
                </th>
                <th className="whitespace-nowrap px-1.5 py-3 font-semibold text-slate-700 sm:px-4 dark:text-slate-200">
                  Upcoming date
                </th>
                <th className="hidden px-4 py-3 font-semibold text-slate-700 sm:table-cell dark:text-slate-200">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-right font-semibold text-slate-700 sm:table-cell dark:text-slate-200" />
              </tr>
            </thead>
            <tbody>
              {sortCases(cases).map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="cursor-pointer border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="max-w-[110px] px-1.5 py-3 break-words sm:max-w-none sm:px-4 sm:whitespace-nowrap">
                    {c.case_id}
                  </td>
                  <td className="max-w-[140px] px-1.5 py-3 break-words sm:max-w-none sm:px-4">
                    {c.name}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {c.current_hearing?.court_name ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {c.current_hearing?.previous_date ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-3 sm:px-4">
                    {c.current_hearing?.upcoming_date ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {c.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <span className="h-2 w-2 rounded-full bg-slate-400" /> Closed
                      </span>
                    )}
                  </td>
                  <td className="hidden text-right sm:table-cell sm:px-4 sm:py-3">
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/cases/${c.id}`);
                      }}
                    >
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
