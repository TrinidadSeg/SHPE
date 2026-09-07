import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./api/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Events from "./pages/Events";
import Leaderboard from "./pages/Leaderboard";
import MyPoints from "./pages/MyPoints";
import Announcements from "./pages/Announcements";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><p className="page-sub">Loading…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected><Layout /></Protected>}>
            <Route path="/events" element={<Events />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/points" element={<MyPoints />} />
            <Route path="/announcements" element={<Announcements />} />
          </Route>
          <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
