import { FormEvent, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

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
    if (!isSupabaseConfigured) {
      setSession(false);
      return;
    }

    supabase.auth.getSession().then(({ data, error: err }) => {
      if (err) setError(err.message);
      setSession(!!data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(!!s);
      if (event === "SIGNED_IN") {
        setMessage("");
        setError("");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function sendMagicLink(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setMessage("");

    const redirectTo = `${window.location.origin}${window.location.pathname}`;
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

  if (!isSupabaseConfigured) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Configuration required</h1>
          <p className="error">
            Supabase environment variables are missing in this deployment. Set{" "}
            <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{" "}
            in Netlify → Site settings → Environment variables, then redeploy.
          </p>
        </div>
      </div>
    );
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
            Nigerian vs Portuguese prostate cancer RNA-seq dashboard. Use the email
            address your PI invited in Supabase Authentication.
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
