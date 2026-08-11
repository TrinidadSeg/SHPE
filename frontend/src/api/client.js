const TOKEN_KEY = "shpe_token";

// Base URL for the backend API.
// Local dev: empty string, so calls go to "/api/..." and Vite proxies to localhost:8000.
// Production: set VITE_API_BASE to your Azure backend URL at build time.
const API_BASE = import.meta.env.VITE_API_BASE || "";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Auth — login uses form encoding (OAuth2 form on the backend)
  async login(email, password) {
    const form = new URLSearchParams({ username: email, password });
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Login failed");
    return data; // { access_token }
  },
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  me: () => request("/auth/me"),

  // Events
  listEvents: () => request("/events"),
  createEvent: (payload) => request("/events", { method: "POST", body: payload }),

  // Check-in
  openCheckin: (id) => request(`/events/${id}/checkin/open`, { method: "POST" }),
  closeCheckin: (id) => request(`/events/${id}/checkin/close`, { method: "POST" }),
  submitCheckin: (id, code) =>
    request(`/events/${id}/checkin`, { method: "POST", body: { code } }),
  attendance: (id) => request(`/events/${id}/attendance`),

  // Points
  myPoints: () => request("/points/me"),
  leaderboard: () => request("/points/leaderboard"),
  awardPoints: (payload) => request("/points/award", { method: "POST", body: payload }),

  // Announcements
  listAnnouncements: () => request("/announcements"),
  createAnnouncement: (payload) =>
    request("/announcements", { method: "POST", body: payload }),
  deleteAnnouncement: (id) =>
    request(`/announcements/${id}`, { method: "DELETE" }),
};
