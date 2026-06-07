import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";

function Candidates() {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading,     setLoading]     = useState(true);
  const [voiceActive,  setVoiceActive]  = useState(false);
  const [page,  setPage]  = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [scanResults,  setScanResults]  = useState({});   // { [candidateId]: result }
  const [scanLoading,  setScanLoading]  = useState({});   // { [candidateId]: bool }

  const startVoiceSearch = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice search not supported. Use Chrome."); return; }
    const rec = new SR(); rec.lang = "en-IN"; setVoiceActive(true);
    rec.start();
    rec.onresult = e => { setSearch(e.results[0][0].transcript); setVoiceActive(false); };
    rec.onerror  = () => setVoiceActive(false);
    rec.onend    = () => setVoiceActive(false);
  };

  const updateStatus = async (id, status) => {
    try {
      await apiFetch("/api/candidates/" + id + "/status", {
        method: "PUT", body: JSON.stringify({ status }),
      });
      setCandidates(prev => prev.map(c => c._id === id ? { ...c, status } : c));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (search) params.set("search", search);
    apiFetch("/api/candidates?" + params.toString())
      .then(r => {
        setPages(parseInt(r.headers.get("X-Pages") || "1"));
        setTotal(parseInt(r.headers.get("X-Total-Count") || "0"));
        return r.json();
      })
      .then(data => { if (Array.isArray(data)) setCandidates(data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [page, limit, search]);

  // search resets to page 1
  const handleSearch = (val) => { setSearch(val); setPage(1); };

  const deepScan = async (c) => {
    const id = c._id;
    if (scanResults[id]) { setScanResults(p => ({ ...p, [id]: null })); return; } // toggle off
    setScanLoading(p => ({ ...p, [id]: true }));
    try {
      const r    = await apiFetch("/api/candidates/" + id + "/scan", { method: "POST" });
      const data = await r.json();
      setScanResults(p => ({ ...p, [id]: data }));
    } catch (e) { console.error(e); }
    finally { setScanLoading(p => ({ ...p, [id]: false })); }
  };

  // candidates already paginated server-side; no client filter needed
  const filtered = candidates;

  const scoreColor = (s) => s >= 85 ? "#00e5a8" : s >= 70 ? "#f59e0b" : "#ff5c5c";
  const statusStyle = (st) => ({
    "Shortlisted":  { bg: "#00e5a820", color: "#00e5a8", border: "#00e5a8" },
    "Under Review": { bg: "#f59e0b20", color: "#f59e0b", border: "#f59e0b" },
    "Rejected":     { bg: "#ff5c5c20", color: "#ff5c5c", border: "#ff5c5c" }
  }[st] || { bg: "#1e293b", color: "#64748b", border: "#1e293b" });

  const shortlisted = candidates.filter(c => c.status === "Shortlisted").length;
  const rejected    = candidates.filter(c => c.status === "Rejected").length;
  const review      = candidates.filter(c => c.status === "Under Review").length;
  // KPI totals reflect full DB (total from header), not just current page
  const dbTotal = total || candidates.length;

  return (
    <div>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Candidate Pipeline</h1>
          <p className="pageSub">Enterprise Talent Acquisition — AI-Powered Candidate Intelligence</p>
        </div>
        <div className="topActions">
          <input placeholder="Search candidate, role..." className="enterpriseSearch"
            value={search} onChange={(e) => handleSearch(e.target.value)} />
          <button onClick={startVoiceSearch}
            style={{ background: voiceActive ? "#ff5c5c20" : "#1e293b", border: "1px solid " + (voiceActive ? "#ff5c5c" : "#334155"),
              color: voiceActive ? "#ff5c5c" : "#94a3b8", padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontSize: 16 }}
            title="Voice search candidates">
            {voiceActive ? "🔴" : "🎤"}
          </button>
          <button className="aiBtn" onClick={() => { setPage(1); setSearch(""); }}>⚡ Run AI Scan</button>
        </div>
      </div>

      <div className="enterpriseGrid">
        <div className="enterpriseCard" style={{ borderTop: "3px solid #1da1ff" }}>
          <h5>TOTAL CANDIDATES</h5>
          <h1>{dbTotal}</h1>
          <span>In Database</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #00e5a8" }}>
          <h5>SHORTLISTED</h5>
          <h1 style={{ color: "#00e5a8" }}>{shortlisted}</h1>
          <span>AI Selected</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #ff5c5c" }}>
          <h5>REJECTED</h5>
          <h1 style={{ color: "#ff5c5c" }}>{rejected}</h1>
          <span>Below Threshold</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #f59e0b" }}>
          <h5>REVIEW QUEUE</h5>
          <h1 style={{ color: "#f59e0b" }}>{review}</h1>
          <span>HR Review</span>
        </div>
      </div>

      <div className="enterpriseRow">
        <div className="bigPanel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3>Candidate Cards</h3>
            <span style={{ color: "#64748b", fontSize: "13px" }}>{dbTotal} candidates</span>
          </div>

          {loading && <p style={{ color: "#475569", textAlign: "center", padding: "30px" }}>Loading candidates...</p>}

          {!loading && filtered.length === 0 && (
            <p style={{ color: "#475569", textAlign: "center", padding: "30px" }}>
              No candidates found. Upload resumes in Resume Screening to add candidates.
            </p>
          )}

          {filtered.map((c, i) => {
            const score = c.aiScore || c.score || 0;
            const ss = statusStyle(c.status);
            const skills = c.skills || [];
            return (
              <div key={c._id || i} className="candidateCard">
                <div className="candidateHeader">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <h3 style={{ color: "white", margin: 0 }}>{c.name}</h3>
                      <span style={{ background: ss.bg, color: ss.color, border: "1px solid " + ss.border, padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                        {c.status}
                      </span>
                    </div>
                    <p style={{ color: "#64748b", margin: 0, fontSize: "13px" }}>
                      {c.college || c.university || ""}{(c.college || c.university) && (c.jobTitle || c.role) ? " · " : ""}{c.jobTitle || c.role || ""}
                    </p>
                  </div>
                  <div style={{
                    background: scoreColor(score) + "20", color: scoreColor(score),
                    border: "2px solid " + scoreColor(score),
                    borderRadius: "12px", padding: "10px 16px", fontWeight: "700", fontSize: "18px"
                  }}>
                    {score}%
                  </div>
                </div>

                {skills.length > 0 && (
                  <div className="skillTags" style={{ margin: "12px 0" }}>
                    {skills.map((s, j) => <span key={j} className="skillTag">{s}</span>)}
                  </div>
                )}

                <div className="progressBar" style={{ marginBottom: "12px" }}>
                  <div style={{ width: score + "%", background: scoreColor(score) }}></div>
                </div>

                {c.aiInsight && (
                  <div className="aiInsight">🤖 {c.aiInsight}</div>
                )}

                <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
                  {["Shortlisted","Review","Rejected","Interview","Selected"].map(st => (
                    <button key={st} onClick={() => updateStatus(c._id || i, st)}
                      style={{ background: c.status===st?"#00e5a820":"transparent",
                        border:"1px solid "+(c.status===st?"#00e5a8":"#334155"),
                        color:c.status===st?"#00e5a8":"#64748b",
                        padding:"3px 10px", borderRadius:20, cursor:"pointer", fontSize:11 }}>
                      {st}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                  <button className="aiBtn" style={{ padding: "8px 16px", fontSize: "13px" }}
                    onClick={() => deepScan(c)} disabled={scanLoading[c._id]}>
                    {scanLoading[c._id] ? "Scanning..." : scanResults[c._id] ? "✕ Close Scan" : "🤖 AI Deep Scan"}
                  </button>
                  <button className="secondaryBtn" style={{ padding: "8px 16px", fontSize: "13px" }}
                    onClick={() => navigate("/interviews")}>
                    Schedule Interview
                  </button>
                </div>

                {/* AI Deep Scan result panel */}
                {scanResults[c._id] && (
                  <div style={{ marginTop: 14, background: "#00e5a808", border: "1px solid #00e5a830",
                    borderRadius: 12, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: "#00e5a8", fontWeight: 700, fontSize: 13 }}>🤖 AI Deep Scan — {scanResults[c._id].candidateName}</span>
                      <span style={{ background: "#00e5a820", color: "#00e5a8", border: "1px solid #00e5a8",
                        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {scanResults[c._id].overallVerdict}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <p style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>✅ STRENGTHS</p>
                        {(scanResults[c._id].strengths || []).map((s, i) => (
                          <p key={i} style={{ color: "#00e5a8", fontSize: 12, margin: "2px 0" }}>• {s}</p>
                        ))}
                      </div>
                      <div>
                        <p style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>⚠ GAPS</p>
                        {(scanResults[c._id].gaps || []).map((g, i) => (
                          <p key={i} style={{ color: "#f59e0b", fontSize: 12, margin: "2px 0" }}>• {g}</p>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>🎯 INTERVIEW FOCUS AREAS</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {(scanResults[c._id].interviewFocus || []).map((f, i) => (
                          <span key={i} style={{ background: "#1da1ff20", color: "#1da1ff",
                            border: "1px solid #1da1ff40", padding: "2px 10px", borderRadius: 20, fontSize: 11 }}>{f}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: "#06111e", borderRadius: 8, padding: "8px 12px" }}>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>{scanResults[c._id].recommendation}</span>
                      <span style={{ color: "#8b5cf6", fontWeight: 700, fontSize: 13, marginLeft: 12, flexShrink: 0 }}>
                        {scanResults[c._id].salaryEstimate}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Pagination
            page={page} pages={pages} total={dbTotal} limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </div>

        <div className="bigPanel">
          <h3 style={{ marginBottom: "20px" }}>Skill Pool Distribution</h3>
          {[
            { name: "Python / ML Libraries", pct: 78 },
            { name: "React / NextJS",        pct: 71 },
            { name: "NodeJS / Backend",      pct: 65 },
            { name: "LLM / GenAI APIs",      pct: 42 },
            { name: "Docker / DevOps",       pct: 58 },
            { name: "MongoDB / SQL",         pct: 67 }
          ].map((s, i) => (
            <div key={i} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <p style={{ color: "#cbd5e1", margin: 0, fontSize: "13px" }}>{s.name}</p>
                <span style={{ color: "#00e5a8", fontWeight: "600", fontSize: "13px" }}>{s.pct}%</span>
              </div>
              <div className="progressBar"><div style={{ width: s.pct + "%" }}></div></div>
            </div>
          ))}

          <div className="aiInsight" style={{ marginTop: "20px" }}>
            <h4 style={{ color: "#00e5a8", marginBottom: "12px" }}>🤖 AI Talent Intelligence</h4>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.7", margin: "0 0 8px" }}>Top Hiring Cluster: Full Stack + AI Engineers</p>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.7", margin: "0 0 8px" }}>68% candidates have cloud deployment experience</p>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.7", margin: "0 0 8px" }}>41% candidates have GenAI exposure</p>
            <p style={{ color: "#00e5a8", fontSize: "13px", fontWeight: "600", margin: 0 }}>Average Resume Match: 84.6%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Candidates;
