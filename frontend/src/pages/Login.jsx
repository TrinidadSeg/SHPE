import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../api/auth";
import { api } from "../api/client";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", full_name: "", major: "", grad_year: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      if (isRegister) {
        await api.register({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          major: form.major || null,
          grad_year: form.grad_year ? Number(form.grad_year) : null,
        });
      }
      await login(form.email, form.password);
      navigate("/events");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="eyebrow">SHPE · Purdue University</div>
        <h1 className="page-title" style={{ fontSize: 30, marginBottom: 4 }}>
          {isRegister ? "Join the chapter" : "Welcome back"}
        </h1>
        <p className="page-sub" style={{ marginBottom: 22 }}>
          {isRegister
            ? "Create your account to track points and RSVP."
            : "Sign in to check in at events and see your rank."}
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={submit}>
          {isRegister && (
            <div className="field">
              <label>Full name</label>
              <input value={form.full_name} onChange={set("full_name")} required />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set("email")}
              placeholder="you@purdue.edu" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set("password")} required />
          </div>
          {isRegister && (
            <div className="row">
              <div className="field">
                <label>Major</label>
                <input value={form.major} onChange={set("major")} placeholder="ECE" />
              </div>
              <div className="field">
                <label>Grad year</label>
                <input type="number" value={form.grad_year} onChange={set("grad_year")} placeholder="2027" />
              </div>
            </div>
          )}
          <button className="btn primary" style={{ width: "100%", marginTop: 6 }} disabled={busy}>
            {busy ? "…" : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="switch-link">
          {isRegister ? "Already a member?" : "New to SHPE Purdue?"}{" "}
          <button onClick={() => { setIsRegister(!isRegister); setError(""); }}>
            {isRegister ? "Sign in" : "Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
