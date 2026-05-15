import { useEffect, useState } from "react";
import AuthGate from "./components/AuthGate";
import DegExplorer from "./components/DegExplorer";
import PathwayView from "./components/PathwayView";
import ProgenyHeatmap from "./components/ProgenyHeatmap";
import SampleOverview from "./components/SampleOverview";
import { supabase } from "./lib/supabase";

type Tab = "samples" | "deg" | "pathways" | "progeny";

export default function App() {
  const [tab, setTab] = useState<Tab>("samples");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthGate>
      <div className="app-shell">
        <aside className="sidebar">
          <div>
            <h1>Prostate RNA-seq</h1>
            <p className="subtitle">NG vs PT · Collaborator dashboard</p>
          </div>
          <nav className="nav">
            <button
              type="button"
              className={tab === "samples" ? "active" : ""}
              onClick={() => setTab("samples")}
            >
              Samples &amp; QC
            </button>
            <button
              type="button"
              className={tab === "deg" ? "active" : ""}
              onClick={() => setTab("deg")}
            >
              DEG explorer
            </button>
            <button
              type="button"
              className={tab === "pathways" ? "active" : ""}
              onClick={() => setTab("pathways")}
            >
              Pathways
            </button>
            <button
              type="button"
              className={tab === "progeny" ? "active" : ""}
              onClick={() => setTab("progeny")}
            >
              PROGENy
            </button>
          </nav>
          <div className="user-bar">
            {email && <span>{email}</span>}
            <button type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </aside>
        <main className="main">
          {tab === "samples" && <SampleOverview />}
          {tab === "deg" && <DegExplorer />}
          {tab === "pathways" && <PathwayView />}
          {tab === "progeny" && <ProgenyHeatmap />}
        </main>
      </div>
    </AuthGate>
  );
}
