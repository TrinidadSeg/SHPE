import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function MyPoints() {
  const [data, setData] = useState(null);

  useEffect(() => { api.myPoints().then(setData); }, []);

  if (!data) return <div className="page"><p className="page-sub">Loading…</p></div>;

  return (
    <div className="page">
      <div className="eyebrow">Your standing</div>
      <h1 className="page-title">My Points</h1>

      <div className="card" style={{ textAlign: "center", padding: 34, marginBottom: 24 }}>
        <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", fontWeight: 600 }}>
          Total points
        </div>
        <div className="num" style={{ fontSize: 68, color: "var(--flame-deep)", lineHeight: 1.1 }}>
          {data.total}
        </div>
      </div>

      <h3 style={{ marginBottom: 12 }}>History</h3>
      {data.history.length === 0 ? (
        <div className="empty">No points yet. Check in at an event to get started.</div>
      ) : (
        <div className="card">
          {data.history.map((h, i) => (
            <div className="hist-item" key={i}>
              <div>
                <div style={{ fontWeight: 600 }}>{h.reason}</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>{fmtDate(h.created_at)}</div>
              </div>
              <div className="num" style={{ fontSize: 18 }}>+{h.points}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
