// Reusable enterprise pagination control
// Props: page, pages, total, limit, onPageChange, onLimitChange
function Pagination({ page, pages, total, limit, onPageChange, onLimitChange }) {
  const PAGE_SIZES = [10, 25, 50, 100];
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  const btnStyle = (active) => ({
    background:   active ? "#00e5a820" : "transparent",
    border:       "1px solid " + (active ? "#00e5a8" : "#334155"),
    color:        active ? "#00e5a8" : "#64748b",
    padding:      "5px 11px",
    borderRadius: "6px",
    cursor:       "pointer",
    fontSize:     "13px",
    fontWeight:   active ? "700" : "400",
  });

  const buildPages = () => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 4)  return [1, 2, 3, 4, 5, "…", pages];
    if (page >= pages - 3) return [1, "…", pages-4, pages-3, pages-2, pages-1, pages];
    return [1, "…", page-1, page, page+1, "…", pages];
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: "10px", marginTop: "20px",
      padding: "14px 0", borderTop: "1px solid #1e293b",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#475569", fontSize: "13px" }}>Rows per page:</span>
        <select
          value={limit}
          onChange={e => { onLimitChange(Number(e.target.value)); onPageChange(1); }}
          style={{
            background: "#0b1220", border: "1px solid #334155", color: "#94a3b8",
            padding: "4px 8px", borderRadius: "6px", fontSize: "13px", cursor: "pointer",
          }}
        >
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ color: "#475569", fontSize: "13px" }}>
          {start}–{end} of {total.toLocaleString()}
        </span>
      </div>

      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={{ ...btnStyle(false), opacity: page === 1 ? 0.3 : 1 }}
        >‹ Prev</button>

        {buildPages().map((p, i) =>
          p === "…"
            ? <span key={i} style={{ color: "#475569", padding: "5px 4px", fontSize: "13px" }}>…</span>
            : <button key={i} onClick={() => onPageChange(p)} style={btnStyle(p === page)}>{p}</button>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          style={{ ...btnStyle(false), opacity: page === pages ? 0.3 : 1 }}
        >Next ›</button>
      </div>
    </div>
  );
}

export default Pagination;
