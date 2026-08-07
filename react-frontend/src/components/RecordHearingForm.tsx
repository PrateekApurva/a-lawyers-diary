import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { updateHearing, ApiError } from "../api/client";
import type { Hearing } from "../types";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import { Field, TextArea, TextInput } from "./ui/Field";

export default function RecordHearingForm({
  caseId,
  currentHearing,
  onUpdated,
}: {
  caseId: number;
  currentHearing: Hearing;
  onUpdated: () => void;
}) {
  const { token } = useAuth();
  const [result, setResult] = useState("");
  const [endMatter, setEndMatter] = useState(false);
  const [nextDate, setNextDate] = useState("");
  const [positionStage, setPositionStage] = useState(currentHearing.position_stage);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!result) {
      setError("Please enter a result / remark.");
      return;
    }
    if (!endMatter && !nextDate) {
      setError("Provide the next hearing date, or mark the matter as concluded.");
      return;
    }
    setSubmitting(true);
    try {
      await updateHearing(token!, caseId, {
        result,
        position_stage: positionStage || null,
        next_date: endMatter ? null : nextDate,
        end_matter: endMatter,
      });
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6">
      <h2 className="mb-1 text-lg font-semibold">Record hearing result</h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Upcoming date on record: <strong>{currentHearing.upcoming_date ?? "—"}</strong> · Court:{" "}
        {currentHearing.court_name} · Stage: {currentHearing.position_stage}
      </p>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Result / remarks">
            <TextArea
              rows={3}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="What happened at this hearing?"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={endMatter}
              onChange={(e) => setEndMatter(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            This matter has concluded (no further hearing)
          </label>
          <Field label="Next hearing date">
            <TextInput
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              disabled={endMatter}
            />
          </Field>
          <Field label="Updated position / stage (optional)">
            <TextInput value={positionStage} onChange={(e) => setPositionStage(e.target.value)} />
          </Field>
          {error && <Alert kind="error">{error}</Alert>}
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
