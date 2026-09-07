import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard().then(setRows).finally(() => setLoading(false));
  }, []);

  const myRow = rows.find((r) => r.is_me);

  return (
    <div className="page">
      <div className="eyebrow">Conference eligibility</div>
      <h1 className="page-title">Leaderboard</h1>
      <p className="page-sub">
        Ranked by total points.{" "}
        {myRow && (
          <>You're <strong>#{myRow.rank}</strong> with <span className="num">{myRow.total}</span> points.</>
        )}
      </p>

      {loading ? (
        <p className="page-sub">Loading…</p>
      ) : (
        <div className="card" style={{ padding: 8 }}>
          <table>
            <thead>
              <tr><th style={{ width: 60 }}>Rank</th><th>Member</th><th style={{ textAlign: "right" }}>Points</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id} className={r.is_me ? "me-row" : ""}>
                  <td>
                    <span className={`rank-badge ${r.rank <= 3 ? "rank-" + r.rank : ""}`}>
                      {r.rank}
                    </span>
                  </td>
                  <td>
                    <strong>{r.full_name}</strong>
                    {r.is_me && <span style={{ color: "var(--flame-deep)", fontSize: 13, marginLeft: 8, fontWeight: 600 }}>you</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="num" style={{ fontSize: 17 }}>{r.total}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
