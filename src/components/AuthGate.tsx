import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const [session, setSession] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(!!data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(!!s);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function sendMagicLink(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setMessage("");

    const redirectTo = window.location.origin;
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    setSending(false);
    if (err) {
      setError(err.message);
    } else {
      setMessage("Check your email for the sign-in link.");
    }
  }

  if (session === null) {
    return <p className="loading">Loading…</p>;
  }

  if (!session) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Collaborator access</h1>
          <p>
            Nigerian vs Portuguese prostate cancer RNA-seq dashboard. Sign in
            with the email your PI invited in Supabase.
          </p>
          <form onSubmit={sendMagicLink}>
            <input
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <button type="submit" className="primary" disabled={sending}>
              {sending ? "Sending…" : "Send magic link"}
            </button>
          </form>
          {message && <p className="message">{message}</p>}
          {error && <p className="message error">{error}</p>}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
