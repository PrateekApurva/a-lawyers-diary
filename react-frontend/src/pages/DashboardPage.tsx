import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listCases, ApiError } from "../api/client";
import type { CaseListItem } from "../types";
import TopBar from "../components/TopBar";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import NewCaseForm from "../components/NewCaseForm";

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
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                {["Case ID", "Name", "Court", "Previous date", "Upcoming date", "Status", ""].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3">{c.case_id}</td>
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.current_hearing?.court_name ?? "—"}</td>
                  <td className="px-4 py-3">{c.current_hearing?.previous_date ?? "—"}</td>
                  <td className="px-4 py-3">{c.current_hearing?.upcoming_date ?? "—"}</td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3">
                    <Button variant="secondary" onClick={() => navigate(`/cases/${c.id}`)}>
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
