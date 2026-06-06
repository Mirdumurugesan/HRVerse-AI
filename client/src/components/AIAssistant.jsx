import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

// Simple markdown-to-HTML renderer for Groq AI responses
const renderMarkdown = (text) => {
  if (!text) return "";
  let t = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers
  t = t.replace(/^### (.+)$/gm, (_, m) => '<strong style="color:#00e5a8;font-size:13px">' + m + '</strong>');
  t = t.replace(/^## (.+)$/gm,  (_, m) => '<strong style="color:#00e5a8;font-size:14px">' + m + '</strong>');
  t = t.replace(/^# (.+)$/gm,   (_, m) => '<strong style="color:#00e5a8;font-size:15px">' + m + '</strong>');

  // Bold + italic
  t = t.replace(/\*\*\*(.+?)\*\*\*/g, (_, m) => '<strong><em>' + m + '</em></strong>');
  t = t.replace(/\*\*(.+?)\*\*/g,       (_, m) => '<strong>' + m + '</strong>');
  t = t.replace(/\*([^*]+?)\*/g,          (_, m) => '<em>' + m + '</em>');

  // Inline code
  t = t.replace(/`([^`]+?)`/g, (_, m) =>
    '<code style="background:#1e293b;padding:1px 6px;border-radius:4px;font-family:monospace;font-size:12px;color:#00e5a8">' + m + '</code>'
  );

  // Bullet lists
  t = t.replace(/^[-*] (.+)$/gm, (_, m) =>
    '<div style="display:flex;gap:8px;margin:2px 0">' +
    '<span style="color:#00e5a8;flex-shrink:0">&bull;</span>' +
    '<span>' + m + '</span></div>'
  );

  // Numbered lists
  t = t.replace(/^(\d+)\. (.+)$/gm, (_, n, m) =>
    '<div style="display:flex;gap:8px;margin:2px 0">' +
    '<span style="color:#1da1ff;flex-shrink:0;min-width:16px">' + n + '.</span>' +
    '<span>' + m + '</span></div>'
  );

  // Paragraph and line breaks
  t = t.replace(/\n\n+/g, "<br/><br/>");
  t = t.replace(/\n/g, "<br/>");
  return t;
};

function AiAvatar() {
  return (
    <div style={{ width:32, height:32, borderRadius:"50%", background:"#00e5a820", border:"1px solid #00e5a8",
      color:"#00e5a8", display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:14, flexShrink:0 }}>
      🤖
    </div>
  );
}

function AIAssistant() {
  const { apiFetch, role, name } = useAuth();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    { role:"ai", text:"Hello! I am HRVerse AI powered by Groq. Ask me anything about candidates, employees, payroll, attendance, onboarding, or performance. How can I help?" }
  ]);
  const [loading,    setLoading]    = useState(false);
  const [queryCount, setQueryCount] = useState(0);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const ask = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setMessages(prev => [...prev, { role:"user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const r    = await apiFetch("/api/ai/chat", { method:"POST", body: JSON.stringify({ question: q }) });
      const data = await r.json();
      const answer = data.answer || data.message || "No response received.";
      setMessages(prev => [...prev, { role:"ai", text: answer }]);
      setQueryCount(c => c + 1);
    } catch {
      setMessages(prev => [...prev, { role:"ai", text:"Unable to connect to AI. Ensure the backend is running and the Groq API key is valid." }]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([{ role:"ai", text:"Chat cleared. How can I help you?" }]);
    setQueryCount(0);
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input is not supported in this browser. Try Chrome."); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.start();
    rec.onresult = e => setQuestion(prev => prev + e.results[0][0].transcript);
    rec.onerror  = () => alert("Voice recognition failed. Please try again.");
  };

  const quickActions = [
    { label:"Summarize today's attendance",           icon:"📊" },
    { label:"Who are the top 5 candidates for AI/ML?",  icon:"🎯" },
    { label:"Generate a payroll anomaly report",         icon:"💰" },
    { label:"Who are the top performers this quarter?",  icon:"⭐" },
    { label:"Draft an onboarding checklist for a new hire", icon:"📋" },
    { label:"What is the current attendance rate?",      icon:"📅" },
  ];

  const capabilities = [
    { title:"Resume Intelligence",  desc:"Analyse, score and shortlist candidates using AI",    color:"#00e5a8", icon:"📄" },
    { title:"Interview Analysis",   desc:"Score communication, confidence and technical depth", color:"#1da1ff", icon:"🎥" },
    { title:"Workforce Analytics",  desc:"Attrition, headcount forecast, skill gap analysis",  color:"#8b5cf6", icon:"📈" },
    { title:"Payroll Intelligence", desc:"Anomaly detection, ESOP tracking, salary insights",  color:"#f59e0b", icon:"💰" },
  ];



  return (
    <div>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">AI Assistant</h1>
          <p className="pageSub">Workforce Intelligence Engine — Powered by Groq AI · {role}</p>
        </div>
        <div className="topActions">
          <span className="statusPill pillGreen" style={{ padding:"10px 18px" }}>🟢 ONLINE</span>
        </div>
      </div>

      {/* Capability Cards */}
      <div className="enterpriseGrid" style={{ marginBottom:20 }}>
        {capabilities.map((c,i) => (
          <div key={i} className="enterpriseCard" style={{ borderTop:"3px solid "+c.color }}>
            <div style={{ fontSize:24, marginBottom:10 }}>{c.icon}</div>
            <h5>{c.title}</h5>
            <p style={{ color:"#64748b", fontSize:12, lineHeight:1.6, margin:"8px 0 0" }}>{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="enterpriseRow">
        {/* Chat Panel */}
        <div className="bigPanel" style={{ display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h3>Chat Interface</h3>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ background:"#00e5a820", color:"#00e5a8", border:"1px solid #00e5a840",
                padding:"4px 12px", borderRadius:20, fontSize:12 }}>Groq AI</span>
              <button onClick={clearChat}
                style={{ background:"#ff5c5c10", border:"1px solid #ff5c5c30", color:"#ff5c5c",
                  padding:"4px 12px", borderRadius:8, cursor:"pointer", fontSize:12 }}>
                Clear
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, minHeight:380, maxHeight:380, overflowY:"auto", marginBottom:16, padding:4 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start", marginBottom:12 }}>
                {msg.role==="ai" && <AiAvatar />}
                <div style={{
                  maxWidth:"78%",
                  padding:"12px 16px",
                  borderRadius: msg.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background:   msg.role==="user" ? "#1da1ff20" : "#06111e",
                  border:       "1px solid " + (msg.role==="user" ? "#1da1ff40" : "#1e293b"),
                  color:        "#cbd5e1",
                  fontSize:     14,
                  lineHeight:   1.7,
                  marginLeft:   msg.role==="ai" ? 10 : 0,
                }}>
                  {msg.role==="ai"
                    ? <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                    : msg.text
                  }
                </div>
                {msg.role==="user" && (
                  <div style={{ width:32, height:32, borderRadius:"50%", background:"#1da1ff20",
                    border:"1px solid #1da1ff40", color:"#1da1ff", display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:13, flexShrink:0, marginLeft:10, fontWeight:700 }}>
                    {name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <AiAvatar />
                <div style={{ background:"#06111e", border:"1px solid #1e293b",
                  borderRadius:"16px 16px 16px 4px", padding:"12px 16px", color:"#00e5a8", fontSize:13 }}>
                  <span style={{ animation:"pulse 1.5s ease-in-out infinite" }}>Thinking...</span>
                  <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
            <textarea ref={textareaRef} rows={2} value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}
              placeholder="Ask anything about HR, employees, payroll, candidates... (Enter to send, Shift+Enter for new line)"
              className="formInput" style={{ flex:1, resize:"none", minHeight:52 }} />
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={startVoice}
                style={{ background:"#1e293b", border:"1px solid #334155", color:"#94a3b8",
                  padding:"10px 14px", borderRadius:10, cursor:"pointer", fontSize:16 }}>
                🎤
              </button>
              <button onClick={ask} disabled={loading || !question.trim()} className="aiBtn"
                style={{ padding:"10px 16px", opacity: loading || !question.trim() ? 0.6 : 1 }}>
                Send
              </button>
            </div>
          </div>
          <p style={{ color:"#334155", fontSize:11, marginTop:8 }}>
            Shift+Enter for new line · Voice input supported in Chrome
          </p>
        </div>

        {/* Sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Quick Actions */}
          <div className="bigPanel">
            <h3 style={{ marginBottom:16 }}>Quick Actions</h3>
            {quickActions.map((a,i) => (
              <button key={i}
                onClick={() => { setQuestion(a.label); textareaRef.current?.focus(); }}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                  background:"#06111e", border:"1px solid #1e293b", color:"#cbd5e1",
                  padding:"12px 14px", borderRadius:10, cursor:"pointer",
                  marginBottom:8, textAlign:"left", fontSize:13, transition:".2s" }}
                onMouseOver={e => { e.currentTarget.style.borderColor="#00e5a8"; e.currentTarget.style.color="#00e5a8"; }}
                onMouseOut={e  => { e.currentTarget.style.borderColor="#1e293b";  e.currentTarget.style.color="#cbd5e1"; }}>
                <span style={{ fontSize:16 }}>{a.icon}</span>{a.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="bigPanel">
            <h3 style={{ marginBottom:16 }}>AI Stats</h3>
            {[
              ["Queries This Session", queryCount,           "#00e5a8"],
              ["Model",                "Groq LLaMA-3.3-70B","#1da1ff"],
              ["User",                 name  || "Unknown",   "#8b5cf6"],
              ["Role Context",         role  || "All",       "#f59e0b"],
              ["Messages in Chat",     messages.length,      "#cbd5e1"],
            ].map(([k,v,c],i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #1e293b" }}>
                <span style={{ color:"#64748b", fontSize:13 }}>{k}</span>
                <span style={{ color:c, fontWeight:700, fontSize:13 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default AIAssistant;
