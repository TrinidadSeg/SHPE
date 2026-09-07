import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../api/auth";

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Announcements() {
  const { isOfficer } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try { setItems(await api.listAnnouncements()); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function remove(id) {
    await api.deleteAnnouncement(id);
    load();
  }

  return (
    <div className="page">
      <div className="eyebrow">Chapter news</div>
      <div className="head-row">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-sub">The latest from your officers.</p>
        </div>
        {isOfficer && (
          <button className="btn navy" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Close" : "+ Post"}
          </button>
        )}
      </div>

      {showForm && <AnnForm onDone={() => { setShowForm(false); load(); }} />}

      {loading ? (
        <p className="page-sub">Loading…</p>
      ) : items.length === 0 ? (
        <div className="empty">No announcements yet.</div>
      ) : (
        <div className="grid">
          {items.map((a) => (
            <div className="card announce-card" key={a.id}>
              <h3>{a.title}</h3>
              <div className="announce-meta">{a.author_name} · {fmtDate(a.created_at)}</div>
              <p style={{ margin: 0, color: "var(--navy-soft)", whiteSpace: "pre-wrap" }}>{a.body}</p>
              {isOfficer && (
                <button className="btn ghost small" style={{ marginTop: 12 }} onClick={() => remove(a.id)}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnnForm({ onDone }) {
  const [form, setForm] = useState({ title: "", body: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api.createAnnouncement(form);
      onDone();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="card" style={{ marginBottom: 22 }}>
      <h3 style={{ marginBottom: 14 }}>New announcement</h3>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Title</label>
          <input value={form.title} onChange={set("title")} required />
        </div>
        <div className="field">
          <label>Message</label>
          <textarea rows={4} value={form.body} onChange={set("body")} required />
        </div>
        <button className="btn primary" disabled={busy}>{busy ? "Posting…" : "Post announcement"}</button>
      </form>
    </div>
  );
}
