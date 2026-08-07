import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { createCase, ApiError } from "../api/client";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import { Field, TextInput } from "./ui/Field";

export default function NewCaseForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const { token } = useAuth();
  const [caseId, setCaseId] = useState("");
  const [name, setName] = useState("");
  const [courtName, setCourtName] = useState("");
  const [partyName, setPartyName] = useState("");
  const [positionStage, setPositionStage] = useState("");
  const [filingDate, setFilingDate] = useState("");
  const [upcomingDate, setUpcomingDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!caseId || !name || !courtName || !partyName || !positionStage) {
      setError("Case ID, name, court, party, and position/stage are required.");
      return;
    }
    setSubmitting(true);
    try {
      await createCase(token!, {
        case_id: caseId,
        name,
        court_name: courtName,
        party_name: partyName,
        position_stage: positionStage,
        filing_date: filingDate || null,
        upcoming_date: upcomingDate || null,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-lg font-semibold">➕ New case</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Case ID / number">
            <TextInput value={caseId} onChange={(e) => setCaseId(e.target.value)} required />
          </Field>
          <Field label="Case name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Court name">
            <TextInput value={courtName} onChange={(e) => setCourtName(e.target.value)} required />
          </Field>
          <Field label="Opposing / other party name">
            <TextInput value={partyName} onChange={(e) => setPartyName(e.target.value)} required />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Position / stage">
            <TextInput
              value={positionStage}
              onChange={(e) => setPositionStage(e.target.value)}
              required
            />
          </Field>
          <Field label="Filing date">
            <TextInput type="date" value={filingDate} onChange={(e) => setFilingDate(e.target.value)} />
          </Field>
          <Field label="Next hearing date">
            <TextInput
              type="date"
              value={upcomingDate}
              onChange={(e) => setUpcomingDate(e.target.value)}
            />
          </Field>
        </div>
        {error && <Alert kind="error">{error}</Alert>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create case"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
