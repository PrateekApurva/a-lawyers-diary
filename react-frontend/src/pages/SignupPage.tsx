import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import TopBar from "../components/TopBar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import { Field, TextInput } from "../components/ui/Field";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(fullName, email, password);
      navigate("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-6 sm:px-6">
      <TopBar />
      <div className="mx-auto mt-8 max-w-sm sm:mt-16">
        <h1 className="mb-6 text-center text-2xl font-bold">⚖️ A Lawyer's Diary</h1>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Create an account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full name">
              <TextInput
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </Field>
            <Field label="Email">
              <TextInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            {error && <Alert kind="error">{error}</Alert>}
            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? "Signing up…" : "Sign up"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Log in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
