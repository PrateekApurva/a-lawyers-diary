import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCase, deleteCase, rollbackHearing, ApiError } from "../api/client";
import type { CaseDetail } from "../types";
import TopBar from "../components/TopBar";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import RecordHearingForm from "../components/RecordHearingForm";
import HearingHistoryTable from "../components/HearingHistoryTable";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const caseId = Number(id);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(() => {
    if (!token) return;
    setError(null);
    getCase(token, caseId)
      .then(setCaseDetail)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load case.");
      });
  }, [token, caseId, logout, navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRollback() {
    if (!token) return;
    setRollingBack(true);
    setError(null);
    try {
      await rollbackHearing(token, caseId);
      setNotice("Last update undone.");
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to roll back.");
    } finally {
      setRollingBack(false);
    }
  }

  async function handleDelete() {
    if (!token) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCase(token, caseId);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete case.");
      setDeleting(false);
    }
  }

  if (!caseDetail) {
    return (
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-6">
        <TopBar />
        {error ? (
          <>
            <Alert kind="error">{error}</Alert>
            <div className="mt-4">
              <Button variant="secondary" onClick={() => navigate("/")}>
                ← Back to dashboard
              </Button>
            </div>
          </>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">Loading…</p>
        )}
      </div>
    );
  }

  const currentHearing = caseDetail.hearings.find((h) => h.is_current) ?? null;
  const canRollback = caseDetail.status === "closed" || caseDetail.hearings.length > 1;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-6">
      <TopBar />

      <div className="mb-4">
        <Button variant="secondary" onClick={() => navigate("/")}>
          ← Back
        </Button>
      </div>

      <h1 className="mb-2 text-2xl font-bold break-words">
        {caseDetail.name} · {caseDetail.case_id}
      </h1>
      <p className="mb-6 text-sm">
        <span className="font-medium">Status: </span>
        {caseDetail.status === "active" ? (
          <span className="text-emerald-700 dark:text-emerald-400">🟢 Active</span>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">⚪ Closed</span>
        )}
      </p>

      {notice && (
        <div className="mb-4">
          <Alert kind="success">{notice}</Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {currentHearing && caseDetail.status === "active" ? (
        <RecordHearingForm
          caseId={caseDetail.id}
          currentHearing={currentHearing}
          onUpdated={() => {
            setNotice("Hearing updated.");
            refresh();
          }}
        />
      ) : (
        caseDetail.status === "closed" && (
          <div className="mb-6">
            <Alert kind="info">This matter has concluded. No further hearings are open.</Alert>
          </div>
        )
      )}

      <h2 className="mb-3 text-lg font-semibold">Hearing history</h2>
      {caseDetail.hearings.length === 0 ? (
        <p className="mb-6 text-slate-500 dark:text-slate-400">No hearings recorded yet.</p>
      ) : (
        <div className="mb-4">
          <HearingHistoryTable hearings={caseDetail.hearings} />
        </div>
      )}

      {canRollback && (
        <div className="mb-8">
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
            Made a mistake on the most recent update?
          </p>
          <Button variant="secondary" onClick={handleRollback} disabled={rollingBack}>
            {rollingBack ? "Undoing…" : "↩️ Undo last hearing update"}
          </Button>
        </div>
      )}

      <details className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <summary className="cursor-pointer font-medium text-amber-800 dark:text-amber-300">
          ⚠️ Danger zone
        </summary>
        <div className="mt-3 space-y-3">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Deleting <strong>{caseDetail.name} ({caseDetail.case_id})</strong> permanently removes
            it and its entire hearing history. This cannot be undone.
          </p>
          <label className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
            <input
              type="checkbox"
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
              className="h-4 w-4 rounded border-amber-400 text-red-600 focus:ring-red-500"
            />
            I understand, delete this case permanently
          </label>
          <Button variant="danger" disabled={!confirmDelete || deleting} onClick={handleDelete}>
            {deleting ? "Deleting…" : "🗑️ Delete case"}
          </Button>
        </div>
      </details>
    </div>
  );
}
