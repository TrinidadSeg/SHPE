import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../api/auth";

function fmtDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function Events() {
  const { isOfficer } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try { setEvents(await api.listEvents()); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="page">
      <div className="eyebrow">Chapter calendar</div>
      <div className="head-row">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-sub">Check in when you're there to earn points.</p>
        </div>
        {isOfficer && (
          <button className="btn navy" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Close" : "+ New event"}
          </button>
        )}
      </div>

      {showForm && <EventForm onDone={() => { setShowForm(false); load(); }} />}

      {loading ? (
        <p className="page-sub">Loading…</p>
      ) : events.length === 0 ? (
        <div className="empty">No events yet. {isOfficer ? "Create the first one." : "Check back soon."}</div>
      ) : (
        <div className="grid two">
          {events.map((ev) => (
            <EventCard key={ev.id} ev={ev} isOfficer={isOfficer} reload={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ ev, isOfficer, reload }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState(null);
  const [officerCode, setOfficerCode] = useState(null);

  async function doCheckin() {
    setMsg(null);
    try {
      const r = await api.submitCheckin(ev.id, code);
      setMsg({ ok: r.success, text: r.message });
      setCode("");
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  async function openWindow() {
    const w = await api.openCheckin(ev.id);
    setOfficerCode(w.code);
  }
  async function closeWindow() {
    await api.closeCheckin(ev.id);
    setOfficerCode(null);
    reload();
  }

  return (
    <div className="card event-card">
      <div className="pts-badge">
        <span className="num">{ev.points}</span>
        <small>pts</small>
      </div>
      <h3>{ev.title}</h3>
      <div className="event-meta">
        <span>🗓 {fmtDate(ev.starts_at)}</span>
        {ev.location && <span>📍 {ev.location}</span>}
      </div>
      {ev.description && (
        <p style={{ paddingLeft: 8, color: "var(--navy-soft)", fontSize: 14, marginTop: 0 }}>
          {ev.description}
        </p>
      )}

      {/* Member check-in */}
      <div style={{ paddingLeft: 8, marginTop: 6 }}>
        {msg && <div className={msg.ok ? "success" : "error"}>{msg.text}</div>}
        <div className="row" style={{ gap: 8 }}>
          <input
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              flex: 1, padding: "9px 12px", border: "1px solid var(--line)",
              borderRadius: 10, fontSize: 15, textTransform: "uppercase",
            }}
          />
          <button className="btn primary small" onClick={doCheckin} disabled={!code}>
            Check in
          </button>
        </div>
      </div>

      {/* Officer check-in controls */}
      {isOfficer && (
        <div style={{ paddingLeft: 8, marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          {officerCode ? (
            <>
              <div className="code-display">
                <small>Attendance code — project this</small>
                <div className="the-code">{officerCode}</div>
                <small>Members type this to check in</small>
              </div>
              <button className="btn ghost small" style={{ marginTop: 10 }} onClick={closeWindow}>
                Close check-in
              </button>
            </>
          ) : (
            <button className="btn navy small" onClick={openWindow}>
              Open check-in
            </button>
          )}
          <ImportAttendance eventId={ev.id} />
        </div>
      )}
    </div>
  );
}

function ImportAttendance({ eventId }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  async function runPreview() {
    if (!file) return;
    setBusy(true); setError(""); setDone(null);
    try {
      const result = await api.importAttendance(eventId, file, true);
      setPreview(result);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function confirmImport() {
    setBusy(true); setError("");
    try {
      const result = await api.importAttendance(eventId, file, false);
      setDone(result);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  return (
    <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy-soft)", marginBottom: 8 }}>
        Import attendance from university export
      </div>
      {error && <div className="error">{error}</div>}
      {done && (
        <div className="success">
          Awarded {done.awarded} member(s) {done.points_per_person} pt each.
          {done.unmatched.length > 0 && ` ${done.unmatched.length} email(s) not found in system.`}
        </div>
      )}
      <div className="row" style={{ gap: 8 }}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => { setFile(e.target.files[0]); setPreview(null); setDone(null); }}
          style={{ flex: 1, fontSize: 13 }}
        />
        <button className="btn ghost small" onClick={runPreview} disabled={!file || busy}>
          {busy ? "…" : "Preview"}
        </button>
      </div>

      {preview && (
        <div className="card" style={{ marginTop: 10, padding: 14 }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            <strong>{preview.attended_rows}</strong> attended · <strong>{preview.matched}</strong> matched to
            accounts · <strong>{preview.already_had_points}</strong> already have points ·{" "}
            <strong>{preview.matched - preview.already_had_points}</strong> will receive{" "}
            <strong>{preview.points_per_person}</strong> pt each
          </div>
          {preview.unmatched.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)" }}>
                Not found in portal ({preview.unmatched.length})
              </div>
              {preview.unmatched.map((u, i) => (
                <div key={i} style={{ fontSize: 13, color: "var(--navy-soft)" }}>
                  {u.name} — {u.email}
                </div>
              ))}
            </div>
          )}
          <button className="btn primary small" onClick={confirmImport} disabled={busy}>
            {busy ? "Awarding…" : `Confirm & award ${preview.matched - preview.already_had_points} member(s)`}
          </button>
        </div>
      )}
    </div>
  );
}

function EventForm({ onDone }) {
  const [form, setForm] = useState({ title: "", location: "", starts_at: "", points: 1, description: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api.createEvent({
        title: form.title,
        location: form.location || null,
        description: form.description || null,
        starts_at: new Date(form.starts_at).toISOString(),
        points: Number(form.points),
      });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="card" style={{ marginBottom: 22 }}>
      <h3 style={{ marginBottom: 14 }}>New event</h3>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Title</label>
          <input value={form.title} onChange={set("title")} required />
        </div>
        <div className="row">
          <div className="field">
            <label>Location</label>
            <input value={form.location} onChange={set("location")} placeholder="WALC 1055" />
          </div>
          <div className="field">
            <label>Starts at</label>
            <input type="datetime-local" value={form.starts_at} onChange={set("starts_at")} required />
          </div>
          <div className="field">
            <label>Points</label>
            <input type="number" min="0" value={form.points} onChange={set("points")} required />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea rows={2} value={form.description} onChange={set("description")} />
        </div>
        <button className="btn primary" disabled={busy}>
          {busy ? "Saving…" : "Publish event"}
        </button>
      </form>
    </div>
  );
}
