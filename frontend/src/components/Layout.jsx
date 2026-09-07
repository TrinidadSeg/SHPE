import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../api/auth";
import { api } from "../api/client";

export default function Layout() {
  const { user, logout } = useAuth();
  const [total, setTotal] = useState(null);

  useEffect(() => {
    api.myPoints().then((d) => setTotal(d.total)).catch(() => {});
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="mark">S</span>
          <span>
            <b>SHPE Purdue</b>
            <small>Member Portal</small>
          </span>
        </div>
        <nav className="nav">
          <NavLink to="/events" className={({ isActive }) => (isActive ? "active" : "")}>Events</NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => (isActive ? "active" : "")}>Leaderboard</NavLink>
          <NavLink to="/points" className={({ isActive }) => (isActive ? "active" : "")}>My Points</NavLink>
          <NavLink to="/announcements" className={({ isActive }) => (isActive ? "active" : "")}>News</NavLink>
          {total !== null && (
            <span className="chip-points">
              <span className="num">{total}</span><span>pts</span>
            </span>
          )}
          <button className="btn ghost small" style={{ marginLeft: 8 }} onClick={logout}>Sign out</button>
        </nav>
      </header>
      <Outlet />
    </>
  );
}
