import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function ResumeScreening() {
  const { apiFetch } = useAuth();
  const [files, setFiles]         = useState([]);
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [progress, setProgress]   = useState({ done: 0, total: 0 });
  const [activeTab, setActiveTab] = useState("shortlisted");
  const [search, setSearch]       = useState("");
  const [candidates, setCandidates] = useState([]);
  const [voiceActive,  setVoiceActive]  = useState(false);

  useEffect(() => { loadCandidates(); }, []);

  const loadCandidates = async () => {
    try {
      const r = await apiFetch("/api/candidates");
      const data = await r.json();
      if (Array.isArray(data)) setCandidates(data);
    } catch (e) { console.error(e); }
  };

  const startVoiceSearch = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported in this browser. Try Chrome."); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    setVoiceActive(true);
    rec.start();
    rec.onresult  = e => { setSearch(e.results[0][0].transcript); setVoiceActive(false); };
    rec.onerror   = () => setVoiceActive(false);
    rec.onend     = () => setVoiceActive(false);
  };

  const uploadSingle = async (file) => {
    const form = new FormData();
    form.append("resume", file);
    const r = await apiFetch("/api/resume/upload", {
      method: "POST",
      isFormData: true,
      body: form,
    });
    return r.json();
  };

  const runBatch = async () => {
    if (!files.length) { alert("Select at least one resume (PDF or DOCX)"); return; }
    setLoading(true);
    setResults([]);
    setProgress({ done: 0, total: files.length });
    const res = [];
    for (const file of files) {
      try {
        const data = await uploadSingle(file);
        res.push({ fileName: file.name, ...data });
      } catch (e) {
        res.push({ fileName: file.name, success: false, error: e.message });
      }
      setProgress(p => ({ ...p, done: p.done + 1 }));
      setResults([...res]);
    }
    await loadCandidates();
    setLoading(false);
  };

  // Use DB status only — no double-counting with score fallback
  const shortlisted = candidates.filter(c => c.status === "Shortlisted");
  const review      = candidates.filter(c => c.status === "Review");
  const rejected    = candidates.filter(c => c.status === "Rejected");

  const tabMap      = { shortlisted, review, rejected };
  const scoreColor  = s => s >= 80 ? "#00e5a8" : s >= 60 ? "#f59e0b" : "#ff5c5c";

  const filtered = (tabMap[activeTab] || []).filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    (c.skills || []).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const tabConfig = {
    shortlisted: { label: "Shortlisted", icon: "✅", color: "#00e5a8" },
    review:      { label: "Review",      icon: "👁",  color: "#f59e0b" },
    rejected:    { label: "Rejected",    icon: "❌",  color: "#ff5c5c" },
  };

  return (
    <div>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">AI Resume Screening</h1>
          <p className="pageSub">Bulk Upload · Groq AI Analysis · Real-time Candidate Pipeline</p>
        </div>
        <div className="topActions">
          <input placeholder="Search candidates, skills..." className="enterpriseSearch"
            value={search} onChange={e => setSearch(e.target.value)} />
          <button onClick={startVoiceSearch}
            style={{ background: voiceActive ? "#ff5c5c20" : "#1e293b", border: "1px solid " + (voiceActive ? "#ff5c5c" : "#334155"),
              color: voiceActive ? "#ff5c5c" : "#94a3b8", padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontSize: 16 }}
            title="Voice search candidates">
            {voiceActive ? "🔴" : "🎤"}
          </button>
          <button className="aiBtn" onClick={runBatch} disabled={loading}>
            {loading ? "⏳ Analyzing " + progress.done + "/" + progress.total + "..." : "⚡ Batch AI Screen"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="enterpriseGrid">
        <div className="enterpriseCard" style={{ borderTop: "3px solid #1da1ff" }}>
          <h5>TOTAL IN DB</h5>
          <h1>{candidates.length}</h1>
          <span>All candidates</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #00e5a8" }}>
          <h5>AI SHORTLISTED</h5>
          <h1 style={{ color: "#00e5a8" }}>{shortlisted.length}</h1>
          <span>{candidates.length ? Math.round(shortlisted.length / candidates.length * 100) : 0}% rate</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #ff5c5c" }}>
          <h5>AUTO REJECTED</h5>
          <h1 style={{ color: "#ff5c5c" }}>{rejected.length}</h1>
          <span>Below threshold</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #f59e0b" }}>
          <h5>NEEDS REVIEW</h5>
          <h1 style={{ color: "#f59e0b" }}>{review.length}</h1>
          <span>HR review queue</span>
        </div>
      </div>

      {/* Upload Panel */}
      <div className="bigPanel" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h3>Bulk Resume Upload</h3>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>PDF and DOCX supported — single or multiple files</p>
          </div>
          <span className="statusPill pillGreen">GROQ AI READY</span>
        </div>

        <div className="uploadZone" style={{ marginBottom: 16 }}>
          <input type="file" multiple accept=".pdf,.docx,.doc"
            onChange={e => { setFiles(Array.from(e.target.files)); setResults([]); }}
            style={{ width: "100%" }} />
          {files.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {files.map((f, i) => {
                const done = results[i];
                const icon = !done ? "⏳" : done.success ? "✅" : "❌";
                return (
                  <div key={i} style={{ color: !done ? "#64748b" : done.success ? "#00e5a8" : "#ff5c5c", fontSize: 13, padding: "3px 0" }}>
                    {icon} {f.name}
                    {done && !done.success && done.error && (
                      <span style={{ color: "#ff5c5c", marginLeft: 8, fontSize: 11 }}>— {done.error}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {loading && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#cbd5e1", fontSize: 13 }}>Processing resumes...</span>
              <span style={{ color: "#00e5a8", fontWeight: 700, fontSize: 13 }}>{progress.done}/{progress.total}</span>
            </div>
            <div className="progressBar">
              <div style={{ width: progress.total ? (progress.done / progress.total * 100) + "%" : "0%" }}></div>
            </div>
          </div>
        )}

        <button onClick={runBatch} disabled={loading} className="aiBtn" style={{ padding: "14px 28px", fontSize: 15 }}>
          {loading ? "🤖 Analyzing resumes..." : "🤖 Run AI Screening"}
        </button>
      </div>

      {/* Batch Results */}
      {results.length > 0 && (
        <div className="bigPanel" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Batch Results — {results.length} Resume{results.length !== 1 ? "s" : ""} Processed</h3>
          {results.map((r, i) => (
            <div key={i} style={{
              background: r.success === false ? "#ff5c5c10" : "#00e5a810",
              border: "1px solid " + (r.success === false ? "#ff5c5c30" : "#00e5a830"),
              borderRadius: 10, padding: 14, marginBottom: 10
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "white", fontWeight: 600, margin: "0 0 4px" }}>
                    {r.aiAnalysis?.name || r.candidate?.name || r.fileName}
                  </p>
                  <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
                    {r.aiAnalysis?.email || r.candidate?.email || "—"}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  {r.success === false
                    ? <span style={{ color: "#ff5c5c", fontWeight: 700 }}>Failed</span>
                    : <span style={{ color: scoreColor(r.aiAnalysis?.score || 0), fontWeight: 700, fontSize: 18 }}>{r.aiAnalysis?.score || 0}%</span>
                  }
                  {r.success !== false && (
                    <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>{r.aiAnalysis?.recommendation}</p>
                  )}
                </div>
              </div>
              {r.success !== false && r.aiAnalysis?.skills?.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {r.aiAnalysis.skills.slice(0, 6).map((s, j) => (
                    <span key={j} className="skillTag">{s}</span>
                  ))}
                </div>
              )}
              {r.success !== false && r.aiAnalysis?.summary && (
                <div className="aiInsight" style={{ marginTop: 10, fontSize: 12 }}>
                  🤖 {r.aiAnalysis.summary}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Candidate Pool Tabs */}
      <div className="bigPanel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3>Candidate Pool — Live from Database</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(tabConfig).map(([key, cfg]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                background:  activeTab === key ? cfg.color + "20" : "transparent",
                border:      "1px solid " + (activeTab === key ? cfg.color : "#1e293b"),
                color:       activeTab === key ? cfg.color : "#64748b",
                padding:     "8px 16px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 600,
              }}>
                {cfg.icon} {cfg.label} ({(tabMap[key] || []).length})
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>
            {candidates.length === 0
              ? "Upload resumes above to populate the candidate pool."
              : "No candidates in this category."}
          </div>
        ) : (
          filtered.map((c, i) => (
            <div key={c._id || i} className="candidateCard">
              <div className="candidateHeader">
                <div>
                  <h3 style={{ color: "white", margin: 0 }}>{c.name}</h3>
                  <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 13 }}>
                    {c.education || ""}{c.education && c.appliedRole ? " · " : ""}{c.appliedRole || ""}
                    {c.experience ? " · " + c.experience + " yr" + (c.experience !== 1 ? "s" : "") : ""}
                  </p>
                </div>
                <div style={{
                  background: scoreColor(c.aiScore) + "20", color: scoreColor(c.aiScore),
                  border: "2px solid " + scoreColor(c.aiScore),
                  borderRadius: 12, padding: "8px 16px", fontWeight: 700, fontSize: 18
                }}>
                  {c.aiScore}%
                </div>
              </div>

              {c.skills?.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
                  {c.skills.slice(0, 6).map((s, j) => <span key={j} className="skillTag">{s}</span>)}
                </div>
              )}

              <div className="progressBar" style={{ marginBottom: 12 }}>
                <div style={{ width: c.aiScore + "%", background: scoreColor(c.aiScore) }}></div>
              </div>

              {c.summary && (
                <div className="aiInsight" style={{ marginBottom: 12 }}>🤖 {c.summary}</div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button className="aiBtn" style={{ padding: "8px 16px", fontSize: 13 }}>🤖 AI Deep Scan</button>
                <button className="secondaryBtn" style={{ padding: "8px 16px", fontSize: 13 }}>Schedule Interview</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
export default ResumeScreening;
