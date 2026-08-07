import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCase, deleteCase, rollbackHearing, ApiError } from "../api/client";
import type { CaseDetail } from "../types";
import TopBar from "../components/TopBar";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import RecordHearingForm from "../components/RecordHearingForm";
import HearingHistoryTable from "../components/HearingHistoryTable";

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const caseId = Number(id);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
      setShowDeleteDialog(false);
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

      <div className="mb-4 flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate("/")}>
          ← Back
        </Button>
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          aria-label="Delete case"
          title="Delete case"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        >
          <TrashIcon />
        </button>
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

      {showDeleteDialog && (
        <ConfirmDialog
          title="Delete this case?"
          message={`"${caseDetail.name} (${caseDetail.case_id})" and its entire hearing history will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete case"
          busyLabel="Deleting…"
          busy={deleting}
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
