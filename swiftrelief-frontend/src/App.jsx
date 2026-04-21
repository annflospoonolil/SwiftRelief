import { useState, useEffect } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

// --- SHARED STYLES ---
const styles = {
  container: {
    padding: "40px",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    backgroundColor: "rgba(229, 202, 202, 0.93)", // Your custom theme
    minHeight: "100vh",
  },
  card: {
    maxWidth: "500px",
    margin: "0 auto",
    padding: "30px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    borderRadius: "12px",
    background: "#fff",
  },
  input: {
    width: "100%",
    padding: "12px",
    margin: "10px 0",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#2c2929",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#d32f2f",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
    background: "white",
  },
  th: {
    backgroundColor: "#444", // Darker for better contrast
    color: "#fff",
    padding: "12px",
    textAlign: "left",
  },
  td: { padding: "12px", borderBottom: "1px solid #eee" },
};

// --- 1. PUBLIC COMPONENT: SOS Form ---
const PublicReport = () => {
  const [formData, setFormData] = useState({ location: "", symptom: "" });
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false); // FIXED: Added missing state

  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({
          ...formData,
          location: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
        });
        setLocating(false);
      },
      () => {
        alert("Unable to retrieve your location.");
        setLocating(false);
      },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("http://127.0.0.1:8000/report-emergency", formData);
      alert("✅ SOS Dispatched! Emergency responders have been notified.");
      setFormData({ location: "", symptom: "" });
    } catch (err) {
      alert("❌ Error: Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ textAlign: "center" }}>
        <h1
          style={{ color: "#d32f2f", fontSize: "2.5rem", marginBottom: "5px" }}
        >
          🚑 SwiftRelief
        </h1>
        <p style={{ marginBottom: "20px" }}>
          Immediate Emergency Response Portal
        </p>
        <div style={styles.card}>
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: "left", marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold" }}>Location:</label>
              <button
                type="button"
                onClick={getGPSLocation}
                style={{
                  marginLeft: "10px",
                  cursor: "pointer",
                  fontSize: "11px",
                  padding: "2px 8px",
                }}
              >
                {locating ? "📍 Locating..." : "📍 Auto-Detect GPS"}
              </button>
              <input
                style={styles.input}
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Enter address or use GPS"
                required
              />
            </div>

            <div style={{ textAlign: "left", marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold" }}>
                Symptoms / Situation:
              </label>
              <textarea
                style={{ ...styles.input, height: "100px" }}
                placeholder="Describe the emergency..."
                value={formData.symptom}
                onChange={(e) =>
                  setFormData({ ...formData, symptom: e.target.value })
                }
                required
              />
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "SENDING..." : "SEND HELP NOW"}
            </button>
          </form>
        </div>
        <div style={{ marginTop: "30px" }}>
          <Link
            to="/login"
            style={{
              color: "#444",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Medical Staff Login →
          </Link>
        </div>
      </div>
    </div>
  );
};

// --- 2. ADMIN COMPONENT ---
const AdminDashboard = ({ setAuth }) => {
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/view-reports");
      setReports(res.data.active_emergencies);
    } catch (err) {
      console.error("Fetch failed");
    }
  };

  const resolve = async (id) => {
    if (window.confirm("Mark as resolved?")) {
      await axios.delete(`http://127.0.0.1:8000/resolve-emergency/${id}`);
      fetchReports();
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div style={styles.container}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h2>👨‍⚕️ Live Triage Dashboard</h2>
        <button
          onClick={() => {
            setAuth(false);
            navigate("/");
          }}
          style={{ ...styles.button, width: "auto", background: "#444" }}
        >
          Logout
        </button>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Priority</th>
            <th style={styles.th}>Location</th>
            <th style={styles.th}>Symptom</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr
              key={r.report_id}
              style={{ backgroundColor: r.priority === 1 ? "#fff5f5" : "#fff" }}
            >
              <td style={styles.td}>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: r.priority === 1 ? "#d32f2f" : "#ffa000",
                    color: "white",
                  }}
                >
                  P{r.priority}
                </span>
              </td>
              <td style={styles.td}>{r.location}</td>
              <td style={styles.td}>{r.symptom}</td>
              <td style={styles.td}>
                <button onClick={() => resolve(r.report_id)}>Resolve ✅</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- 3. LOGIN COMPONENT ---
const Login = ({ setAuth }) => {
  const [pass, setPass] = useState("");
  const navigate = useNavigate();
  const handleLogin = () => {
    if (pass === "admin123") {
      setAuth(true);
      navigate("/admin");
    } else {
      alert("Wrong password");
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, textAlign: "center", marginTop: "50px" }}>
        <h3>Staff Login</h3>
        <input
          type="password"
          style={styles.input}
          onChange={(e) => setPass(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleLogin()}
        />
        <button
          onClick={handleLogin}
          style={{ ...styles.button, background: "#1976d2" }}
        >
          Login
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [isAuth, setIsAuth] = useState(false);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicReport />} />
        <Route path="/login" element={<Login setAuth={setIsAuth} />} />
        <Route
          path="/admin"
          element={
            isAuth ? (
              <AdminDashboard setAuth={setIsAuth} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}
