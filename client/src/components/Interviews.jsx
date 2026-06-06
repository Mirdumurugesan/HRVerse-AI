import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 0.5 }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontSize: 12 }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 4, transition: "width .6s ease" }} />
      </div>
    </div>
  );
}

const scoreColor = (n) => n >= 85 ? "#00e5a8" : n >= 70 ? "#f59e0b" : n >= 55 ? "#1da1ff" : "#ff5c5c";

// Values must match what aiService.js interviewPrompt returns and DB stores
const recColor = {
  "Shortlisted": "#00e5a8",
  "Consider":    "#f59e0b",
  "Rejected":    "#ff5c5c",
};

function Interviews() {
  const { apiFetch } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("All");
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState("");

  useEffect(() => {
    apiFetch("/api/interview")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setInterviews(data); })
      .catch(err => console.error("Interviews fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  // Tabs aligned to DB values from aiService.js interviewPrompt
  const tabs = ["All", "Shortlisted", "Consider", "Rejected"];

  const visible = interviews.filter(iv => {
    const matchTab    = filter === "All" || iv.recommendation === filter;
    const matchSearch = !search || (iv.candidateName || "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const kpi = {
    total:     interviews.length,
    hire:      interviews.filter(iv => iv.recommendation === "Shortlisted").length,
    pending:   interviews.filter(iv => iv.recommendation === "Consider").length,
    rejected:  interviews.filter(iv => iv.recommendation === "Rejected").length,
    avgScore:  interviews.length ? Math.round(interviews.reduce((s, iv) => s + (iv.overallScore || 0), 0) / interviews.length) : 0,
  };

  const cur = selected || (visible.length > 0 ? visible[0] : null);

  return (
    <div>
      {/* ── Header ── */}
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Video Interview Analytics</h1>
          <p className="pageSub">AI-Scored Candidate Interviews · Real-time Evaluation Engine</p>
        </div>
        <div className="topActions">
          <span className="statusPill pillGreen">AI ACTIVE</span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="enterpriseGrid">
        <div className="enterpriseCard" style={{ borderTop: "3px solid #1da1ff" }}>
          <h5>TOTAL INTERVIEWS</h5>
          <h1 style={{ color: "#1da1ff" }}>{kpi.total}</h1>
          <span>All sessions analyzed</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #00e5a8" }}>
          <h5>HIRE RECOMMENDATION</h5>
          <h1 style={{ color: "#00e5a8" }}>{kpi.hire}</h1>
          <span>Shortlisted</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #f59e0b" }}>
          <h5>PENDING REVIEW</h5>
          <h1 style={{ color: "#f59e0b" }}>{kpi.pending}</h1>
          <span>Consider</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #ff5c5c" }}>
          <h5>REJECTED</h5>
          <h1 style={{ color: "#ff5c5c" }}>{kpi.rejected}</h1>
          <span>Rejected</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #8b5cf6" }}>
          <h5>AVG OVERALL SCORE</h5>
          <h1 style={{ color: "#8b5cf6" }}>{kpi.avgScore}%</h1>
          <span>Across all candidates</span>
        </div>
      </div>

      {/* ── Main Panel: Queue + Detail ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, marginTop: 24 }}>

        {/* Left: Candidate Queue */}
        <div className="bigPanel" style={{ padding: 0, overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #1e293b", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, flex: 1 }}>Candidate Queue</h3>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Search candidate…"
              style={{ background: "#070b14", border: "1px solid #1e293b", color: "white", padding: "7px 12px", borderRadius: 8, fontSize: 13, outline: "none", width: 200 }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 8, padding: "12px 20px", borderBottom: "1px solid #1e293b", flexWrap: "wrap" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                style={{ padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid", letterSpacing: 0.4,
                  background: filter === t ? "#00e5a820" : "transparent",
                  borderColor: filter === t ? "#00e5a8" : "#1e293b",
                  color: filter === t ? "#00e5a8" : "#64748b" }}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#475569" }}>Analyzing interviews…</div>
            ) : visible.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#475569" }}>No interviews match the current filter.</div>
            ) : (
              visible.map(iv => {
                const rc = recColor[iv.recommendation] || "#64748b";
                const isActive = cur?._id === iv._id;
                return (
                  <div key={iv._id} onClick={() => setSelected(iv)}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid #1e293b", cursor: "pointer",
                      background: isActive ? "#00e5a808" : "transparent",
                      borderLeft: isActive ? "3px solid #00e5a8" : "3px solid transparent",
                      transition: ".15s" }}>

                    {/* Avatar */}
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: rc + "20", color: rc, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                      {(iv.candidateName || "?")[0]}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "white", fontWeight: 600, fontSize: 14, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {iv.candidateName || "Unknown"}
                      </div>
                      <div style={{ color: "#475569", fontSize: 11 }}>
                        {iv.createdAt ? new Date(iv.createdAt).toLocaleString() : "—"}
                      </div>
                    </div>

                    {/* Mini scores */}
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {[["T", iv.technicalScore], ["C", iv.communicationScore], ["CF", iv.confidenceScore]].map(([lbl, val]) => (
                        <div key={lbl} style={{ textAlign: "center" }}>
                          <div style={{ color: scoreColor(val), fontWeight: 700, fontSize: 13 }}>{val}</div>
                          <div style={{ color: "#475569", fontSize: 9, letterSpacing: 0.3 }}>{lbl}</div>
                        </div>
                      ))}
                    </div>

                    <span style={{ background: rc + "20", color: rc, border: `1px solid ${rc}40`, padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" }}>
                      {(iv.recommendation || "—").toUpperCase()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        {cur ? (
          <div className="bigPanel" style={{ alignSelf: "start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: (recColor[cur.recommendation] || "#64748b") + "20", color: recColor[cur.recommendation] || "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 }}>
                {(cur.candidateName || "?")[0]}
              </div>
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>{cur.candidateName}</div>
                <div style={{ color: "#475569", fontSize: 12 }}>{cur.createdAt ? new Date(cur.createdAt).toLocaleString() : "—"}</div>
              </div>
            </div>

            {/* Overall Score Ring-like display */}
            <div style={{ background: "#070b14", borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 16, border: "1px solid #1e293b" }}>
              <div style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 1, marginBottom: 6 }}>OVERALL SCORE</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor(cur.overallScore), lineHeight: 1 }}>{cur.overallScore}<span style={{ fontSize: 20, color: "#475569" }}>%</span></div>
              <span style={{ background: (recColor[cur.recommendation] || "#64748b") + "20", color: recColor[cur.recommendation] || "#64748b", border: `1px solid ${(recColor[cur.recommendation] || "#64748b")}40`, padding: "5px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700, marginTop: 10, display: "inline-block" }}>
                {(cur.recommendation || "—").toUpperCase()}
              </span>
            </div>

            {/* Score Bars */}
            <div style={{ background: "#070b14", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #1e293b" }}>
              <div style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 1, marginBottom: 12 }}>COMPETENCY BREAKDOWN</div>
              <ScoreBar label="TECHNICAL APTITUDE"    value={cur.technicalScore}      color={scoreColor(cur.technicalScore)} />
              <ScoreBar label="COMMUNICATION SKILLS"  value={cur.communicationScore}  color={scoreColor(cur.communicationScore)} />
              <ScoreBar label="CONFIDENCE LEVEL"      value={cur.confidenceScore}     color={scoreColor(cur.confidenceScore)} />
            </div>

            {/* Sentiment */}
            <div style={{ background: "#070b14", borderRadius: 12, padding: 16, border: "1px solid #1e293b" }}>
              <div style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 1, marginBottom: 10 }}>SENTIMENT ANALYSIS</div>
              {[["Positive", "#00e5a8"], ["Neutral", "#f59e0b"], ["Negative", "#ff5c5c"]].map(([s, c]) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cur.sentiment === s ? c : "#1e293b", flexShrink: 0 }} />
                  <span style={{ color: cur.sentiment === s ? c : "#475569", fontSize: 12, fontWeight: cur.sentiment === s ? 700 : 400 }}>{s}</span>
                  {cur.sentiment === s && <span style={{ marginLeft: "auto", color: c, fontSize: 10, fontWeight: 700 }}>DETECTED</span>}
                </div>
              ))}
            </div>

            {/* AI Insight */}
            <div style={{ background: "#00e5a808", borderRadius: 12, padding: 14, border: "1px solid #00e5a820", marginTop: 16 }}>
              <div style={{ color: "#00e5a8", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>🤖 AI INSIGHT</div>
              <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                {cur.overallScore >= 85
                  ? `${cur.candidateName} demonstrates strong technical depth and confident communication. Recommended for immediate next-round scheduling.`
                  : cur.overallScore >= 70
                  ? `${cur.candidateName} shows solid potential. Minor gaps in confidence detected. Consider a structured follow-up round.`
                  : `${cur.candidateName} did not meet the benchmark threshold. Review with hiring manager before proceeding.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="bigPanel" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", minHeight: 200 }}>
            Select a candidate to view analysis
          </div>
        )}
      </div>
    </div>
  );
}

export default Interviews;
