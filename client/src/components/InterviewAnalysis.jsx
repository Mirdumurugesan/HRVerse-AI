import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function InterviewAnalysis() {
  const { apiFetch } = useAuth();
  const [video, setVideo]                   = useState(null);
  const [candidateName, setCandidateName]   = useState("");
  const [result, setResult]                 = useState(null);
  const [interviews, setInterviews]         = useState([]);
  const [loading, setLoading]               = useState(false);
  const [search, setSearch]                 = useState("");

  useEffect(() => { loadInterviews(); }, []);

  const loadInterviews = async () => {
    try {
      const r    = await apiFetch("/api/interview");
      const data = await r.json();
      if (Array.isArray(data)) setInterviews(data);
    } catch (e) { console.error(e); }
  };

  const upload = async () => {
    if (!candidateName.trim()) { alert("Enter candidate name first."); return; }
    if (!video) { alert("Select an interview video file."); return; }
    try {
      setLoading(true);
      setResult(null);
      const form = new FormData();
      form.append("video", video);
      form.append("candidateName", candidateName.trim());
      const r    = await apiFetch("/api/interview/upload", { method: "POST", isFormData: true, body: form });
      const data = await r.json();
      if (r.ok) {
        setResult(data);
        await loadInterviews();
      } else {
        alert(data.message || data.error || "Upload failed");
      }
    } catch (e) { console.error(e); alert("Upload failed — check console for details."); }
    finally { setLoading(false); }
  };

  const scoreColor = n => n >= 80 ? "#00e5a8" : n >= 60 ? "#f59e0b" : "#ff5c5c";
  const recColor   = r => !r ? "#64748b"
    : /shortlist|hire/i.test(r) ? "#00e5a8"
    : /consider/i.test(r)       ? "#f59e0b"
    : "#ff5c5c";

  const avgScore = interviews.length
    ? Math.round(interviews.reduce((s, i) => s + (i.overallScore || 0), 0) / interviews.length)
    : 0;

  const filteredInterviews = interviews.filter(iv =>
    iv.candidateName?.toLowerCase().includes(search.toLowerCase())
  );

  const scoreBar = (label, val, color) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "#cbd5e1", fontSize: 13 }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{val || 0}%</span>
      </div>
      <div className="progressBar"><div style={{ width: (val || 0) + "%", background: color }}></div></div>
    </div>
  );

  const iv = result?.interview;

  return (
    <div>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">AI Interview Intelligence</h1>
          <p className="pageSub">Video Analysis · NLP Scoring · Sentiment · Real-time Evaluation</p>
        </div>
        <div className="topActions">
          <input placeholder="Search candidate..." className="enterpriseSearch"
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="aiBtn" onClick={loadInterviews}>⚡ Refresh</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="enterpriseGrid">
        <div className="enterpriseCard" style={{ borderTop: "3px solid #1da1ff" }}>
          <h5>TOTAL INTERVIEWS</h5>
          <h1 style={{ color: "#1da1ff" }}>{interviews.length}</h1>
          <span>In database</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #00e5a8" }}>
          <h5>AVG SCORE</h5>
          <h1 style={{ color: "#00e5a8" }}>{avgScore}%</h1>
          <span>Candidate quality</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #8b5cf6" }}>
          <h5>AI ANALYZED</h5>
          <h1 style={{ color: "#8b5cf6" }}>{interviews.filter(i => i.status === "Completed").length}</h1>
          <span>Auto evaluated</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #f59e0b" }}>
          <h5>OFFER READY</h5>
          <h1 style={{ color: "#f59e0b" }}>{interviews.filter(i => i.overallScore >= 80).length}</h1>
          <span>Score ≥ 80%</span>
        </div>
      </div>

      {/* Upload Panel */}
      <div className="bigPanel" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3>AI Interview Analyzer</h3>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
              Upload interview video — Groq AI scores communication, confidence, technical depth, sentiment
            </p>
          </div>
          <span className="statusPill pillGreen">GROQ AI</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>CANDIDATE NAME</label>
            <input className="formInput" placeholder="Enter candidate full name" value={candidateName}
              onChange={e => setCandidateName(e.target.value)} />
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>INTERVIEW VIDEO (MP4 / MOV / WEBM)</label>
            <div className="uploadZone">
              <input type="file" accept="video/*" onChange={e => setVideo(e.target.files[0])} style={{ width: "100%" }} />
              {video && <p style={{ color: "#00e5a8", marginTop: 8, fontSize: 13 }}>🎥 {video.name}</p>}
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ background: "#00e5a810", border: "1px solid #00e5a830", borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
            <p style={{ color: "#00e5a8", margin: 0, fontSize: 13 }}>
              ⏳ Uploading and analyzing with Groq AI... This may take up to 2 minutes for large videos.
            </p>
          </div>
        )}

        <button onClick={upload} disabled={loading} className="aiBtn" style={{ padding: "14px 28px", fontSize: 15 }}>
          {loading ? "🤖 Analyzing Interview..." : "🤖 Analyze Interview"}
        </button>
      </div>

      {/* Result Panel */}
      {iv && (
        <>
          <div className="enterpriseGrid" style={{ marginBottom: 20 }}>
            {[
              ["COMMUNICATION", iv.communicationScore, "#1da1ff"],
              ["CONFIDENCE",    iv.confidenceScore,    "#f59e0b"],
              ["TECHNICAL",     iv.technicalScore,     "#00e5a8"],
              ["OVERALL",       iv.overallScore,       "#8b5cf6"],
            ].map(([label, val, color], i) => (
              <div key={i} className="enterpriseCard" style={{ borderTop: "3px solid " + color }}>
                <h5>{label}</h5>
                <h1 style={{ color }}>{val}%</h1>
              </div>
            ))}
          </div>

          <div className="enterpriseRow" style={{ marginBottom: 20 }}>
            <div className="bigPanel">
              <h3 style={{ marginBottom: 6 }}>Candidate Evaluation</h3>
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>Groq AI-generated assessment</p>

              <div style={{ background: "#06111e", borderRadius: 10, padding: 16, border: "1px solid #1e293b", marginBottom: 20 }}>
                <h2 style={{ color: "white", marginBottom: 4 }}>{iv.candidateName}</h2>
                <p style={{ color: recColor(iv.recommendation), fontWeight: 700, fontSize: 16, margin: 0 }}>
                  {iv.recommendation}
                </p>
              </div>

              {scoreBar("Communication",  iv.communicationScore,  "#1da1ff")}
              {scoreBar("Confidence",     iv.confidenceScore,     "#f59e0b")}
              {scoreBar("Technical",      iv.technicalScore,      "#00e5a8")}
              {scoreBar("Sentiment",      iv.sentimentScore,      "#8b5cf6")}
              {scoreBar("Body Language",  iv.bodyLanguageScore,   "#ff5c5c")}
              {scoreBar("Overall Score",  iv.overallScore,        "#00e5a8")}
            </div>

            <div className="bigPanel">
              <h3 style={{ marginBottom: 20 }}>AI Insights</h3>
              {(iv.aiInsights || []).length > 0 ? (
                (iv.aiInsights || []).map((insight, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "12px 0", borderBottom: "1px solid #1e293b", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>🤖</span>
                    <span style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.5 }}>{insight}</span>
                  </div>
                ))
              ) : (
                [
                  ["💬", "Communication capability assessed",       "#00e5a8"],
                  ["💪", "Confidence level indicators measured",    "#1da1ff"],
                  ["🔧", "Technical depth scored via NLP",          "#8b5cf6"],
                  ["👁", "Engagement level tracked throughout",     "#f59e0b"],
                  ["✅", "Recommendation generated from all scores","#00e5a8"],
                ].map(([icon, text], i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "12px 0", borderBottom: "1px solid #1e293b", alignItems: "center" }}>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <span style={{ color: "#cbd5e1", fontSize: 13 }}>{text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Interview Queue */}
      <div className="bigPanel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3>Interview Queue — Live from Database</h3>
          <span style={{ color: "#64748b", fontSize: 13 }}>{filteredInterviews.length} records</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Communication</th>
              <th>Confidence</th>
              <th>Technical</th>
              <th>Sentiment</th>
              <th>Overall</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {filteredInterviews.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "#475569", padding: 30 }}>
                  {interviews.length === 0 ? "No interviews yet. Upload a video above." : "No results match your search."}
                </td>
              </tr>
            ) : (
              filteredInterviews.map((item, i) => (
                <tr key={item._id || i}>
                  <td style={{ color: item.candidateName === "Unknown Candidate" ? "#475569" : "white", fontWeight: 600 }}>
                    {item.candidateName === "Unknown Candidate" ? "—" : item.candidateName}
                  </td>
                  <td><span style={{ color: scoreColor(item.communicationScore) }}>{item.communicationScore}%</span></td>
                  <td><span style={{ color: scoreColor(item.confidenceScore) }}>{item.confidenceScore}%</span></td>
                  <td><span style={{ color: scoreColor(item.technicalScore) }}>{item.technicalScore}%</span></td>
                  <td><span style={{ color: scoreColor(item.sentimentScore) }}>{item.sentimentScore || 0}%</span></td>
                  <td><span style={{ color: "#00e5a8", fontWeight: 700 }}>{item.overallScore}%</span></td>
                  <td>
                    <span style={{
                      background: recColor(item.recommendation) + "20",
                      color:      recColor(item.recommendation),
                      border:     "1px solid " + recColor(item.recommendation),
                      padding:    "3px 10px", borderRadius: 20, fontSize: 11
                    }}>
                      {item.recommendation}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default InterviewAnalysis;
