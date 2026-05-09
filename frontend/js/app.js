// const { useState, useEffect, useRef } = React;

// const API_BASE = "http://127.0.0.1:5000/api";

// function getSectorIcon(tag) {
//     const t = (tag || "").toLowerCase();
//     if (!t) return "🤝";
//     if (t.includes("education") || t.includes("literacy")) return "📚";
//     if (t.includes("health") || t.includes("healthcare") || t.includes("medical")) return "🏥";
//     if (t.includes("food")) return "🍲";
//     if (t.includes("environment") || t.includes("climate") || t.includes("conservation")) return "🌱";
//     if (t.includes("women")) return "♀";
//     if (t.includes("child") || t.includes("youth")) return "👧";
//     if (t.includes("rural") || t.includes("community")) return "🏘";
//     if (t.includes("art") || t.includes("culture") || t.includes("heritage")) return "🎨";
//     if (t.includes("research") || t.includes("innovation") || t.includes("technology")) return "💡";
//     return "🤝";
// }

// function renderSectorTags(sectorString) {
//     return (sectorString || "")
//         .split("|")
//         .map((s) => s.trim())
//         .filter(Boolean)
//         .map((tag) => (
//             <span key={tag} className="pill pill-tag">
//                 <span className="pill-icon" aria-hidden="true">
//                     {getSectorIcon(tag)}
//                 </span>
//                 {tag}
//             </span>
//         ));
// }

// function getInitials(name) {
//     if (!name) return "?";
//     const parts = String(name)
//         .trim()
//         .split(/\s+/)
//         .filter(Boolean);
//     if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
//     return (parts[0][0] + parts[1][0]).toUpperCase();
// }

// function isImageMediaUrl(url) {
//     if (!url) return false;
//     const u = String(url).toLowerCase();
//     return (
//         u.startsWith("data:image/") ||
//         /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/.test(u)
//     );
// }

// function getHashRoute() {
//     const raw = window.location.hash || "#/home";
//     const cleaned = raw.startsWith("#") ? raw.slice(1) : raw;
//     const [path] = cleaned.split("?");
//     return path.startsWith("/") ? path : `/${path}`;
// }

// function navigate(path) {
//     window.location.hash = `#${path}`;
// }

// async function apiRequest(path, method = "GET", body, token) {
//     const headers = {
//         "Content-Type": "application/json",
//     };
//     if (token) {
//         headers["X-User-Id"] = token;
//     }

//     const res = await fetch(`${API_BASE}${path}`, {
//         method,
//         headers,
//         body: body ? JSON.stringify(body) : undefined,
//     });
//     const data = await res.json();
//     if (!res.ok) {
//         throw new Error(data.message || "Request failed");
//     }
//     return data;
// }

// function Toast({ toast, onClose }) {
//     useEffect(() => {
//         if (!toast) return;
//         const t = setTimeout(() => onClose(), 3500);
//         return () => clearTimeout(t);
//     }, [toast, onClose]);

//     if (!toast) return null;
//     return (
//         <div className={`toast ${toast.type || "info"}`}>
//             <span>{toast.message}</span>
//             <button onClick={onClose} aria-label="Dismiss">
//                 ×
//             </button>
//         </div>
//     );
// }

// function AuthPanel({ onAuthenticated, defaultMode = "login" }) {
//     const [mode, setMode] = useState("login");
//     const [role, setRole] = useState("INDIVIDUAL");
//     const [showPass, setShowPass] = useState(false);
//     const [form, setForm] = useState({
//         name: "",
//         email: "",
//         password: "",
//         organization_name: "",
//         mission_statement: "",
//         sector: "",
//         geographic_focus: "",
//     });
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setForm((prev) => ({ ...prev, [name]: value }));
//     };

//     useEffect(() => { setMode(defaultMode); }, [defaultMode]);

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setError(null);
//         try {
//             if (mode === "login") {
//                 const res = await apiRequest("/auth/login", "POST", { email: form.email, password: form.password });
//                 onAuthenticated(res.user, res.token);
//             } else {
//                 const payload = { name: form.name, email: form.email, password: form.password, role, organization_name: form.organization_name };
//                 if (role === "NGO") {
//                     payload.mission_statement = form.mission_statement;
//                     payload.sector = form.sector;
//                     payload.geographic_focus = form.geographic_focus;
//                 }
//                 const res = await apiRequest("/auth/register", "POST", payload);
//                 onAuthenticated(res.user, String(res.user.id));
//             }
//         } catch (err) {
//             setError(err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const roleOptions = [
//         { value: "NGO", icon: "🌍", label: "NGO" },
//         { value: "CORPORATE", icon: "🏢", label: "Corporate" },
//         { value: "INDIVIDUAL", icon: "❤️", label: "Individual" },
//     ];

//     return (
//         <div className="auth-v2-card">
//             {/* Gradient Header */}
//             <div className="auth-v2-header">
//                 <div className="auth-v2-header-tag">✨ Unified Impact Platform</div>
//                 <h2 className="auth-v2-title">
//                     {mode === "login" ? "Welcome back" : "Join the movement"}
//                 </h2>
//                 <p className="auth-v2-subtitle">
//                     {mode === "login"
//                         ? "Sign in to continue your impact journey"
//                         : "Create your account and start making a difference"}
//                 </p>
//             </div>

//             {/* Tabs */}
//             <div className="auth-v2-tabs">
//                 <button
//                     className={mode === "login" ? "auth-v2-tab active" : "auth-v2-tab"}
//                     onClick={() => setMode("login")}
//                     type="button"
//                 >
//                     Login
//                 </button>
//                 <button
//                     className={mode === "register" ? "auth-v2-tab active" : "auth-v2-tab"}
//                     onClick={() => setMode("register")}
//                     type="button"
//                 >
//                     Register
//                 </button>
//             </div>

//             <form className="auth-v2-form" onSubmit={handleSubmit}>
//                 {/* Register: Role Picker */}
//                 {mode === "register" && (
//                     <div className="auth-v2-role-section">
//                         <div className="auth-v2-label-small">I am a...</div>
//                         <div className="auth-v2-role-grid">
//                             {roleOptions.map(r => (
//                                 <button
//                                     key={r.value}
//                                     type="button"
//                                     className={role === r.value ? "auth-v2-role-card active" : "auth-v2-role-card"}
//                                     onClick={() => setRole(r.value)}
//                                 >
//                                     <span className="auth-v2-role-icon">{r.icon}</span>
//                                     <span className="auth-v2-role-label">{r.label}</span>
//                                 </button>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {/* Register: Name + Org */}
//                 {mode === "register" && (
//                     <>
//                         <div className="auth-v2-input-wrap">
//                             <span className="auth-v2-input-icon">👤</span>
//                             <input
//                                 className="auth-v2-input"
//                                 name="name"
//                                 value={form.name}
//                                 onChange={handleChange}
//                                 placeholder="Full name"
//                                 required
//                             />
//                         </div>
//                         <div className="auth-v2-input-wrap">
//                             <span className="auth-v2-input-icon">🏢</span>
//                             <input
//                                 className="auth-v2-input"
//                                 name="organization_name"
//                                 value={form.organization_name}
//                                 onChange={handleChange}
//                                 placeholder="Organization name (optional)"
//                             />
//                         </div>
//                     </>
//                 )}

//                 {/* Email */}
//                 <div className="auth-v2-input-wrap">
//                     <span className="auth-v2-input-icon">✉️</span>
//                     <input
//                         className="auth-v2-input"
//                         type="email"
//                         name="email"
//                         value={form.email}
//                         onChange={handleChange}
//                         placeholder="Email address"
//                         required
//                     />
//                 </div>

//                 {/* Password */}
//                 <div className="auth-v2-input-wrap">
//                     <span className="auth-v2-input-icon">🔒</span>
//                     <input
//                         className="auth-v2-input"
//                         type={showPass ? "text" : "password"}
//                         name="password"
//                         value={form.password}
//                         onChange={handleChange}
//                         placeholder="Password"
//                         required
//                     />
//                     <button
//                         type="button"
//                         className="auth-v2-eye-btn"
//                         onClick={() => setShowPass(s => !s)}
//                         tabIndex={-1}
//                     >
//                         {showPass ? "🙈" : "👁️"}
//                     </button>
//                 </div>

//                 {/* Forgot password */}
//                 {mode === "login" && (
//                     <div className="auth-v2-forgot">
//                         <button type="button" className="auth-v2-text-link">Forgot password?</button>
//                     </div>
//                 )}

//                 {/* NGO extra fields */}
//                 {mode === "register" && role === "NGO" && (
//                     <div className="auth-v2-ngo-extras">
//                         <div className="auth-v2-section-divider">
//                             <span>NGO Details</span>
//                         </div>
//                         <div className="auth-v2-input-wrap">
//                             <span className="auth-v2-input-icon">📋</span>
//                             <textarea
//                                 className="auth-v2-input auth-v2-textarea"
//                                 name="mission_statement"
//                                 value={form.mission_statement}
//                                 onChange={handleChange}
//                                 placeholder="Mission statement..."
//                                 required
//                             />
//                         </div>
//                         <div className="auth-v2-input-wrap">
//                             <span className="auth-v2-input-icon">🏷️</span>
//                             <input
//                                 className="auth-v2-input"
//                                 name="sector"
//                                 value={form.sector}
//                                 onChange={handleChange}
//                                 placeholder="Sector (e.g. Education, Health)"
//                                 required
//                             />
//                         </div>
//                         <div className="auth-v2-input-wrap">
//                             <span className="auth-v2-input-icon">📍</span>
//                             <input
//                                 className="auth-v2-input"
//                                 name="geographic_focus"
//                                 value={form.geographic_focus}
//                                 onChange={handleChange}
//                                 placeholder="Geographic focus (city / region / country)"
//                                 required
//                             />
//                         </div>
//                     </div>
//                 )}

//                 {error && <div className="auth-v2-error">{error}</div>}

//                 <button type="submit" className="auth-v2-submit" disabled={loading}>
//                     {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
//                 </button>

//                 <p className="auth-v2-switch">
//                     {mode === "login" ? (
//                         <>Don't have an account? <button type="button" className="auth-v2-text-link bold" onClick={() => setMode("register")}>Register</button></>
//                     ) : (
//                         <>Already have an account? <button type="button" className="auth-v2-text-link bold" onClick={() => setMode("login")}>Login</button></>
//                     )}
//                 </p>
//             </form>
//         </div>
//     );
// }

// function NGOPortal({ user, token }) {
//     const [profile, setProfile] = useState(null);
//     const [saving, setSaving] = useState(false);
//     const [message, setMessage] = useState(null);

//     useEffect(() => {
//         async function loadProfile() {
//             try {
//                 const res = await apiRequest("/users/me", "GET", undefined, token);
//                 setProfile(res.ngo_profile);
//             } catch (e) {
//                 console.error(e);
//             }
//         }
//         loadProfile();
//     }, [token]);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setProfile((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleSave = async (e) => {
//         e.preventDefault();
//         if (!profile) return;
//         setSaving(true);
//         setMessage(null);
//         try {
//             await apiRequest(
//                 `/ngos/${profile.id}`,
//                 "PUT",
//                 {
//                     mission_statement: profile.mission_statement,
//                     sector: profile.sector,
//                     geographic_focus: profile.geographic_focus,
//                 },
//                 token
//             );
//             setMessage("Profile updated and credibility recalculated.");
//         } catch (err) {
//             setMessage(err.message);
//         } finally {
//             setSaving(false);
//         }
//     };

//     if (!profile) {
//         return <div className="card">Loading NGO profile...</div>;
//     }

//     return (
//         <>
//             <div className="grid-2">
//                 <div className="card">
//                     <h2>NGO Profile</h2>
//                     <form className="form-grid" onSubmit={handleSave}>
//                         <label className="full-width">
//                             Mission Statement
//                             <textarea
//                                 name="mission_statement"
//                                 value={profile.mission_statement}
//                                 onChange={handleChange}
//                             />
//                         </label>
//                         <label>
//                             Sector
//                             <input
//                                 name="sector"
//                                 value={profile.sector}
//                                 onChange={handleChange}
//                             />
//                         </label>
//                         <label>
//                             Geographic Focus
//                             <input
//                                 name="geographic_focus"
//                                 value={profile.geographic_focus}
//                                 onChange={handleChange}
//                             />
//                         </label>
//                         <div className="pill-row">
//                             <span className={`pill status-${profile.verification_status.toLowerCase()}`}>
//                                 {profile.verification_status}
//                             </span>
//                             <span className="pill">
//                                 Credibility: {profile.credibility_score.toFixed(1)} / 100
//                             </span>
//                         </div>
//                         <button type="submit" className="primary-btn" disabled={saving}>
//                             {saving ? "Saving..." : "Save Profile"}
//                         </button>
//                         {message && <div className="info-banner">{message}</div>}
//                     </form>
//                 </div>
//                 <NGOPosts token={token} />
//             </div>
//             <NgoDirectoryInsights token={token} />
//             <NgoCatalogDashboard token={token} />
//         </>
//     );
// }

// function NGOPosts({ token }) {
//     const [content, setContent] = useState("");
//     const [mediaUrl, setMediaUrl] = useState("");
//     const [submitting, setSubmitting] = useState(false);
//     const [postType, setPostType] = useState("FUNDING_REQUIREMENT");

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setSubmitting(true);
//         try {
//             const friendlyLabel =
//                 postType === "GRANT_REQUEST"
//                     ? "Grant Request"
//                     : postType === "FUNDING_REQUIREMENT"
//                     ? "Funding Requirement"
//                     : "Update";
//             const payloadContent = `[${friendlyLabel}] ${content.trim()}`;

//             await apiRequest(
//                 "/posts",
//                 "POST",
//                 {
//                     content: payloadContent,
//                     media_url: mediaUrl || undefined,
//                     visibility: "PUBLIC",
//                 },
//                 token
//             );
//             setContent("");
//             setMediaUrl("");
//             alert("Post published to the network.");
//         } catch (err) {
//             alert(err.message);
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     return (
//         <div className="card">
//             <h2>Share Requirements & Grant Requests</h2>
//             <p className="muted" style={{ marginBottom: "0.6rem" }}>
//                 Publish specific funding requirements, grant asks, or general impact updates so donors can
//                 quickly understand how to support your work.
//             </p>
//             <form className="form-grid" onSubmit={handleSubmit}>
//                 <label>
//                     Post Type
//                     <select value={postType} onChange={(e) => setPostType(e.target.value)}>
//                         <option value="FUNDING_REQUIREMENT">Funding requirement</option>
//                         <option value="GRANT_REQUEST">Grant / partnership ask</option>
//                         <option value="UPDATE">General update</option>
//                     </select>
//                 </label>
//                 <label className="full-width">
//                     Describe your need / proposal
//                     <textarea
//                         value={content}
//                         onChange={(e) => setContent(e.target.value)}
//                         placeholder="Example: We are seeking a PKR 500,000 grant to expand our after‑school program to 3 more districts over the next 12 months..."
//                         required
//                     />
//                 </label>
//                 <label className="full-width">
//                     Media URL (optional)
//                     <input
//                         value={mediaUrl}
//                         onChange={(e) => setMediaUrl(e.target.value)}
//                         placeholder="Link to images, videos, or reports"
//                     />
//                 </label>
//                 <button type="submit" className="primary-btn" disabled={submitting}>
//                     {submitting ? "Publishing..." : "Publish Update"}
//                 </button>
//             </form>
//         </div>
//     );
// }

// function NgoDirectoryInsights({ token }) {
//     const [ngos, setNgos] = useState([]);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         apiRequest("/ngos", "GET", undefined, token)
//             .then(res => setNgos(res.ngos || []))
//             .catch(console.error)
//             .finally(() => setLoading(false));
//     }, [token]);

//     if (loading) return (
//         <div className="card" style={{ marginTop: "1.5rem", textAlign: "center", padding: "2.5rem" }}>
//             <span style={{ color: "#94a3b8" }}>Loading NGO insights...</span>
//         </div>
//     );

//     // Build state → count and sector → count from live data
//     const stateCounts = {};
//     const sectorCounts = {};
//     ngos.forEach(ngo => {
//         // geographic_focus is seeded as "State, Country" or "Global"
//         const geo = (ngo.geographic_focus || "Global");
//         const statePart = geo.split(",")[0].trim();
//         const stateKey = (statePart === "Global" || statePart === "") ? "Global" : statePart;
//         stateCounts[stateKey] = (stateCounts[stateKey] || 0) + 1;

//         // sector is pipe-separated tags e.g. "Education|Healthcare|Community Development"
//         (ngo.sector || "General").split("|").forEach(s => {
//             const key = s.trim();
//             if (key) sectorCounts[key] = (sectorCounts[key] || 0) + 1;
//         });
//     });

//     const sortedStates  = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]);
//     const sortedSectors = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);
//     const maxStateCount  = sortedStates[0]?.[1]  || 1;
//     const maxSectorCount = sortedSectors[0]?.[1] || 1;

//     const totalNGOs    = ngos.length;
//     const totalStates  = sortedStates.filter(([s]) => s !== "Global").length;
//     const totalSectors = Object.keys(sectorCounts).length;

//     // Region color coding
//     const regionColors = {
//         "Karnataka": "#00c896",  "Tamil Nadu": "#00c896",  "Andhra Pradesh": "#00b894",
//         "Telangana": "#00b894",  "Kerala": "#10b981",
//         "Delhi": "#0ea5e9",      "Rajasthan": "#38bdf8",   "Uttar Pradesh": "#38bdf8",
//         "Haryana": "#7dd3fc",    "Punjab": "#7dd3fc",
//         "Maharashtra": "#a78bfa", "Gujarat": "#c084fc",
//         "West Bengal": "#fb923c", "Odisha": "#f97316",
//         "Madhya Pradesh": "#fbbf24",
//         "Global": "#64748b",
//     };
//     const regionDefault = "#94a3b8";

//     const sectorPalette = [
//         "#00c896","#10b981","#00b894","#059669",
//         "#0ea5e9","#38bdf8","#22d3ee",
//         "#a78bfa","#c084fc","#e879f9",
//         "#fb923c","#fbbf24",
//     ];

//     const StatBar = ({ label, count, max, color }) => (
//         <div>
//             <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.25rem" }}>
//                 <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{label}</span>
//                 <span style={{ color, fontWeight: 700 }}>{count} NGO{count !== 1 ? "s" : ""}</span>
//             </div>
//             <div style={{ height: "7px", borderRadius: "999px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
//                 <div style={{
//                     height: "100%",
//                     width: `${Math.round((count / max) * 100)}%`,
//                     background: `linear-gradient(90deg, ${color}, ${color}88)`,
//                     borderRadius: "999px",
//                     transition: "width 0.7s ease",
//                 }} />
//             </div>
//         </div>
//     );

//     return (
//         <div className="card" style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
//             {/* Header row */}
//             <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
//                 <div>
//                     <h2 style={{ margin: 0, fontSize: "1.25rem" }}>NGO Directory Insights</h2>
//                     <p className="muted" style={{ margin: "0.2rem 0 0" }}>Live distribution from the verified NGO catalog</p>
//                 </div>
//                 <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
//                     {[
//                         { label: "Total NGOs",   value: totalNGOs,    color: "#00c896" },
//                         { label: "States / Regions", value: totalStates,  color: "#38bdf8" },
//                         { label: "Sectors",       value: totalSectors, color: "#a78bfa" },
//                     ].map((s, i) => (
//                         <div key={i} style={{
//                             background: `${s.color}18`,
//                             border: `1px solid ${s.color}38`,
//                             borderRadius: "12px",
//                             padding: "0.45rem 1rem",
//                             textAlign: "center",
//                             minWidth: "80px",
//                         }}>
//                             <div style={{ fontSize: "1.35rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
//                             <div style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "0.2rem" }}>{s.label}</div>
//                         </div>
//                     ))}
//                 </div>
//             </div>

//             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2.5rem" }}>
//                 {/* Geographic distribution */}
//                 <div>
//                     <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
//                         <span style={{ fontSize: "1.1rem" }}>📍</span>
//                         <h3 style={{ margin: 0, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 700 }}>Geographic Distribution</h3>
//                     </div>
//                     <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
//                         {sortedStates.map(([state, count], i) => (
//                             <StatBar key={i} label={state} count={count} max={maxStateCount} color={regionColors[state] || regionDefault} />
//                         ))}
//                     </div>
//                     <div style={{ marginTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
//                         {[
//                             { label: "South India",  color: "#00c896" },
//                             { label: "North India",  color: "#38bdf8" },
//                             { label: "West India",   color: "#a78bfa" },
//                             { label: "East India",   color: "#fb923c" },
//                             { label: "Global",       color: "#64748b" },
//                         ].map((r, i) => (
//                             <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.7rem", color: "#94a3b8" }}>
//                                 <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: r.color, flexShrink: 0 }} />
//                                 {r.label}
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Sector breakdown */}
//                 <div>
//                     <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
//                         <span style={{ fontSize: "1.1rem" }}>🏷️</span>
//                         <h3 style={{ margin: 0, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 700 }}>Top Sectors</h3>
//                     </div>
//                     <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
//                         {sortedSectors.map(([sector, count], i) => (
//                             <StatBar key={i} label={sector} count={count} max={maxSectorCount} color={sectorPalette[i % sectorPalette.length]} />
//                         ))}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// function NgoCatalogDashboard({ token }) {
//     const [ngos, setNgos] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [sectorFilter, setSectorFilter] = useState("ALL");
//     const [countryFilter, setCountryFilter] = useState("ALL");

//     useEffect(() => {
//         async function load() {
//             setLoading(true);
//             try {
//                 const res = await apiRequest("/ngos", "GET", undefined, token);
//                 setNgos(res.ngos || []);
//             } catch (e) {
//                 console.error(e);
//             } finally {
//                 setLoading(false);
//             }
//         }
//         load();
//     }, [token]);

//     const allSectors = Array.from(
//         new Set(
//             ngos.flatMap((ngo) =>
//                 (ngo.sector || "")
//                     .split("|")
//                     .map((s) => s.trim())
//                     .filter(Boolean)
//             )
//         )
//     ).sort();

//     const allCountries = Array.from(
//         new Set(
//             ngos
//                 .map((ngo) => {
//                     const geo = ngo.geographic_focus || "";
//                     const parts = geo.split(",");
//                     const country = parts.length > 1 ? parts[parts.length - 1] : parts[0];
//                     return (country || "").trim();
//                 })
//                 .filter(Boolean)
//         )
//     ).sort();

//     const normalizedSearch = searchTerm.trim().toLowerCase();

//     const filteredNgos = ngos.filter((ngo) => {
//         if (sectorFilter !== "ALL") {
//             const tags = (ngo.sector || "")
//                 .split("|")
//                 .map((s) => s.trim())
//                 .filter(Boolean);
//             if (!tags.includes(sectorFilter)) {
//                 return false;
//             }
//         }

//         if (countryFilter !== "ALL") {
//             const geo = ngo.geographic_focus || "";
//             const parts = geo.split(",");
//             const country = (parts.length > 1 ? parts[parts.length - 1] : parts[0] || "").trim();
//             if (country !== countryFilter) {
//                 return false;
//             }
//         }

//         if (!normalizedSearch) {
//             return true;
//         }

//         const haystack = `${ngo.name} ${ngo.sector} ${ngo.geographic_focus} ${
//             ngo.description || ""
//         }`.toLowerCase();
//         return haystack.includes(normalizedSearch);
//     });

//     return (
//         <div className="card">
//             <h2>NGO Landscape Dashboard</h2>
//             <p className="muted">
//                 Explore the NGO catalog used by the AI matching engine, with sector tags and
//                 geographic coverage.
//             </p>
//             <div className="row-actions" style={{ margin: "0.75rem 0" }}>
//                 <input
//                     style={{ flex: 1, minWidth: "180px" }}
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     placeholder="Search by NGO name, sector tag, or location..."
//                 />
//                 {allSectors.length > 0 && (
//                     <select
//                         value={sectorFilter}
//                         onChange={(e) => setSectorFilter(e.target.value)}
//                     >
//                         <option value="ALL">All sectors</option>
//                         {allSectors.map((s) => (
//                             <option key={s} value={s}>
//                                 {s}
//                             </option>
//                         ))}
//                     </select>
//                 )}
//                 {allCountries.length > 0 && (
//                     <select
//                         value={countryFilter}
//                         onChange={(e) => setCountryFilter(e.target.value)}
//                     >
//                         <option value="ALL">All countries</option>
//                         {allCountries.map((c) => (
//                             <option key={c} value={c}>
//                                 {c}
//                             </option>
//                         ))}
//                     </select>
//                 )}
//             </div>
//             <p className="muted" style={{ fontSize: "0.78rem" }}>
//                 Showing {filteredNgos.length} of {ngos.length} NGOs
//             </p>
//             {loading ? (
//                 <p>Loading NGO catalog...</p>
//             ) : (
//                 <div className="results-grid">
//                     {filteredNgos.map((ngo) => {
//                         const geo = ngo.geographic_focus || "";
//                         const parts = geo.split(",");
//                         const state = (parts[0] || "").trim();
//                         const country =
//                             (parts.length > 1 ? parts[parts.length - 1] : parts[0] || "").trim();
//                         const tags = (ngo.sector || "")
//                             .split("|")
//                             .map((s) => s.trim())
//                             .filter(Boolean);

//                         return (
//                             <div key={ngo.id} className="card subtle">
//                                 <h3>{ngo.name}</h3>
//                                 {ngo.description && (
//                                     <p className="muted" style={{ marginBottom: "0.5rem" }}>
//                                         {ngo.description}
//                                     </p>
//                                 )}
//                                 <div className="pill-row">
//                                     {tags.map((tag) => (
//                                         <span key={tag} className="pill">
//                                             {tag}
//                                         </span>
//                                     ))}
//                                 </div>
//                                 <p style={{ marginTop: "0.5rem" }}>
//                                     <strong>Location:</strong>{" "}
//                                     {state && country ? `${state}, ${country}` : geo || "N/A"}
//                                 </p>
//                                 <div className="pill-row" style={{ marginTop: "0.5rem" }}>
//                                     <span
//                                         className={`pill status-${ngo.verification_status.toLowerCase()}`}
//                                     >
//                                         {ngo.verification_status}
//                                     </span>
//                                     <span className="pill">
//                                         Credibility: {Number(ngo.credibility_score).toFixed(1)} / 100
//                                     </span>
//                                 </div>
//                             </div>
//                         );
//                     })}
//                     {!loading && ngos.length === 0 && (
//                         <p className="muted">No NGOs are registered in the catalog yet.</p>
//                     )}
//                     {!loading && ngos.length > 0 && filteredNgos.length === 0 && (
//                         <p className="muted">
//                             No NGOs match your current search or filters. Try broadening them.
//                         </p>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// }

// function DonorPortal({ user, token }) {
//     const [prefs, setPrefs] = useState({
//         cause: "",
//         location: "",
//         min_budget: "",
//         max_budget: "",
//     });
//     const [results, setResults] = useState([]);
//     const [history, setHistory] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [donatingNgo, setDonatingNgo] = useState(null);
//     const [donationForm, setDonationForm] = useState({
//         amount: "",
//         currency: "USD",
//         description: "",
//     });
//     const [searchTerm, setSearchTerm] = useState("");
//     const [sortBy, setSortBy] = useState("final_score");
//     const [usedFallback, setUsedFallback] = useState(false);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setPrefs((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleMatch = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setUsedFallback(false);
//         try {
//             const res = await apiRequest("/recommendations", "POST", prefs, token);
//             const recs = res.recommendations || [];
//             if (recs.length > 0) {
//                 setResults(recs);
//             } else {
//                 // If the AI engine has no data to work with yet (e.g. no NGOs
//                 // or no training history), gracefully fall back to all
//                 // registered NGOs so users still see useful options.
//                 const ngoRes = await apiRequest("/ngos", "GET", undefined, token);
//                 const raw = ngoRes.ngos || [];
//                 const mapped = raw.map((n, idx) => ({
//                     ngo_id: n.id,
//                     name: n.name,
//                     sector: n.sector,
//                     geographic_focus: n.geographic_focus,
//                     description: n.description,
//                     // Neutral-but-consistent placeholder scores so that
//                     // sorting and UI elements continue to work.
//                     base_similarity: 0.5,
//                     fairness_multiplier: 1.0,
//                     final_score: 0.5 - idx * 0.01,
//                 }));
//                 setResults(mapped);
//                 setUsedFallback(true);
//             }
//         } catch (err) {
//             alert(err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         async function loadHistory() {
//             try {
//                 const res = await apiRequest("/transactions/mine", "GET", undefined, token);
//                 setHistory(res.transactions || []);
//             } catch (e) {
//                 console.error(e);
//             }
//         }
//         loadHistory();
//     }, [token]);

//     const openDonate = (ngo) => {
//         setDonatingNgo(ngo);
//         setDonationForm({ amount: "", currency: "USD", description: "" });
//     };

//     const submitDonation = async (e) => {
//         e.preventDefault();
//         if (!donatingNgo) return;
//         const amount = Number(donationForm.amount);
//         if (!Number.isFinite(amount) || amount <= 0) {
//             alert("Please enter a valid amount.");
//             return;
//         }
//         try {
//             await apiRequest(
//                 "/transactions",
//                 "POST",
//                 {
//                     ngo_id: donatingNgo.ngo_id,
//                     amount,
//                     currency: donationForm.currency,
//                     description: donationForm.description || undefined,
//                 },
//                 token
//             );
//             setDonatingNgo(null);
//             const res = await apiRequest("/transactions/mine", "GET", undefined, token);
//             setHistory(res.transactions || []);
//             alert("Donation recorded successfully.");
//         } catch (e2) {
//             alert(e2.message);
//         }
//     };

//     const [sectorChipFilter, setSectorChipFilter] = useState("");

//     const normalizedSearch = searchTerm.trim().toLowerCase();
//     let visibleResults = results;
//     if (normalizedSearch) {
//         visibleResults = visibleResults.filter((ngo) => {
//             const haystack = `${ngo.name} ${ngo.sector} ${ngo.geographic_focus} ${
//                 ngo.description || ""
//             }`.toLowerCase();
//             return haystack.includes(normalizedSearch);
//         });
//     }
//     if (sectorChipFilter) {
//         visibleResults = visibleResults.filter((ngo) => {
//             const tags = (ngo.sector || "")
//                 .split("|")
//                 .map((s) => s.trim())
//                 .filter(Boolean);
//             return tags.includes(sectorChipFilter);
//         });
//     }
//     visibleResults = [...visibleResults].sort((a, b) => {
//         const aFinal = Number(a.final_score || 0);
//         const bFinal = Number(b.final_score || 0);
//         const aFair = Number(a.fairness_multiplier || 1);
//         const bFair = Number(b.fairness_multiplier || 1);
//         const aBase = Number(a.base_similarity || 0);
//         const bBase = Number(b.base_similarity || 0);

//         if (sortBy === "fairness") {
//             return bFair - aFair || bFinal - aFinal;
//         }
//         if (sortBy === "similarity") {
//             return bBase - aBase || bFinal - aFinal;
//         }
//         // default: final score
//         return bFinal - aFinal;
//     });

//     const sectorTagsAvailable = Array.from(
//         new Set(
//             results.flatMap((ngo) =>
//                 (ngo.sector || "")
//                     .split("|")
//                     .map((s) => s.trim())
//                     .filter(Boolean)
//             )
//         )
//     ).sort();

//     return (
//         <div className="grid-2">
//             <div className="card donor-card">
//                 <h2>AI-Matched NGO Recommendations</h2>
//                 <form className="form-grid" onSubmit={handleMatch}>
//                     <label>
//                         Preferred Cause / Sector
//                         <input
//                             name="cause"
//                             value={prefs.cause}
//                             onChange={handleChange}
//                             placeholder="Education, Health, Environment..."
//                             required
//                         />
//                     </label>
//                     <label>
//                         Geography
//                         <input
//                             name="location"
//                             value={prefs.location}
//                             onChange={handleChange}
//                             placeholder="Country / Region / City"
//                         />
//                     </label>
//                     <label>
//                         Min Budget (optional)
//                         <input
//                             type="number"
//                             name="min_budget"
//                             value={prefs.min_budget}
//                             onChange={handleChange}
//                         />
//                     </label>
//                     <label>
//                         Max Budget
//                         <input
//                             type="number"
//                             name="max_budget"
//                             value={prefs.max_budget}
//                             onChange={handleChange}
//                             required
//                         />
//                     </label>
//                     <button type="submit" className="primary-btn" disabled={loading}>
//                         {loading ? "Matching..." : "Find NGOs"}
//                     </button>
//                 </form>
//                 {results.length > 0 && (
//                     <p className="muted" style={{ marginTop: "0.6rem" }}>
//                         Matching for: <strong>{prefs.cause || "Any cause"}</strong>{" "}
//                         · <strong>{prefs.location || "Any location"}</strong>{" "}
//                         · Budget{" "}
//                         <strong>
//                             {prefs.min_budget || "0"} – {prefs.max_budget || "∞"}
//                         </strong>
//                     </p>
//                 )}
//                 {results.length > 0 && (
//                     <div className="row-actions" style={{ marginTop: "0.75rem" }}>
//                         <label style={{ flex: 1, minWidth: "180px" }}>
//                             <span style={{ display: "block", fontSize: "0.78rem", color: "#64748b" }}>
//                                 Search within recommended NGOs
//                             </span>
//                             <input
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                                 placeholder="Filter by name, sector, or geography..."
//                             />
//                         </label>
//                         <label>
//                             <span style={{ display: "block", fontSize: "0.78rem", color: "#64748b" }}>
//                                 Sort by
//                             </span>
//                             <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
//                                 <option value="final_score">Overall score (AI + fairness)</option>
//                                 <option value="fairness">Fairness boost (supports lesser‑known)</option>
//                                 <option value="similarity">Match to your preferences</option>
//                             </select>
//                         </label>
//                     </div>
//                 )}
//                 {results.length > 0 && sectorTagsAvailable.length > 0 && (
//                     <div className="filter-chips">
//                         <span className="filter-label">Filter by sector:</span>
//                         <button
//                             type="button"
//                             className={
//                                 !sectorChipFilter ? "chip chip-active" : "chip"
//                             }
//                             onClick={() => setSectorChipFilter("")}
//                         >
//                             All
//                         </button>
//                         {sectorTagsAvailable.map((tag) => (
//                             <button
//                                 key={tag}
//                                 type="button"
//                                 className={
//                                     sectorChipFilter === tag ? "chip chip-active" : "chip"
//                                 }
//                                 onClick={() => setSectorChipFilter(tag)}
//                             >
//                                 {getSectorIcon(tag)} {tag}
//                             </button>
//                         ))}
//                     </div>
//                 )}
//                 <div className="results-grid">
//                     {visibleResults.map((ngo) => (
//                         <div key={ngo.ngo_id} className="card subtle ngo-card">
//                             <div className="ngo-card-header">
//                                 <div className="avatar-circle">
//                                     {getInitials(ngo.name)}
//                                 </div>
//                                 <div className="ngo-card-title">
//                                     <h3>{ngo.name}</h3>
//                                     <div className="pill-row">
//                                         {renderSectorTags(ngo.sector)}
//                                     </div>
//                                 </div>
//                             </div>
//                             {ngo.description && (
//                                 <p className="ngo-card-description">
//                                     {ngo.description.length > 140
//                                         ? `${ngo.description.slice(0, 137)}...`
//                                         : ngo.description}
//                                 </p>
//                             )}
//                             <div className="ngo-card-meta">
//                                 <span className="location-pill">
//                                     <span className="pill-icon" aria-hidden="true">
//                                         📍
//                                     </span>
//                                     {ngo.geographic_focus || "N/A"}
//                                 </span>
//                                 <span className="score-pill">
//                                     Match score: {ngo.final_score.toFixed(2)}
//                                 </span>
//                             </div>
//                             <div className="ngo-card-metrics">
//                                 <span>
//                                     Similarity: {ngo.base_similarity.toFixed(2)}
//                                 </span>
//                                 <span>
//                                     Fairness boost: {ngo.fairness_multiplier.toFixed(2)}x
//                                 </span>
//                             </div>
//                             <div className="row-actions ngo-card-actions">
//                                 <button className="secondary-btn" onClick={() => openDonate(ngo)}>
//                                     Donate
//                                 </button>
//                             </div>
//                         </div>
//                     ))}
//                     {results.length === 0 && (
//                         <p className="muted">
//                             Submit your preferences to see AI-ranked NGO recommendations that
//                             balance relevance with fairness.
//                         </p>
//                     )}
//                     {results.length > 0 && visibleResults.length === 0 && (
//                         <p className="muted">
//                             No NGOs match your current search. Try clearing or relaxing your filters.
//                         </p>
//                     )}
//                     {usedFallback && results.length > 0 && (
//                         <p className="muted">
//                             Showing all registered NGOs because the AI engine does not yet have
//                             enough data to prioritize them. As profiles and transactions grow,
//                             this view will become smarter.
//                         </p>
//                     )}
//                 </div>
//             </div>
//             <div className="card">
//                 <h2>Your Donation History</h2>
//                 {history.length === 0 ? (
//                     <p className="muted">
//                         Once you record transactions via the CSR team or integrated payment
//                         rails, they will appear here for impact tracking.
//                     </p>
//                 ) : (
//                     <ul className="timeline">
//                         {history.map((tx) => (
//                             <li key={tx.id}>
//                                 <div className="timeline-title">
//                                     {tx.ngo_name} — {tx.amount} {tx.currency}
//                                 </div>
//                                 <div className="timeline-meta">
//                                     {new Date(tx.transacted_at).toLocaleString()}
//                                 </div>
//                                 {tx.description && (
//                                     <div className="timeline-body">{tx.description}</div>
//                                 )}
//                             </li>
//                         ))}
//                     </ul>
//                 )}
//             </div>
//             {donatingNgo && (
//                 <div className="modal-backdrop" onClick={() => setDonatingNgo(null)}>
//                     <div className="modal" onClick={(e) => e.stopPropagation()}>
//                         <h2>Donate to {donatingNgo.name}</h2>
//                         <form className="form-grid" onSubmit={submitDonation}>
//                             <label>
//                                 Amount
//                                 <input
//                                     type="number"
//                                     value={donationForm.amount}
//                                     onChange={(e) =>
//                                         setDonationForm((p) => ({ ...p, amount: e.target.value }))
//                                     }
//                                     required
//                                 />
//                             </label>
//                             <label>
//                                 Currency
//                                 <select
//                                     value={donationForm.currency}
//                                     onChange={(e) =>
//                                         setDonationForm((p) => ({ ...p, currency: e.target.value }))
//                                     }
//                                 >
//                                     <option value="USD">USD</option>
//                                     <option value="PKR">PKR</option>
//                                     <option value="EUR">EUR</option>
//                                     <option value="GBP">GBP</option>
//                                 </select>
//                             </label>
//                             <label className="full-width">
//                                 Description (optional)
//                                 <input
//                                     value={donationForm.description}
//                                     onChange={(e) =>
//                                         setDonationForm((p) => ({
//                                             ...p,
//                                             description: e.target.value,
//                                         }))
//                                     }
//                                     placeholder="e.g., Education supplies for Q2"
//                                 />
//                             </label>
//                             <div className="row-actions full-width">
//                                 <button type="button" className="ghost-btn" onClick={() => setDonatingNgo(null)}>
//                                     Cancel
//                                 </button>
//                                 <button type="submit" className="primary-btn">
//                                     Confirm Donation
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// function NetworkingDirectory({ token, requireAuth }) {
//     const [ngos, setNgos] = useState([]);
//     const [followeeIds, setFolloweeIds] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [sectorFilter, setSectorFilter] = useState("ALL");
//     const [selectedNgo, setSelectedNgo] = useState(null);
//     const [selectedDetails, setSelectedDetails] = useState(null);
//     const [detailsLoading, setDetailsLoading] = useState(false);

//     const load = async () => {
//         setLoading(true);
//         try {
//             const [ngoRes, relRes] = await Promise.all([
//                 apiRequest("/ngos", "GET", undefined, token),
//                 token ? apiRequest("/relationships/mine", "GET", undefined, token) : Promise.resolve({ followee_ids: [] }),
//             ]);
//             setNgos(ngoRes.ngos || []);
//             setFolloweeIds(relRes.followee_ids || []);
//         } catch (e) {
//             console.error(e);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         load();
//     }, [token]);

//     const follow = async (userId) => {
//         if (!requireAuth()) return;
//         await apiRequest("/relationships/follow", "POST", { followee_id: userId }, token);
//         load();
//     };

//     const unfollow = async (userId) => {
//         if (!requireAuth()) return;
//         await apiRequest("/relationships/unfollow", "POST", { followee_id: userId }, token);
//         load();
//     };

//     const openDetails = async (ngo) => {
//         setSelectedNgo(ngo);
//         setSelectedDetails(null);
//         setDetailsLoading(true);
//         try {
//             const res = await apiRequest(`/ngos/${ngo.id}`, "GET", undefined, token);
//             setSelectedDetails(res);
//         } catch (e) {
//             console.error(e);
//         } finally {
//             setDetailsLoading(false);
//         }
//     };

//     const closeDetails = () => {
//         setSelectedNgo(null);
//         setSelectedDetails(null);
//     };

//     const normalizedSearch = searchTerm.trim().toLowerCase();
//     const sectors = Array.from(new Set(ngos.map((n) => n.sector).filter(Boolean))).sort();
//     const filteredNgos = ngos.filter((ngo) => {
//         if (sectorFilter !== "ALL" && ngo.sector !== sectorFilter) return false;
//         if (!normalizedSearch) return true;
//         const haystack = `${ngo.name} ${ngo.sector} ${ngo.geographic_focus}`.toLowerCase();
//         return haystack.includes(normalizedSearch);
//     });

//     const verifiedCount = ngos.filter((n) => n.verification_status === "VERIFIED").length;
//     const sectorHighlights = sectors.slice(0, 2).join(" and ") || "Impact sectors";

//     return (
//         <div className="networking-layout">
//             <section className="card network-directory-surface">
//                 <div className="network-directory-head">
//                     <div>
//                         <h2>NGO Discovery</h2>
//                         <p className="muted">Find verified partners by mission, sector, and geography.</p>
//                     </div>
//                     <div className="network-directory-count">{filteredNgos.length} Partners Available</div>
//                 </div>

//                 <div className="network-search-row">
//                     <label className="network-search-wrap" aria-label="Search NGOs">
//                         <span aria-hidden="true">🔍</span>
//                         <input
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                             placeholder="Find by name, mission, or location..."
//                         />
//                     </label>
//                     {sectors.length > 0 && (
//                         <select
//                             className="network-sector-select"
//                             value={sectorFilter}
//                             onChange={(e) => setSectorFilter(e.target.value)}
//                         >
//                             <option value="ALL">All Impact Sectors</option>
//                             {sectors.map((s) => (
//                                 <option key={s} value={s}>
//                                     {s}
//                                 </option>
//                             ))}
//                         </select>
//                     )}
//                 </div>

//                 {loading ? (
//                     <p>Loading NGOs...</p>
//                 ) : (
//                     <div className="network-cards-grid">
//                         {filteredNgos.map((ngo) => {
//                             const isFollowing = followeeIds.includes(ngo.user_id);
//                             const score = Math.max(0, Math.min(100, Number(ngo.credibility_score || 0)));
//                             return (
//                                 <article key={ngo.id} className="network-ngo-card">
//                                     <div className="network-ngo-header">
//                                         <div className="avatar-circle">{getInitials(ngo.name)}</div>
//                                         <div>
//                                             <h3>{ngo.name}</h3>
//                                             <p className="network-ngo-location">
//                                                 <span aria-hidden="true">📍</span>
//                                                 {ngo.geographic_focus}
//                                             </p>
//                                         </div>
//                                     </div>

//                                     <div className="pill-row">{renderSectorTags(ngo.sector)}</div>

//                                     <div className="network-score-row">
//                                         <span>Trust Score</span>
//                                         <span className={`pill status-${ngo.verification_status.toLowerCase()}`}>
//                                             {ngo.verification_status}
//                                         </span>
//                                     </div>
//                                     <div className="network-score-value">{Math.round(score)}%</div>
//                                     <div className="network-score-track" aria-hidden="true">
//                                         <span className="network-score-fill" style={{ width: `${score}%` }} />
//                                     </div>

//                                     <div className="network-ngo-actions">
//                                         {isFollowing ? (
//                                             <button className="secondary-btn" onClick={() => unfollow(ngo.user_id)}>
//                                                 Following
//                                             </button>
//                                         ) : (
//                                             <button className="primary-btn" onClick={() => follow(ngo.user_id)}>
//                                                 Follow Partner
//                                             </button>
//                                         )}
//                                         <button type="button" className="ghost-btn" onClick={() => openDetails(ngo)}>
//                                             Profile →
//                                         </button>
//                                     </div>
//                                 </article>
//                             );
//                         })}
//                         {ngos.length === 0 && <p className="muted">No NGOs registered yet.</p>}
//                         {ngos.length > 0 && filteredNgos.length === 0 && (
//                             <p className="muted">No NGOs match your current search or filters.</p>
//                         )}
//                     </div>
//                 )}
//             </section>

//             <aside className="networking-side-stack">
//                 <section className="card network-side-card">
//                     <h3>Your Impact Network</h3>
//                     <p className="muted">Building your network improves your feed and collaboration matches.</p>
//                     <div className="network-kpi-grid">
//                         <div>
//                             <strong>{followeeIds.length}</strong>
//                             <span>Following</span>
//                         </div>
//                         <div>
//                             <strong>{Math.min(12, followeeIds.length * 2)}</strong>
//                             <span>Collaborations</span>
//                         </div>
//                     </div>
//                 </section>

//                 <section className="card network-side-card">
//                     <h3>Platform Insights</h3>
//                     <ul className="simple-list">
//                         <li>
//                             <strong>High Impact Sectors:</strong> {sectorHighlights} lead this week.
//                         </li>
//                         <li>
//                             <strong>Verified Partners:</strong> {verifiedCount} trusted NGOs available now.
//                         </li>
//                         <li>
//                             <strong>Regional Growth:</strong> {ngos.length} NGOs listed across your network.
//                         </li>
//                     </ul>
//                 </section>
//             </aside>

//             {selectedNgo && (
//                 <div className="modal-backdrop" onClick={closeDetails}>
//                     <div className="modal" onClick={(e) => e.stopPropagation()}>
//                         <h2>{selectedNgo.name}</h2>
//                         {detailsLoading || !selectedDetails ? (
//                             <p className="muted">Loading NGO profile...</p>
//                         ) : (
//                             <>
//                                 <p className="muted" style={{ marginBottom: "0.75rem" }}>
//                                     {selectedDetails.mission_statement}
//                                 </p>
//                                 <div className="pill-row" style={{ marginBottom: "0.75rem" }}>
//                                     <span className="pill">
//                                         Sector: {selectedDetails.sector}
//                                     </span>
//                                     <span className="pill">
//                                         Geography: {selectedDetails.geographic_focus}
//                                     </span>
//                                 </div>
//                             </>
//                         )}
//                         <div className="row-actions" style={{ marginTop: "0.5rem" }}>
//                             {selectedNgo && (
//                                 followeeIds.includes(selectedNgo.user_id) ? (
//                                     <button
//                                         type="button"
//                                         className="secondary-btn"
//                                         onClick={() => {
//                                             if (!requireAuth()) return;
//                                             unfollow(selectedNgo.user_id);
//                                         }}
//                                     >
//                                         Unfollow
//                                     </button>
//                                 ) : (
//                                     <button
//                                         type="button"
//                                         className="secondary-btn"
//                                         onClick={() => {
//                                             if (!requireAuth()) return;
//                                             follow(selectedNgo.user_id);
//                                         }}
//                                     >
//                                         Follow
//                                     </button>
//                                 )
//                             )}
//                             <button type="button" className="ghost-btn" onClick={closeDetails}>
//                                 Close
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// function SocialNetworking({ token, requireAuth, onViewDiscover }) {
//     const [feed, setFeed] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [newPost, setNewPost] = useState("");
//     const [mediaUrl, setMediaUrl] = useState("");
//     const [selectedFile, setSelectedFile] = useState(null);
//     const [selectedPreview, setSelectedPreview] = useState("");
//     const [uploading, setUploading] = useState(false);
//     const fileInputRef = useRef(null);

//     const loadFeed = async () => {
//         setLoading(true);
//         try {
//             const res = await apiRequest("/feed", "GET", undefined, token);
//             setFeed(res.feed || []);
//         } catch (e) {
//             console.error(e);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         loadFeed();
//     }, [token]);

//     const pickImage = () => {
//         if (fileInputRef.current) {
//             fileInputRef.current.click();
//         }
//     };

//     const onFileChange = (e) => {
//         const file = e.target.files && e.target.files[0];
//         if (!file) return;
//         if (!file.type.startsWith("image/")) {
//             alert("Please select an image file.");
//             return;
//         }
//         setSelectedFile(file);
//         const reader = new FileReader();
//         reader.onload = () => setSelectedPreview(String(reader.result || ""));
//         reader.readAsDataURL(file);
//     };

//     const clearSelectedFile = () => {
//         setSelectedFile(null);
//         setSelectedPreview("");
//         if (fileInputRef.current) {
//             fileInputRef.current.value = "";
//         }
//     };

//     const uploadSelectedImage = async () => {
//         if (!selectedFile) return undefined;
//         const formData = new FormData();
//         formData.append("file", selectedFile);

//         const headers = {};
//         if (token) {
//             headers["X-User-Id"] = token;
//         }

//         const res = await fetch(`${API_BASE}/uploads/media`, {
//             method: "POST",
//             headers,
//             body: formData,
//         });

//         const data = await res.json();
//         if (!res.ok) {
//             throw new Error(data.message || "Image upload failed");
//         }
//         return data.media_url;
//     };

//     const submitPost = async (e) => {
//         e.preventDefault();
//         try {
//             if (!requireAuth()) return;
//             setUploading(true);

//             let resolvedMediaUrl = mediaUrl.trim() || undefined;
//             if (selectedFile) {
//                 resolvedMediaUrl = await uploadSelectedImage();
//             }

//             await apiRequest(
//                 "/posts",
//                 "POST",
//                 { content: newPost, media_url: resolvedMediaUrl, visibility: "PUBLIC" },
//                 token
//             );
//             setNewPost("");
//             setMediaUrl("");
//             clearSelectedFile();
//             loadFeed();
//         } catch (e) {
//             alert(e.message);
//         } finally {
//             setUploading(false);
//         }
//     };

//     const likePost = async (id) => {
//         try {
//             if (!requireAuth()) return;
//             await apiRequest(`/posts/${id}/like`, "POST", {}, token);
//             loadFeed();
//         } catch (e) {
//             alert(e.message);
//         }
//     };

//     const commentPost = async (id, text, reset) => {
//         try {
//             if (!requireAuth()) return;
//             await apiRequest(
//                 `/posts/${id}/comments`,
//                 "POST",
//                 { comment_text: text },
//                 token
//             );
//             reset();
//             loadFeed();
//         } catch (e) {
//             alert(e.message);
//         }
//     };

//     const sharePost = async (id) => {
//         try {
//             if (!requireAuth()) return;
//             await apiRequest(`/posts/${id}/share`, "POST", {}, token);
//             loadFeed();
//         } catch (e) {
//             alert(e.message);
//         }
//     };

//     const trending = [...feed]
//         .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
//         .slice(0, 3);

//     return (
//         <div className="social-layout">
//             <div className="social-main-column">
//                 <section className="card social-compose-card">
//                     <h2>Share an Update</h2>
//                     <p className="muted">Stories, impact reports, or funding needs</p>
//                     <form onSubmit={submitPost} className="social-compose-form">
//                         <input
//                             ref={fileInputRef}
//                             type="file"
//                             accept="image/*"
//                             onChange={onFileChange}
//                             style={{ display: "none" }}
//                         />
//                         <textarea
//                             value={newPost}
//                             onChange={(e) => setNewPost(e.target.value)}
//                             placeholder="What's happening in your impact journey?"
//                         />
//                         {selectedFile && (
//                             <div className="social-upload-preview">
//                                 {selectedPreview ? (
//                                     <img src={selectedPreview} alt="Selected preview" />
//                                 ) : (
//                                     <div className="social-upload-fallback">Image selected</div>
//                                 )}
//                                 <div className="social-upload-meta">
//                                     <strong>{selectedFile.name}</strong>
//                                     <span>{Math.round(selectedFile.size / 1024)} KB</span>
//                                 </div>
//                                 <button type="button" className="social-upload-clear" onClick={clearSelectedFile}>
//                                     Remove
//                                 </button>
//                             </div>
//                         )}
//                         <div className="social-compose-actions">
//                             <label className="social-media-input" aria-label="Media URL">
//                                 <span aria-hidden="true">🔗</span>
//                                 <input
//                                     value={mediaUrl}
//                                     onChange={(e) => setMediaUrl(e.target.value)}
//                                     placeholder="Link media (Image/Video URL)"
//                                 />
//                             </label>
//                             <button type="button" className="secondary-btn social-upload-btn" onClick={pickImage}>
//                                 Upload Photo
//                             </button>
//                             <button type="submit" className="primary-btn" disabled={uploading}>
//                                 {uploading ? "Posting..." : "Post Update"}
//                             </button>
//                         </div>
//                     </form>
//                 </section>

//                 <section className="social-feed-stack">
//                     {loading ? (
//                         <p>Loading feed...</p>
//                     ) : feed.length === 0 ? (
//                         <div className="card">
//                             <p className="muted">No posts yet. Be the first to share.</p>
//                         </div>
//                     ) : (
//                         <div className="feed-list">
//                             {feed.map((post) => (
//                                 <FeedItem
//                                     key={post.id}
//                                     post={post}
//                                     onLike={likePost}
//                                     onComment={commentPost}
//                                     onShare={sharePost}
//                                     token={token}
//                                 />
//                             ))}
//                         </div>
//                     )}
//                 </section>
//             </div>

//             <aside className="social-side-column">
//                 <section className="card social-side-card">
//                     <h3>Trending NGOs</h3>
//                     {trending.length === 0 ? (
//                         <p className="muted">No trends yet.</p>
//                     ) : (
//                         <ul className="social-trending-list">
//                             {trending.map((post) => {
//                                 const displayName = post.ngo_name || post.author_name || "NGO";
//                                 return (
//                                     <li key={post.id}>
//                                         <div className="avatar-circle avatar-small">{getInitials(displayName)}</div>
//                                         <div>
//                                             <strong>{displayName}</strong>
//                                             <span>{post.content.slice(0, 36)}{post.content.length > 36 ? "..." : ""}</span>
//                                         </div>
//                                         <button
//                                             type="button"
//                                             className="ghost-btn"
//                                             onClick={() => likePost(post.id)}
//                                         >
//                                             Follow
//                                         </button>
//                                     </li>
//                                 );
//                             })}
//                         </ul>
//                     )}
//                     <button
//                         type="button"
//                         className="link-btn"
//                         onClick={() => {
//                             if (onViewDiscover) {
//                                 onViewDiscover();
//                             } else {
//                                 navigate("/impact-network");
//                             }
//                         }}
//                     >
//                         View All NGOs →
//                     </button>
//                 </section>

//                 <section className="card social-side-card">
//                     <h3>Impact Tips</h3>
//                     <ul className="simple-list">
//                         <li><strong>Be Specific:</strong> Use tags like [Urgent] for funding needs.</li>
//                         <li><strong>Visuals Matter:</strong> Posts with media links get higher engagement.</li>
//                         <li><strong>Tag Locations:</strong> Mention city or region to attract local donors.</li>
//                     </ul>
//                 </section>
//             </aside>
//         </div>
//     );
// }

// function FeedItem({ post, onLike, onComment, onShare, token }) {
//     const [comment, setComment] = useState("");
//     const [showComments, setShowComments] = useState(false);
//     const [comments, setComments] = useState([]);
//     const [loadingComments, setLoadingComments] = useState(false);

//     const loadComments = async () => {
//         setLoadingComments(true);
//         try {
//             const res = await apiRequest(`/posts/${post.id}/comments`, "GET", undefined, token);
//             setComments(res.comments || []);
//         } catch (e) {
//             console.error(e);
//         } finally {
//             setLoadingComments(false);
//         }
//     };

//     const displayName = post.ngo_name || post.author_name || "Community Member";

//     return (
//         <article className="feed-item">
//             <header className="feed-header">
//                 <div className="feed-header-main">
//                     <div className="avatar-circle avatar-small">
//                         {getInitials(displayName)}
//                     </div>
//                     <div>
//                         <div className="feed-title">{displayName}</div>
//                         <div className="feed-meta">
//                             {new Date(post.created_at).toLocaleString()}
//                         </div>
//                     </div>
//                 </div>
//             </header>
//             <p>{post.content}</p>
//             {post.media_url && isImageMediaUrl(post.media_url) && (
//                 <img src={post.media_url} alt="Post media" className="feed-media-image" />
//             )}
//             {post.media_url && !isImageMediaUrl(post.media_url) && (
//                 <a href={post.media_url} target="_blank" rel="noreferrer" className="media-link">
//                     View attached media
//                 </a>
//             )}
//             <div className="feed-actions">
//                 <button className="feed-action-btn" onClick={() => onLike(post.id)} aria-label="Like post">
//                     <svg className="feed-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//                         <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
//                     </svg>
//                     <span>{post.like_count}</span>
//                 </button>
//                 <button
//                     className="feed-action-btn"
//                     onClick={async () => {
//                         const next = !showComments;
//                         setShowComments(next);
//                         if (next) await loadComments();
//                     }}
//                     aria-label="View comments"
//                 >
//                     <svg className="feed-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//                         <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
//                     </svg>
//                     <span>{post.comment_count}</span>
//                 </button>
//                 <button className="feed-action-btn" onClick={() => onShare(post.id)} aria-label="Share post">
//                     <svg className="feed-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//                         <circle cx="18" cy="5" r="3" />
//                         <circle cx="6" cy="12" r="3" />
//                         <circle cx="18" cy="19" r="3" />
//                         <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
//                         <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
//                     </svg>
//                     <span>{post.share_count}</span>
//                 </button>
//             </div>
//             {showComments && (
//                 <div className="comments-panel">
//                     {loadingComments ? (
//                         <p className="muted">Loading comments...</p>
//                     ) : comments.length === 0 ? (
//                         <p className="muted">No comments yet.</p>
//                     ) : (
//                         <ul className="comments-list">
//                             {comments.map((c) => (
//                                 <li key={c.id}>
//                                     <div className="comment-head">
//                                         <strong>{c.user_name || "User"}</strong>
//                                         <span className="comment-time">
//                                             {new Date(c.created_at).toLocaleString()}
//                                         </span>
//                                     </div>
//                                     <div className="comment-body">{c.comment_text}</div>
//                                 </li>
//                             ))}
//                         </ul>
//                     )}
//                 </div>
//             )}
//             <form
//                 className="comment-form"
//                 onSubmit={(e) => {
//                     e.preventDefault();
//                     if (!comment.trim()) return;
//                     onComment(post.id, comment, () => setComment(""));
//                 }}
//             >
//                 <input
//                     value={comment}
//                     onChange={(e) => setComment(e.target.value)}
//                     placeholder="Add a comment..."
//                 />
//                 <button type="submit">Send</button>
//             </form>
//         </article>
//     );
// }

// function GamificationPanel({ user, token }) {
//     const [overview, setOverview] = useState(null);

//     useEffect(() => {
//         async function load() {
//             try {
//                 const res = await apiRequest("/analytics/overview", "GET", undefined, token);
//                 setOverview(res);
//             } catch (e) {
//                 console.error(e);
//             }
//         }
//         load();
//     }, [token]);

//     const badges = [];
//     if (overview && overview.total_amount > 0) {
//         badges.push("Impact Investor");
//     }
//     if (overview && Object.keys(overview.per_sector || {}).length >= 3) {
//         badges.push("Portfolio Diversifier");
//     }
//     if (user.role === "NGO") {
//         badges.push("Change Maker");
//     }

//     const progressValue = overview ? Math.min(100, (overview.total_amount || 0) / 1000) : 0;

//     return (
//         <div className="grid-2">
//             <div className="card">
//                 <h2>Your Impact Badges</h2>
//                 {badges.length === 0 ? (
//                     <p className="muted">
//                         As you donate, collaborate, and share updates, you will unlock impact
//                         badges and climb the leaderboard.
//                     </p>
//                 ) : (
//                     <div className="badge-grid">
//                         {badges.map((b) => (
//                             <div key={b} className="badge">
//                                 <span>{b}</span>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//                 <div className="progress-card">
//                     <div className="progress-header">
//                         <span className="muted">Engagement level</span>
//                         <span className="progress-label">
//                             Level {progressValue >= 80 ? "Impact Champion" : progressValue >= 40 ? "Rising Ally" : "Starter"}
//                         </span>
//                     </div>
//                     <div className="progress-track">
//                         <div
//                             className="progress-fill"
//                             style={{ width: `${progressValue}%` }}
//                         />
//                     </div>
//                 </div>
//             </div>
//             <div className="card">
//                 <h2>Leaderboard (Sample)</h2>
//                 <ul className="leaderboard">
//                     <li>
//                         <span>Top Corporate Donor</span>
//                         <strong>FutureTech Inc.</strong>
//                     </li>
//                     <li>
//                         <span>Top NGO (Education)</span>
//                         <strong>Rural EduCare</strong>
//                     </li>
//                     <li>
//                         <span>Top Individual Ally</span>
//                         <strong>Anonymous</strong>
//                     </li>
//                 </ul>
//             </div>
//         </div>
//     );
// }

// function AnalyticsDashboard({ token }) {
//     const [data, setData] = useState(null);

//     useEffect(() => {
//         async function load() {
//             try {
//                 const res = await apiRequest("/analytics/overview", "GET", undefined, token);
//                 setData(res);
//             } catch (e) {
//                 console.error(e);
//             }
//         }
//         load();
//     }, [token]);

//     if (!data) {
//         return <div className="card">Loading analytics...</div>;
//     }

//     const maxSector = Math.max(
//         1,
//         ...Object.values(data.per_sector || {}).map((v) => v || 0)
//     );

//     const totalNgos = Object.keys(data.per_ngo || {}).length;
//     const totalSectors = Object.keys(data.per_sector || {}).length;

//     return (
//         <div className="grid-2">
//             <div className="card">
//                 <h2>Funding Overview</h2>
//                 <div className="summary-grid">
//                     <div className="summary-card">
//                         <span className="summary-label">Total tracked funding</span>
//                         <span className="summary-value">
//                             {data.total_amount.toFixed(2)} USD
//                         </span>
//                     </div>
//                     <div className="summary-card">
//                         <span className="summary-label">NGOs supported</span>
//                         <span className="summary-value">{totalNgos}</span>
//                     </div>
//                     <div className="summary-card">
//                         <span className="summary-label">Active sectors</span>
//                         <span className="summary-value">{totalSectors}</span>
//                     </div>
//                 </div>
//                 <h3>By Sector</h3>
//                 <div className="bar-chart">
//                     {Object.entries(data.per_sector || {}).map(([sector, amount]) => {
//                         const width = `${(amount / maxSector) * 100 || 5}%`;
//                         return (
//                             <div key={sector} className="bar-row">
//                                 <span className="bar-label">{sector}</span>
//                                 <div className="bar-track">
//                                     <div className="bar-fill" style={{ width }} />
//                                 </div>
//                                 <span className="bar-value">{amount.toFixed(2)}</span>
//                             </div>
//                         );
//                     })}
//                     {Object.keys(data.per_sector || {}).length === 0 && (
//                         <p className="muted">
//                             Once transactions are recorded, sector-wise funding will appear
//                             here.
//                         </p>
//                     )}
//                 </div>
//             </div>
//             <div className="card">
//                 <h2>Top Supported NGOs</h2>
//                 <ul className="simple-list">
//                     {Object.entries(data.per_ngo || {}).map(([ngo, amount]) => (
//                         <li key={ngo}>
//                             <span>{ngo}</span>
//                             <strong>{amount.toFixed(2)} USD</strong>
//                         </li>
//                     ))}
//                     {Object.keys(data.per_ngo || {}).length === 0 && (
//                         <p className="muted">
//                             No NGO-level analytics yet. As contributions flow, this panel will
//                             highlight key partners.
//                         </p>
//                     )}
//                 </ul>
//             </div>
//         </div>
//     );
// }

// const QUICK_REPLIES = ["Tell me about NGOs", "How do I donate?", "What is AI matching?", "Show me analytics"];

// function Chatbot() {
//     const [isOpen, setIsOpen] = useState(false);
//     const [messages, setMessages] = useState([
//         { role: 'assistant', content: "👋 Hi! I'm ImpactBot, your AI assistant for the Unified Impact Platform. Ask me anything about NGOs, donations, or platform features!" }
//     ]);
//     const [input, setInput] = useState('');
//     const [loading, setLoading] = useState(false);
//     const messagesEndRef = React.useRef(null);

//     useEffect(() => {
//         if (messagesEndRef.current) {
//             messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
//         }
//     }, [messages, loading]);

//     const sendMessage = async (text) => {
//         const content = (text || input).trim();
//         if (!content || loading) return;
//         const userMessage = { role: 'user', content };
//         setMessages(prev => [...prev, userMessage]);
//         setInput('');
//         setLoading(true);
//         try {
//             const response = await apiRequest('/chat', 'POST', { message: content });
//             setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
//         } catch {
//             setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <>
//             {/* Floating Action Button */}
//             {!isOpen && (
//                 <button
//                     className="chatbot-fab"
//                     onClick={() => setIsOpen(true)}
//                     title="Chat with ImpactBot"
//                 >
//                     💬
//                     <span className="chatbot-fab-dot" />
//                 </button>
//             )}

//             {/* Chat Window */}
//             {isOpen && (
//                 <div className="chatbot-window">
//                     {/* Header */}
//                     <div className="chatbot-window-header">
//                         <div className="chatbot-header-left">
//                             <div className="chatbot-avatar-wrap">🤖</div>
//                             <div>
//                                 <div className="chatbot-bot-name">ImpactBot</div>
//                                 <div className="chatbot-status">
//                                     <span className="chatbot-online-dot" />
//                                     <span>AI Assistant · Online</span>
//                                 </div>
//                             </div>
//                         </div>
//                         <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>✕</button>
//                     </div>

//                     {/* Messages */}
//                     <div className="chatbot-messages-area">
//                         {messages.map((msg, idx) => (
//                             <div key={idx} className={`chatbot-msg-row ${msg.role}`}>
//                                 <div className={`chatbot-msg-avatar ${msg.role}`}>
//                                     {msg.role === 'user' ? '👤' : '🤖'}
//                                 </div>
//                                 <div className={`chatbot-bubble ${msg.role}`}>
//                                     {msg.content}
//                                 </div>
//                             </div>
//                         ))}
//                         {loading && (
//                             <div className="chatbot-msg-row assistant">
//                                 <div className="chatbot-msg-avatar assistant">🤖</div>
//                                 <div className="chatbot-bubble assistant chatbot-typing">
//                                     <span className="chatbot-dot" />
//                                     <span className="chatbot-dot" />
//                                     <span className="chatbot-dot" />
//                                 </div>
//                             </div>
//                         )}
//                         <div ref={messagesEndRef} />
//                     </div>

//                     {/* Quick Replies */}
//                     <div className="chatbot-quick-replies">
//                         {QUICK_REPLIES.map(r => (
//                             <button key={r} className="chatbot-quick-btn" onClick={() => sendMessage(r)}>
//                                 {r}
//                             </button>
//                         ))}
//                     </div>

//                     {/* Input */}
//                     <div className="chatbot-input-area">
//                         <input
//                             className="chatbot-text-input"
//                             value={input}
//                             onChange={e => setInput(e.target.value)}
//                             onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
//                             placeholder="Ask me anything..."
//                             disabled={loading}
//                         />
//                         <button
//                             className="chatbot-send-btn"
//                             onClick={() => sendMessage()}
//                             disabled={loading || !input.trim()}
//                         >
//                             ➤
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// }

// const ALL_TESTIMONIALS = [
//     { name: "Priya Sharma",       role: "Corporate CSR Head",    org: "TechBridge Corp",         text: "The AI matching saved us weeks of research. We found three perfect NGO partners aligned with our environmental goals within hours.",                                              initials: "PS", color: "#00c896" },
//     { name: "Dr. Arjun Mehta",    role: "NGO Founder",           org: "EduReach Foundation",     text: "As a small NGO, visibility was our biggest challenge. This platform gave us credibility scoring and connected us with donors we never would have found.",                        initials: "AM", color: "#10b981" },
//     { name: "Sunita Rao",         role: "Individual Contributor", org: "Impact Champion",         text: "The gamification and social feed make giving feel meaningful. I can follow my favorite NGOs and track exactly how my donations are used.",                                       initials: "SR", color: "#00b894" },
//     { name: "Karthik Nair",       role: "CSR Manager",           org: "Infosys Foundation",      text: "We used to spend months vetting NGOs manually. The credibility score and sector filters let us shortlist quality partners in minutes.",                                         initials: "KN", color: "#38bdf8" },
//     { name: "Meena Iyer",         role: "Executive Director",    org: "GreenShores Trust",       text: "After joining this platform our donation inflow grew by 60% in six months. The exposure to corporate donors changed everything for our small coastal NGO.",                     initials: "MI", color: "#a78bfa" },
//     { name: "Rahul Verma",        role: "Social Impact Lead",    org: "Paytm Foundation",        text: "The networking directory helped us find three complementary NGOs for a joint project. The collaboration feature is something no other platform offers.",                         initials: "RV", color: "#fb923c" },
//     { name: "Anjali Desai",       role: "Volunteer Coordinator", org: "Teach For India",         text: "Managing volunteer sign-ups and tracking hours used to be chaos. The portal streamlined everything and our volunteer retention improved dramatically.",                          initials: "AD", color: "#00c896" },
//     { name: "Vikram Singh",       role: "Philanthropist",        org: "Singh Family Foundation", text: "I donate to eight different NGOs and this is the first platform that lets me track all of them from a single dashboard with real impact metrics.",                               initials: "VS", color: "#10b981" },
//     { name: "Dr. Lakshmi Reddy",  role: "Programme Officer",     org: "CARE India",              text: "The grant request feature let us publish our funding needs publicly. We received expressions of interest from four corporate donors within two weeks.",                           initials: "LR", color: "#00b894" },
//     { name: "Nikhil Bose",        role: "Co-founder",            org: "RuralTech Initiative",    text: "As a rural-focused NGO with limited digital presence, the AI matching algorithm actually brought us to donors who cared about our specific geography.",                         initials: "NB", color: "#38bdf8" },
//     { name: "Farah Khan",         role: "Head of Partnerships",  org: "Reliance Foundation",     text: "We have partnered with eleven NGOs through this platform. The transparency in credibility scoring makes decision-making straightforward.",                                       initials: "FK", color: "#a78bfa" },
//     { name: "Shanthi Pillai",     role: "Beneficiary Advocate",  org: "Akshaya Patra",           text: "The social feed keeps our supporters updated on real ground work. Engagement from our network has more than doubled since we started posting here.",                             initials: "SP", color: "#fb923c" },
// ];

// function shuffleArray(arr) {
//     const a = [...arr];
//     for (let i = a.length - 1; i > 0; i--) {
//         const j = Math.floor(Math.random() * (i + 1));
//         [a[i], a[j]] = [a[j], a[i]];
//     }
//     return a;
// }

// function Home({ goto, token }) {
//     const [visibleIdx, setVisibleIdx] = React.useState(0);
//     const [shuffled]  = React.useState(() => shuffleArray(ALL_TESTIMONIALS));
//     const shown = shuffled.slice(0, 3); // pick 3 random on mount

//     React.useEffect(() => {
//         // Auto-cycle the active highlighted card every 4 s
//         const id = setInterval(() => setVisibleIdx(v => (v + 1) % shown.length), 4000);
//         return () => clearInterval(id);
//     }, [shown.length]);

//     return (
//         <div className="home-container">
//             {/* Hero */}
//             <section className="hero-section">
//                 <div className="hero-content-modern">
//                     <div className="hero-badge-chip">✨ AI-Powered NGO Platform</div>
//                     <h2 className="hero-title">Empower Change,<br/>Together</h2>
//                     <p className="hero-tagline">
//                         A modern, unified platform bridging the gap between NGOs, corporate donors, and individual contributors. Let's make a real difference.
//                     </p>
//                     <div className="hero-actions">
//                         <button className="btn-modern btn-primary" onClick={() => goto("/login")}>
//                             Get Started / Log In
//                         </button>
//                         <button className="btn-modern btn-secondary" onClick={() => goto("/networking", { requireLogin: true })}>
//                             Explore NGOs →
//                         </button>
//                     </div>
//                 </div>
//                 <div className="hero-illustration-modern">
//                     <div className="glass-shape shape-1"></div>
//                     <div className="glass-shape shape-2"></div>
//                     <div className="glass-shape shape-3"></div>
//                 </div>
//             </section>

//             {/* Stats */}
//             <section className="impact-counters">
//                 <div className="counter-card glass-card">
//                     <h3>50+</h3>
//                     <p>NGOs in Network</p>
//                 </div>
//                 <div className="counter-card glass-card">
//                     <h3>15+</h3>
//                     <p>Impact Sectors</p>
//                 </div>
//                 <div className="counter-card glass-card">
//                     <h3>AI Powered</h3>
//                     <p>Matching Algorithm</p>
//                 </div>
//             </section>

//             {/* How It Works */}
//             <section className="how-it-works-modern">
//                 <h2 className="section-title">How It Works</h2>
//                 <p className="section-subtitle">Three simple steps to amplify your social impact</p>
//                 <div className="steps-grid">
//                     <div className="step-card glass-card">
//                         <div className="step-icon">🎯</div>
//                         <div className="step-number">Step 1</div>
//                         <h3>Set your intent</h3>
//                         <p>Specify causes, geographies, and budgets to shape your targeted impact.</p>
//                     </div>
//                     <div className="step-card glass-card">
//                         <div className="step-icon">🤝</div>
//                         <div className="step-number">Step 2</div>
//                         <h3>Match with Needs</h3>
//                         <p>Our AI engine surfaces opportunities that align with your focus seamlessly.</p>
//                     </div>
//                     <div className="step-card glass-card">
//                         <div className="step-icon">📈</div>
//                         <div className="step-number">Step 3</div>
//                         <h3>Track Real Impact</h3>
//                         <p>Integrated analytics and stories help you evidence outcomes clearly.</p>
//                     </div>
//                 </div>
//             </section>

//             {/* Features */}
//             <section className="features-section">
//                 <div className="features-header">
//                     <h2 className="section-title">Everything You Need</h2>
//                     <p className="section-subtitle">A comprehensive platform built for NGOs, donors, and contributors</p>
//                 </div>
//                 <div className="features-grid">
//                     {[
//                         { icon: "⚡", title: "AI-Powered Matching", desc: "Our intelligent algorithm connects donors with the right NGOs using fairness multipliers to support lesser-known organizations.", color: "#00c896" },
//                         { icon: "🛡️", title: "Verified NGOs", desc: "Every organization on our platform goes through a rigorous verification process with credibility scoring.", color: "#10b981" },
//                         { icon: "🌍", title: "Global Reach", desc: "Connect with NGOs across 50+ countries working in education, health, environment, and more.", color: "#00b894" },
//                         { icon: "👥", title: "Community Driven", desc: "A thriving social feed, networking directory, and gamification system keeps contributors engaged.", color: "#00c896" },
//                         { icon: "📊", title: "Real-time Analytics", desc: "Track your donations, measure impact, and see where every rupee goes with detailed dashboards.", color: "#059669" },
//                         { icon: "❤️", title: "Multiple Giving Modes", desc: "One-time donations, recurring giving, grant applications — flexible options for all contributor types.", color: "#00b894" },
//                     ].map((f, i) => (
//                         <div key={i} className="feature-card glass-card">
//                             <div className="feature-icon-wrap" style={{ background: f.color + '18', color: f.color }}>
//                                 <span style={{ fontSize: '1.3rem' }}>{f.icon}</span>
//                             </div>
//                             <h3 className="feature-title">{f.title}</h3>
//                             <p className="feature-desc">{f.desc}</p>
//                         </div>
//                     ))}
//                 </div>
//             </section>

//             {/* Testimonials */}
//             <section className="testimonials-section">
//                 <h2 className="section-title">Voices of Impact</h2>
//                 <p className="section-subtitle">Real stories from our community</p>
//                 <div className="testimonials-grid">
//                     {shown.map((t, i) => (
//                         <div
//                             key={i}
//                             className="testimonial-card glass-card"
//                             style={{
//                                 transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
//                                 transform: visibleIdx === i ? "translateY(-6px)" : "translateY(0)",
//                                 borderColor: visibleIdx === i ? `${t.color}55` : undefined,
//                                 boxShadow: visibleIdx === i ? `0 20px 40px ${t.color}22` : undefined,
//                             }}
//                         >
//                             <div className="testimonial-header">
//                                 <div className="testimonial-avatar" style={{ background: t.color }}>{t.initials}</div>
//                                 <div>
//                                     <div className="testimonial-name">{t.name}</div>
//                                     <div className="testimonial-role">{t.role} · {t.org}</div>
//                                 </div>
//                             </div>
//                             <p className="testimonial-text">"{t.text}"</p>
//                             <div className="testimonial-stars">★★★★★</div>
//                         </div>
//                     ))}
//                 </div>
//                 {/* Dot indicators */}
//                 <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
//                     {shown.map((_, i) => (
//                         <button
//                             key={i}
//                             onClick={() => setVisibleIdx(i)}
//                             style={{
//                                 width: visibleIdx === i ? "20px" : "8px",
//                                 height: "8px",
//                                 borderRadius: "999px",
//                                 border: "none",
//                                 background: visibleIdx === i ? "#00c896" : "rgba(255,255,255,0.2)",
//                                 cursor: "pointer",
//                                 transition: "all 0.3s ease",
//                                 padding: 0,
//                             }}
//                         />
//                     ))}
//                 </div>
//             </section>
//         </div>
//     );
// }

// function ImpactNetwork({ token, requireAuth, initialTab = "feed" }) {
//     const [tab, setTab] = useState(initialTab);

//     useEffect(() => {
//         setTab(initialTab);
//     }, [initialTab]);

//     return (
//         <section className="impact-network-page">
//             <div className="impact-network-top">
//                 <div className="impact-network-brand">
//                     <span className="impact-network-brand-icon" aria-hidden="true">🌐</span>
//                     <div>
//                         <h2>Impact Network</h2>
//                         <p>Social collaboration for NGOs and donors</p>
//                     </div>
//                 </div>

//                 <div className="impact-network-tabs" role="tablist" aria-label="Impact Network Views">
//                     <button
//                         type="button"
//                         role="tab"
//                         aria-selected={tab === "feed"}
//                         className={tab === "feed" ? "impact-tab active" : "impact-tab"}
//                         onClick={() => setTab("feed")}
//                     >
//                         Feed
//                     </button>
//                     <button
//                         type="button"
//                         role="tab"
//                         aria-selected={tab === "discover"}
//                         className={tab === "discover" ? "impact-tab active" : "impact-tab"}
//                         onClick={() => setTab("discover")}
//                     >
//                         Discover NGO
//                     </button>
//                 </div>
//             </div>

//             {tab === "feed" ? (
//                 <SocialNetworking
//                     token={token}
//                     requireAuth={requireAuth}
//                     onViewDiscover={() => setTab("discover")}
//                 />
//             ) : (
//                 <NetworkingDirectory token={token} requireAuth={requireAuth} />
//             )}
//         </section>
//     );
// }

// function AppShell() {
//     const [user, setUser] = useState(null);
//     const [token, setToken] = useState(null);
//     const [route, setRoute] = useState(getHashRoute());
//     const [toast, setToast] = useState(null);

//     const handleAuthenticated = (u, t) => {
//         setUser(u);
//         setToken(t);
//         setToast({ type: "success", message: `Welcome, ${u.name}.` });
//         navigate("/home");
//     };

//     const logout = () => {
//         setUser(null);
//         setToken(null);
//         setToast({ type: "info", message: "You have been logged out." });
//         navigate("/home");
//     };

//     useEffect(() => {
//         const onHashChange = () => setRoute(getHashRoute());
//         window.addEventListener("hashchange", onHashChange);
//         if (!window.location.hash) navigate("/home");
//         return () => window.removeEventListener("hashchange", onHashChange);
//     }, []);

//     const requireAuth = () => {
//         if (token) return true;
//         setToast({ type: "warning", message: "Please login to continue." });
//         navigate("/login");
//         return false;
//     };

//     const goto = (path, { requireLogin = false } = {}) => {
//         if (requireLogin && !token) {
//             setToast({ type: "warning", message: "Please login to access that page." });
//             navigate("/login");
//             return;
//         }
//         navigate(path);
//     };

//     return (
//         <div className="app-shell">
//             <Toast toast={toast} onClose={() => setToast(null)} />
//             <header className="top-bar">
//                 <div className="branding">
//                     <h1>Unified Impact Platform</h1>
//                     <p>
//                         Bridging NGOs, corporate donors, and individual allies through{" "}
//                         <strong>real-time collaboration</strong>.
//                     </p>
//                 </div>
//                 <nav className="main-nav">
//                     <button
//                         className={route === "/home" ? "nav-btn active" : "nav-btn"}
//                         onClick={() => goto("/home")}
//                     >
//                         Home
//                     </button>
//                     <button
//                         className={route === "/login" ? "nav-btn active" : "nav-btn"}
//                         onClick={() => goto("/login")}
//                     >
//                         Login
//                     </button>
//                     <button
//                         className={route === "/ngo-portal" ? "nav-btn active" : "nav-btn"}
//                         onClick={() => {
//                             if (!requireAuth()) return;
//                             if (user?.role !== "NGO") {
//                                 setToast({ type: "warning", message: "NGO Portal is only for NGO accounts." });
//                                 return;
//                             }
//                             goto("/ngo-portal", { requireLogin: true });
//                         }}
//                     >
//                         NGO Portal
//                     </button>
//                     <button
//                         className={route === "/donor-portal" ? "nav-btn active" : "nav-btn"}
//                         onClick={() => {
//                             if (!requireAuth()) return;
//                             if (user?.role === "NGO") {
//                                 setToast({ type: "warning", message: "Donor Portal is for Corporate/Individual accounts." });
//                                 return;
//                             }
//                             goto("/donor-portal", { requireLogin: true });
//                         }}
//                     >
//                         Donor Portal
//                     </button>
//                     <button
//                         className={route === "/impact-network" || route === "/networking" || route === "/social-feed" ? "nav-btn active" : "nav-btn"}
//                         onClick={() => goto("/impact-network", { requireLogin: true })}
//                     >
//                         Impact Network
//                     </button>
//                     <button
//                         className={route === "/gamification" ? "nav-btn active" : "nav-btn"}
//                         onClick={() => goto("/gamification", { requireLogin: true })}
//                     >
//                         Gamification
//                     </button>
//                     <button
//                         className={route === "/analytics" ? "nav-btn active" : "nav-btn"}
//                         onClick={() => goto("/analytics", { requireLogin: true })}
//                     >
//                         Analytics
//                     </button>
//                 </nav>
//                 {user ? (
//                     <div className="user-pill">
//                         <span>{user.name}</span>
//                         <span className="role">{user.role}</span>
//                         <button onClick={logout}>Logout</button>
//                     </div>
//                 ) : null}
//             </header>
//             <main className="page">
//                 {route === "/home" && (
//                     <Home goto={goto} token={token} />
//                 )}
//                 {route === "/login" && (
//                     <div className="login-page">
//                         {/* Left branded panel */}
//                         <div className="login-page-left">
//                             <div className="login-left-inner">
//                                 <div className="login-left-logo">
//                                     <span className="login-left-logo-icon">🌐</span>
//                                     <span className="login-left-logo-name">Unified Impact Platform</span>
//                                 </div>
//                                 <h2 className="login-left-headline">
//                                     Bridge the gap.<br/>
//                                     <span className="login-left-headline-accent">Amplify impact.</span>
//                                 </h2>
//                                 <p className="login-left-desc">
//                                     Connect NGOs, corporate donors, and individual contributors through
//                                     AI-powered matching and real-time collaboration.
//                                 </p>
//                                 <ul className="login-left-features">
//                                     <li>
//                                         <span className="login-feat-icon">⚡</span>
//                                         <div>
//                                             <strong>AI Matching Engine</strong>
//                                             <span>Fairness-aware algorithm connects you with the right partners</span>
//                                         </div>
//                                     </li>
//                                     <li>
//                                         <span className="login-feat-icon">🛡️</span>
//                                         <div>
//                                             <strong>Verified NGOs</strong>
//                                             <span>Credibility-scored organizations you can trust</span>
//                                         </div>
//                                     </li>
//                                     <li>
//                                         <span className="login-feat-icon">📊</span>
//                                         <div>
//                                             <strong>Real-time Impact</strong>
//                                             <span>Track exactly where your contributions go</span>
//                                         </div>
//                                     </li>
//                                 </ul>
//                                 {/* Decorative shapes */}
//                                 <div className="login-deco-circle login-deco-1" />
//                                 <div className="login-deco-circle login-deco-2" />
//                                 <div className="login-deco-circle login-deco-3" />
//                             </div>
//                         </div>
//                         {/* Right form panel */}
//                         <div className="login-page-right">
//                             <AuthPanel onAuthenticated={handleAuthenticated} defaultMode="login" />
//                         </div>
//                     </div>
//                 )}
//                 {route === "/ngo-portal" && user && user.role === "NGO" && (
//                     <NGOPortal user={user} token={token} />
//                 )}
//                 {route === "/donor-portal" && user && user.role !== "NGO" && (
//                     <DonorPortal user={user} token={token} />
//                 )}
//                 {route === "/impact-network" && (
//                     <ImpactNetwork token={token} requireAuth={requireAuth} initialTab="feed" />
//                 )}
//                 {route === "/networking" && (
//                     <ImpactNetwork token={token} requireAuth={requireAuth} initialTab="discover" />
//                 )}
//                 {route === "/social-feed" && (
//                     <ImpactNetwork token={token} requireAuth={requireAuth} initialTab="feed" />
//                 )}
//                 {route === "/gamification" && user && (
//                     <GamificationPanel user={user} token={token} />
//                 )}
//                 {route === "/analytics" && user && (
//                     <AnalyticsDashboard token={token} />
//                 )}
//             </main>
//             <Chatbot />
//             <footer className="footer">
//                 <span>© {new Date().getFullYear()} Unified Digital Impact Platform</span>
//             </footer>
//         </div>
//     );
// }

// ReactDOM.createRoot(document.getElementById("root")).render(<AppShell />);

const { useState, useEffect, useRef } = React;
const API_BASE = "http://127.0.0.1:5000/api";

function getSectorIcon(tag) {
    const t = (tag || "").toLowerCase();
    if (!t) return "🤝";
    if (t.includes("education") || t.includes("literacy")) return "📚";
    if (t.includes("health") || t.includes("healthcare") || t.includes("medical")) return "🏥";
    if (t.includes("food")) return "🍲";
    if (t.includes("environment") || t.includes("climate") || t.includes("conservation")) return "🌱";
    if (t.includes("women")) return "♀";
    if (t.includes("child") || t.includes("youth")) return "👧";
    if (t.includes("rural") || t.includes("community")) return "🏘";
    if (t.includes("art") || t.includes("culture") || t.includes("heritage")) return "🎨";
    if (t.includes("research") || t.includes("innovation") || t.includes("technology")) return "💡";
    return "🤝";
}

function renderSectorTags(sectorString) {
    return (sectorString || "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((tag) => (
            <span key={tag} className="pill pill-tag">
                <span className="pill-icon" aria-hidden="true">{getSectorIcon(tag)}</span>
                {tag}
            </span>
        ));
}

function getInitials(name) {
    if (!name) return "?";
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function isImageMediaUrl(url) {
    if (!url) return false;
    const u = String(url).toLowerCase();
    return (
        u.startsWith("data:image/") ||
        /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/.test(u)
    );
}

function getHashRoute() {
    const raw = window.location.hash || "#/home";
    const cleaned = raw.startsWith("#") ? raw.slice(1) : raw;
    const [path] = cleaned.split("?");
    return path.startsWith("/") ? path : `/${path}`;
}

function navigate(path) {
    window.location.hash = `#${path}`;
}

// ── FIXED: all fetch/apiRequest calls use proper () syntax ──────────────────
async function apiRequest(path, method = "GET", body, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["X-User-Id"] = token;
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
}

function LowScoreWarningModal({ warnings, onClose }) {
    if (!warnings || warnings.length === 0) return null;

    const LOW_THRESHOLD = 0.50;

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: "480px",
                    border: "1px solid rgba(251,146,60,0.35)",
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                }}
            >
                {/* Header */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid rgba(251,146,60,0.2)",
                }}>
                    <div style={{
                        width: "42px", height: "42px",
                        borderRadius: "10px",
                        background: "rgba(251,146,60,0.15)",
                        border: "1px solid rgba(251,146,60,0.35)",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "1.4rem",
                        flexShrink: 0,
                    }}>
                        ⚠️
                    </div>
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: "1rem",
                            color: "#fb923c",
                        }}>
                            Low Alignment Warning
                        </h2>
                        <p style={{
                            margin: "0.15rem 0 0",
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                        }}>
                            {warnings.length} match{warnings.length !== 1 ? "es" : ""} scored
                            below the 50% similarity threshold
                        </p>
                    </div>
                </div>

                {/* Info banner */}
                <div style={{
                    background: "rgba(251,146,60,0.08)",
                    border: "1px solid rgba(251,146,60,0.2)",
                    borderRadius: "8px",
                    padding: "0.6rem 0.85rem",
                    marginBottom: "1rem",
                    fontSize: "0.78rem",
                    color: "#94a3b8",
                    lineHeight: 1.6,
                }}>
                    <strong style={{ color: "#fb923c" }}>What does this mean?</strong>
                    <p style={{ margin: "0.25rem 0 0" }}>
                        A similarity score below <strong style={{ color: "#e2e8f0" }}>50%</strong>{" "}
                        suggests the match may not be well-aligned with your
                        stated sector, location, or mission. Consider refining your
                        search preferences for better results.
                    </p>
                </div>

                {/* Warning list */}
                <div style={{
                    maxHeight: "260px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    paddingRight: "0.25rem",
                }}>
                    {warnings.map((w, i) => {
                        const pct = Math.round((w.score || 0) * 100);
                        const barColor =
                            pct >= 40 ? "#fb923c" :
                            pct >= 25 ? "#ef4444" : "#dc2626";

                        return (
                            <div key={i} style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(251,146,60,0.15)",
                                borderRadius: "8px",
                                padding: "0.6rem 0.75rem",
                            }}>
                                {/* Entity names */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "0.4rem",
                                    gap: "0.5rem",
                                }}>
                                    <div style={{ fontSize: "0.8rem", color: "#e2e8f0", fontWeight: 600 }}>
                                        {w.right_entity || w.name || "Unknown"}
                                    </div>
                                    <span style={{
                                        background: `${barColor}20`,
                                        border: `1px solid ${barColor}50`,
                                        borderRadius: "999px",
                                        padding: "0.1rem 0.5rem",
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        color: barColor,
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                    }}>
                                        {pct}% match
                                    </span>
                                </div>

                                {/* Score bar */}
                                <div style={{
                                    height: "4px",
                                    borderRadius: "999px",
                                    background: "rgba(255,255,255,0.07)",
                                    marginBottom: "0.35rem",
                                    overflow: "hidden",
                                }}>
                                    <div style={{
                                        height: "100%",
                                        width: `${pct}%`,
                                        background: `linear-gradient(90deg, ${barColor}, ${barColor}aa)`,
                                        borderRadius: "999px",
                                        transition: "width 0.5s ease",
                                    }} />
                                </div>

                                {/* Suggestion message */}
                                <div style={{
                                    fontSize: "0.7rem",
                                    color: "#64748b",
                                    lineHeight: 1.5,
                                }}>
                                    {w.message ||
                                        `Low alignment (${pct}%). Try broadening your ` +
                                        `sector or adjusting location preferences.`
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Tips */}
                <div style={{
                    background: "rgba(56,189,248,0.06)",
                    border: "1px solid rgba(56,189,248,0.15)",
                    borderRadius: "8px",
                    padding: "0.6rem 0.85rem",
                    marginBottom: "1rem",
                    fontSize: "0.72rem",
                    color: "#94a3b8",
                }}>
                    <strong style={{ color: "#38bdf8" }}>💡 Tips to improve matches:</strong>
                    <ul style={{ margin: "0.3rem 0 0", paddingLeft: "1.1rem", lineHeight: 1.8 }}>
                        <li>Try broader sector terms (e.g. "Education" instead of "STEM literacy")</li>
                        <li>Widen location to state or country level</li>
                        <li>Add more keywords to describe your mission</li>
                        <li>Remove strict budget or scale filters</li>
                    </ul>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                    <button
                        className="ghost-btn"
                        onClick={onClose}
                        style={{ minWidth: "100px" }}
                    >
                        Dismiss
                    </button>
                    <button
                        className="primary-btn"
                        onClick={onClose}
                        style={{
                            minWidth: "140px",
                            background: "linear-gradient(135deg,#fb923c,#ef4444)",
                        }}
                    >
                        Refine Search
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── FIXED: all className={`...`} use proper JSX expression syntax ───────────
function Toast({ toast, onClose }) {
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => onClose(), 3500);
        return () => clearTimeout(t);
    }, [toast, onClose]);
    if (!toast) return null;
    return (
        <div className={`toast ${toast.type || "info"}`}>
            <span>{toast.message}</span>
            <button onClick={onClose} aria-label="Dismiss">×</button>
        </div>
    );
}

function AuthPanel({ onAuthenticated, defaultMode = "login" }) {
    const [mode, setMode] = useState("login");
    const [role, setRole] = useState("INDIVIDUAL");
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({
        name: "", email: "", password: "",
        organization_name: "", mission_statement: "", sector: "", geographic_focus: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => { setMode(defaultMode); }, [defaultMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (mode === "login") {
                const res = await apiRequest("/auth/login", "POST", {
                    email: form.email, password: form.password,
                });
                onAuthenticated(res.user, res.token);
            } else {
                const payload = {
                    name: form.name, email: form.email,
                    password: form.password, role,
                    organization_name: form.organization_name,
                };
                if (role === "NGO") {
                    payload.mission_statement = form.mission_statement;
                    payload.sector = form.sector;
                    payload.geographic_focus = form.geographic_focus;
                }
                const res = await apiRequest("/auth/register", "POST", payload);
                onAuthenticated(res.user, String(res.user.id));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const roleOptions = [
        { value: "NGO", icon: "🌍", label: "NGO" },
        { value: "CORPORATE", icon: "🏢", label: "Corporate" },
        { value: "INDIVIDUAL", icon: "❤️", label: "Individual" },
    ];

    return (
        <div className="auth-v2-card">
            <div className="auth-v2-header">
                <div className="auth-v2-header-tag">✨ Unified Impact Platform</div>
                <h2 className="auth-v2-title">
                    {mode === "login" ? "Welcome back" : "Join the movement"}
                </h2>
                <p className="auth-v2-subtitle">
                    {mode === "login"
                        ? "Sign in to continue your impact journey"
                        : "Create your account and start making a difference"}
                </p>
            </div>
            <div className="auth-v2-tabs">
                <button className={mode === "login" ? "auth-v2-tab active" : "auth-v2-tab"}
                    onClick={() => setMode("login")} type="button">Login</button>
                <button className={mode === "register" ? "auth-v2-tab active" : "auth-v2-tab"}
                    onClick={() => setMode("register")} type="button">Register</button>
            </div>
            <form className="auth-v2-form" onSubmit={handleSubmit}>
                {mode === "register" && (
                    <div className="auth-v2-role-section">
                        <div className="auth-v2-label-small">I am a...</div>
                        <div className="auth-v2-role-grid">
                            {roleOptions.map(r => (
                                <button key={r.value} type="button"
                                    className={role === r.value ? "auth-v2-role-card active" : "auth-v2-role-card"}
                                    onClick={() => setRole(r.value)}>
                                    <span className="auth-v2-role-icon">{r.icon}</span>
                                    <span className="auth-v2-role-label">{r.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {mode === "register" && (
                    <>
                        <div className="auth-v2-input-wrap">
                            <span className="auth-v2-input-icon">👤</span>
                            <input className="auth-v2-input" name="name" value={form.name}
                                onChange={handleChange} placeholder="Full name" required />
                        </div>
                        <div className="auth-v2-input-wrap">
                            <span className="auth-v2-input-icon">🏢</span>
                            <input className="auth-v2-input" name="organization_name"
                                value={form.organization_name} onChange={handleChange}
                                placeholder="Organization name (optional)" />
                        </div>
                    </>
                )}
                <div className="auth-v2-input-wrap">
                    <span className="auth-v2-input-icon">✉️</span>
                    <input className="auth-v2-input" type="email" name="email"
                        value={form.email} onChange={handleChange}
                        placeholder="Email address" required />
                </div>
                <div className="auth-v2-input-wrap">
                    <span className="auth-v2-input-icon">🔒</span>
                    <input className="auth-v2-input"
                        type={showPass ? "text" : "password"}
                        name="password" value={form.password}
                        onChange={handleChange} placeholder="Password" required />
                    <button type="button" className="auth-v2-eye-btn"
                        onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                        {showPass ? "🙈" : "👁️"}
                    </button>
                </div>
                {mode === "login" && (
                    <div className="auth-v2-forgot">
                        <button type="button" className="auth-v2-text-link">Forgot password?</button>
                    </div>
                )}
                {mode === "register" && role === "NGO" && (
                    <div className="auth-v2-ngo-extras">
                        <div className="auth-v2-section-divider"><span>NGO Details</span></div>
                        <div className="auth-v2-input-wrap">
                            <span className="auth-v2-input-icon">📋</span>
                            <textarea className="auth-v2-input auth-v2-textarea"
                                name="mission_statement" value={form.mission_statement}
                                onChange={handleChange} placeholder="Mission statement..." required />
                        </div>
                        <div className="auth-v2-input-wrap">
                            <span className="auth-v2-input-icon">🏷️</span>
                            <input className="auth-v2-input" name="sector" value={form.sector}
                                onChange={handleChange} placeholder="Sector (e.g. Education, Health)" required />
                        </div>
                        <div className="auth-v2-input-wrap">
                            <span className="auth-v2-input-icon">📍</span>
                            <input className="auth-v2-input" name="geographic_focus"
                                value={form.geographic_focus} onChange={handleChange}
                                placeholder="Geographic focus (city / region / country)" required />
                        </div>
                    </div>
                )}
                {error && <div className="auth-v2-error">{error}</div>}
                <button type="submit" className="auth-v2-submit" disabled={loading}>
                    {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
                </button>
                <p className="auth-v2-switch">
                    {mode === "login" ? (
                        <>Don't have an account?{" "}
                            <button type="button" className="auth-v2-text-link bold"
                                onClick={() => setMode("register")}>Register</button>
                        </>
                    ) : (
                        <>Already have an account?{" "}
                            <button type="button" className="auth-v2-text-link bold"
                                onClick={() => setMode("login")}>Login</button>
                        </>
                    )}
                </p>
            </form>
        </div>
    );
}

// REPLACE the existing NGOPortal function with this updated version

// function NGOPortal({ user, token }) {
//     const [profile, setProfile] = useState(null);
//     const [saving, setSaving] = useState(false);
//     const [message, setMessage] = useState(null);

//     useEffect(() => {
//         async function loadProfile() {
//             try {
//                 const res = await apiRequest("/users/me", "GET", undefined, token);
//                 setProfile(res.ngo_profile);
//             } catch (e) {
//                 console.error(e);
//             }
//         }
//         loadProfile();
//     }, [token]);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setProfile(prev => ({ ...prev, [name]: value }));
//     };

//     const handleSave = async (e) => {
//         e.preventDefault();
//         if (!profile) return;
//         setSaving(true);
//         setMessage(null);
//         try {
//             await apiRequest(
//                 `/ngos/${profile.id}`,
//                 "PUT",
//                 {
//                     mission_statement: profile.mission_statement,
//                     sector:            profile.sector,
//                     geographic_focus:  profile.geographic_focus,
//                 },
//                 token
//             );
//             setMessage("Profile updated and credibility recalculated.");
//         } catch (err) {
//             setMessage(err.message);
//         } finally {
//             setSaving(false);
//         }
//     };

//     if (!profile) return <div className="card">Loading NGO profile...</div>;

//     return (
//         <>
//             <div className="grid-2">
//                 <div className="card">
//                     <h2>NGO Profile</h2>
//                     <form className="form-grid" onSubmit={handleSave}>
//                         <label className="full-width">
//                             Mission Statement
//                             <textarea
//                                 name="mission_statement"
//                                 value={profile.mission_statement}
//                                 onChange={handleChange}
//                             />
//                         </label>
//                         <label>
//                             Sector
//                             <input
//                                 name="sector"
//                                 value={profile.sector}
//                                 onChange={handleChange}
//                             />
//                         </label>
//                         <label>
//                             Geographic Focus
//                             <input
//                                 name="geographic_focus"
//                                 value={profile.geographic_focus}
//                                 onChange={handleChange}
//                             />
//                         </label>
//                         <div className="pill-row">
//                             <span
//                                 className={`pill status-${(profile.verification_status || "").toLowerCase()}`}
//                             >
//                                 {profile.verification_status}
//                             </span>
//                             <span className="pill">
//                                 Credibility: {Number(profile.credibility_score || 0).toFixed(1)} / 100
//                             </span>
//                         </div>
//                         <button type="submit" className="primary-btn" disabled={saving}>
//                             {saving ? "Saving..." : "Save Profile"}
//                         </button>
//                         {message && <div className="info-banner">{message}</div>}
//                     </form>
//                 </div>
//                 <NGOPosts token={token} />
//             </div>

//             {/* ── NEW: Corporate Matching Panel ── */}
//             <CorporateMatchPanel user={user} token={token} />

//             <NgoDirectoryInsights token={token} />
//             <NgoCatalogDashboard token={token} />
//         </>
//     );
// }

function NGOPortal({ user, token }) {
    const [profile, setProfile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [lowScoreWarnings, setLowScoreWarnings] = useState([]);
    const [showLowScoreModal, setShowLowScoreModal] = useState(false);

    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await apiRequest("/users/me", "GET", undefined, token);
                setProfile(res.ngo_profile);
            } catch (e) {
                console.error(e);
            }
        }
        loadProfile();
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!profile) return;
        setSaving(true);
        setMessage(null);
        setLowScoreWarnings([]);
        setShowLowScoreModal(false);

        try {
            await apiRequest(
                `/ngos/${profile.id}`,
                "PUT",
                {
                    mission_statement: profile.mission_statement,
                    sector:            profile.sector,
                    geographic_focus:  profile.geographic_focus,
                },
                token
            );
            setMessage("Profile updated and credibility recalculated.");

            // ── LOW SCORE CHECK on credibility ────────────────────────────
            // Re-fetch to get updated credibility_score
            const updated = await apiRequest("/users/me", "GET", undefined, token);
            const updatedProfile = updated.ngo_profile;
            if (updatedProfile) {
                setProfile(updatedProfile);
                const credScore = Number(updatedProfile.credibility_score || 0);
                const LOW_THRESHOLD_CRED = 50; // out of 100

                if (credScore < LOW_THRESHOLD_CRED) {
                    const warnings = [{
                        right_entity: user?.organization_name || user?.name || "Your NGO",
                        score: credScore / 100,
                        message:
                            `Your NGO credibility score is ${credScore.toFixed(1)}/100, ` +
                            `which is below the 50% threshold. This may reduce your ` +
                            `visibility in AI-powered matching results. Consider ` +
                            `completing your mission statement, adding sector tags, ` +
                            `and verifying your organisation to improve your score.`,
                    }];
                    setLowScoreWarnings(warnings);
                    setShowLowScoreModal(true);
                }
            }
            // ─────────────────────────────────────────────────────────────
        } catch (err) {
            setMessage(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!profile) return <div className="card">Loading NGO profile...</div>;

    const credScore     = Number(profile.credibility_score || 0);
    const isLowCred     = credScore < 50;
    const credBarColor  = credScore >= 70
        ? "#00c896"
        : credScore >= 50
        ? "#38bdf8"
        : "#fb923c";

    return (
        <>
            {/* ── Low Score Warning Modal ── */}
            {showLowScoreModal && (
                <LowScoreWarningModal
                    warnings={lowScoreWarnings}
                    onClose={() => setShowLowScoreModal(false)}
                />
            )}

            <div className="grid-2">
                {/* ── NGO Profile Card ── */}
                <div className="card">
                    <h2>NGO Profile</h2>

                    {/* ── Low credibility inline banner ── */}
                    {isLowCred && (
                        <div style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.6rem",
                            background: "rgba(251,146,60,0.08)",
                            border: "1px solid rgba(251,146,60,0.25)",
                            borderRadius: "8px",
                            padding: "0.6rem 0.85rem",
                            marginBottom: "1rem",
                            fontSize: "0.78rem",
                            color: "#fb923c",
                            lineHeight: 1.6,
                        }}>
                            <span style={{ fontSize: "1rem", flexShrink: 0 }}>⚠️</span>
                            <div>
                                <strong>Low Credibility Score ({credScore.toFixed(1)}/100)</strong>
                                <p style={{ margin: "0.2rem 0 0", color: "#94a3b8" }}>
                                    Your score is below 50%. Complete your mission statement,
                                    add sector tags, and seek verification to improve visibility
                                    in AI matching.
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLowScoreWarnings([{
                                                right_entity:
                                                    user?.organization_name ||
                                                    user?.name || "Your NGO",
                                                score: credScore / 100,
                                                message:
                                                    `Your NGO credibility score is ` +
                                                    `${credScore.toFixed(1)}/100. ` +
                                                    `Complete your profile and get verified ` +
                                                    `to appear higher in donor recommendations.`,
                                            }]);
                                            setShowLowScoreModal(true);
                                        }}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#fb923c",
                                            cursor: "pointer",
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            padding: "0 0.25rem",
                                            textDecoration: "underline",
                                        }}
                                    >
                                        See details
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    <form className="form-grid" onSubmit={handleSave}>
                        <label className="full-width">
                            Mission Statement
                            <textarea
                                name="mission_statement"
                                value={profile.mission_statement || ""}
                                onChange={handleChange}
                            />
                        </label>
                        <label>
                            Sector
                            <input
                                name="sector"
                                value={profile.sector || ""}
                                onChange={handleChange}
                            />
                        </label>
                        <label>
                            Geographic Focus
                            <input
                                name="geographic_focus"
                                value={profile.geographic_focus || ""}
                                onChange={handleChange}
                            />
                        </label>

                        {/* ── Status + Credibility pills ── */}
                        <div className="pill-row full-width">
                            <span className={`pill status-${(profile.verification_status || "").toLowerCase()}`}>
                                {profile.verification_status}
                            </span>
                            <span
                                className="pill"
                                style={{
                                    color: credBarColor,
                                    border: `1px solid ${credBarColor}44`,
                                    background: `${credBarColor}12`,
                                }}
                            >
                                Credibility: {credScore.toFixed(1)} / 100
                                {isLowCred && " ⚠️"}
                            </span>
                        </div>

                        {/* ── Credibility progress bar ── */}
                        <div className="full-width" style={{ marginTop: "-0.25rem" }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "0.7rem",
                                color: "#64748b",
                                marginBottom: "0.3rem",
                            }}>
                                <span>Profile Credibility</span>
                                <span style={{ color: credBarColor, fontWeight: 700 }}>
                                    {credScore.toFixed(1)}%
                                </span>
                            </div>
                            <div style={{
                                height: "6px",
                                borderRadius: "999px",
                                background: "rgba(255,255,255,0.08)",
                                overflow: "hidden",
                            }}>
                                <div style={{
                                    height: "100%",
                                    width: `${Math.min(credScore, 100)}%`,
                                    background: `linear-gradient(90deg, ${credBarColor}, ${credBarColor}aa)`,
                                    borderRadius: "999px",
                                    transition: "width 0.6s ease",
                                }} />
                            </div>
                            {isLowCred && (
                                <p style={{
                                    fontSize: "0.68rem",
                                    color: "#64748b",
                                    margin: "0.3rem 0 0",
                                }}>
                                    💡 Add a detailed mission statement and sector tags to
                                    boost your score above 50%.
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Profile"}
                        </button>

                        {message && (
                            <div
                                className="info-banner"
                                style={{
                                    color: message.includes("updated")
                                        ? "#00c896"
                                        : "#fb923c",
                                }}
                            >
                                {message}
                            </div>
                        )}
                    </form>
                </div>

                {/* ── NGO Posts ── */}
                <NGOPosts token={token} />
            </div>

            {/* ── Corporate Matching Panel ── */}
            <CorporateMatchPanel user={user} token={token} />

            {/* ── NGO Directory Insights ── */}
            <NgoDirectoryInsights token={token} />

            {/* ── NGO Catalog Dashboard ── */}
            <NgoCatalogDashboard token={token} />
        </>
    );
}

function NGOPosts({ token }) {
    const [content, setContent] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [postType, setPostType] = useState("FUNDING_REQUIREMENT");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const friendlyLabel =
                postType === "GRANT_REQUEST" ? "Grant Request"
                : postType === "FUNDING_REQUIREMENT" ? "Funding Requirement"
                : "Update";
            await apiRequest("/posts", "POST", {
                content: `[${friendlyLabel}] ${content.trim()}`,
                media_url: mediaUrl || undefined,
                visibility: "PUBLIC",
            }, token);
            setContent("");
            setMediaUrl("");
            alert("Post published to the network.");
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card">
            <h2>Share Requirements & Grant Requests</h2>
            <p className="muted" style={{ marginBottom: "0.6rem" }}>
                Publish specific funding requirements, grant asks, or general impact updates.
            </p>
            <form className="form-grid" onSubmit={handleSubmit}>
                <label>
                    Post Type
                    <select value={postType} onChange={(e) => setPostType(e.target.value)}>
                        <option value="FUNDING_REQUIREMENT">Funding requirement</option>
                        <option value="GRANT_REQUEST">Grant / partnership ask</option>
                        <option value="UPDATE">General update</option>
                    </select>
                </label>
                <label className="full-width">
                    Describe your need / proposal
                    <textarea value={content} onChange={(e) => setContent(e.target.value)}
                        placeholder="Example: We are seeking a ₹5,00,000 grant..." required />
                </label>
                <label className="full-width">
                    Media URL (optional)
                    <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="Link to images, videos, or reports" />
                </label>
                <button type="submit" className="primary-btn" disabled={submitting}>
                    {submitting ? "Publishing..." : "Publish Update"}
                </button>
            </form>
        </div>
    );
}

function NgoDirectoryInsights({ token }) {
    const [ngos, setNgos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRequest("/ngos", "GET", undefined, token)
            .then(res => setNgos(res.ngos || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return (
        <div className="card" style={{ marginTop: "1.5rem", textAlign: "center", padding: "2.5rem" }}>
            <span style={{ color: "#94a3b8" }}>Loading NGO insights...</span>
        </div>
    );

    const stateCounts = {};
    const sectorCounts = {};
    ngos.forEach(ngo => {
        const geo = (ngo.geographic_focus || "Global");
        const statePart = geo.split(",")[0].trim();
        const stateKey = (statePart === "Global" || statePart === "") ? "Global" : statePart;
        stateCounts[stateKey] = (stateCounts[stateKey] || 0) + 1;
        (ngo.sector || "General").split("|").forEach(s => {
            const key = s.trim();
            if (key) sectorCounts[key] = (sectorCounts[key] || 0) + 1;
        });
    });

    const sortedStates  = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]);
    const sortedSectors = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const maxStateCount  = sortedStates[0]?.[1]  || 1;
    const maxSectorCount = sortedSectors[0]?.[1] || 1;
    const totalNGOs    = ngos.length;
    const totalStates  = sortedStates.filter(([s]) => s !== "Global").length;
    const totalSectors = Object.keys(sectorCounts).length;

    const regionColors = {
        "Karnataka": "#00c896", "Tamil Nadu": "#00c896", "Andhra Pradesh": "#00b894",
        "Telangana": "#00b894", "Kerala": "#10b981",
        "Delhi": "#0ea5e9", "Rajasthan": "#38bdf8", "Uttar Pradesh": "#38bdf8",
        "Haryana": "#7dd3fc", "Punjab": "#7dd3fc",
        "Maharashtra": "#a78bfa", "Gujarat": "#c084fc",
        "West Bengal": "#fb923c", "Odisha": "#f97316",
        "Madhya Pradesh": "#fbbf24", "Global": "#64748b",
    };
    const regionDefault = "#94a3b8";
    const sectorPalette = [
        "#00c896","#10b981","#00b894","#059669",
        "#0ea5e9","#38bdf8","#22d3ee",
        "#a78bfa","#c084fc","#e879f9",
        "#fb923c","#fbbf24",
    ];

    const StatBar = ({ label, count, max, color }) => (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.25rem" }}>
                <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{label}</span>
                <span style={{ color, fontWeight: 700 }}>{count} NGO{count !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ height: "7px", borderRadius: "999px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{
                    height: "100%",
                    width: `${Math.round((count / max) * 100)}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                    borderRadius: "999px", transition: "width 0.7s ease",
                }} />
            </div>
        </div>
    );

    return (
        <div className="card" style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "1.25rem" }}>NGO Directory Insights</h2>
                    <p className="muted" style={{ margin: "0.2rem 0 0" }}>Live distribution from the verified NGO catalog</p>
                </div>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    {[
                        { label: "Total NGOs",       value: totalNGOs,    color: "#00c896" },
                        { label: "States / Regions", value: totalStates,  color: "#38bdf8" },
                        { label: "Sectors",          value: totalSectors, color: "#a78bfa" },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: `${s.color}18`, border: `1px solid ${s.color}38`,
                            borderRadius: "12px", padding: "0.45rem 1rem",
                            textAlign: "center", minWidth: "80px",
                        }}>
                            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "0.2rem" }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2.5rem" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>📍</span>
                        <h3 style={{ margin: 0, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 700 }}>Geographic Distribution</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {sortedStates.map(([state, count], i) => (
                            <StatBar key={i} label={state} count={count} max={maxStateCount} color={regionColors[state] || regionDefault} />
                        ))}
                    </div>
                    <div style={{ marginTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                        {[
                            { label: "South India", color: "#00c896" },
                            { label: "North India", color: "#38bdf8" },
                            { label: "West India",  color: "#a78bfa" },
                            { label: "East India",  color: "#fb923c" },
                            { label: "Global",      color: "#64748b" },
                        ].map((r, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.7rem", color: "#94a3b8" }}>
                                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                                {r.label}
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>🏷️</span>
                        <h3 style={{ margin: 0, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 700 }}>Top Sectors</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {sortedSectors.map(([sector, count], i) => (
                            <StatBar key={i} label={sector} count={count} max={maxSectorCount} color={sectorPalette[i % sectorPalette.length]} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function NgoCatalogDashboard({ token }) {
    const [ngos, setNgos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sectorFilter, setSectorFilter] = useState("ALL");
    const [countryFilter, setCountryFilter] = useState("ALL");

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await apiRequest("/ngos", "GET", undefined, token);
                setNgos(res.ngos || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        load();
    }, [token]);

    const allSectors = Array.from(new Set(
        ngos.flatMap(ngo => (ngo.sector || "").split("|").map(s => s.trim()).filter(Boolean))
    )).sort();

    const allCountries = Array.from(new Set(
        ngos.map(ngo => {
            const geo = ngo.geographic_focus || "";
            const parts = geo.split(",");
            const country = parts.length > 1 ? parts[parts.length - 1] : parts[0];
            return (country || "").trim();
        }).filter(Boolean)
    )).sort();

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredNgos = ngos.filter((ngo) => {
        if (sectorFilter !== "ALL") {
            const tags = (ngo.sector || "").split("|").map(s => s.trim()).filter(Boolean);
            if (!tags.includes(sectorFilter)) return false;
        }
        if (countryFilter !== "ALL") {
            const geo = ngo.geographic_focus || "";
            const parts = geo.split(",");
            const country = (parts.length > 1 ? parts[parts.length - 1] : parts[0] || "").trim();
            if (country !== countryFilter) return false;
        }
        if (!normalizedSearch) return true;
        const haystack = `${ngo.name} ${ngo.sector} ${ngo.geographic_focus} ${ngo.description || ""}`.toLowerCase();
        return haystack.includes(normalizedSearch);
    });

    return (
        <div className="card">
            <h2>NGO Landscape Dashboard</h2>
            <p className="muted">Explore the NGO catalog used by the AI matching engine.</p>
            <div className="row-actions" style={{ margin: "0.75rem 0" }}>
                <input style={{ flex: 1, minWidth: "180px" }} value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by NGO name, sector tag, or location..." />
                {allSectors.length > 0 && (
                    <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}>
                        <option value="ALL">All sectors</option>
                        {allSectors.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                )}
                {allCountries.length > 0 && (
                    <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
                        <option value="ALL">All countries</option>
                        {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                )}
            </div>
            <p className="muted" style={{ fontSize: "0.78rem" }}>
                Showing {filteredNgos.length} of {ngos.length} NGOs
            </p>
            {loading ? <p>Loading NGO catalog...</p> : (
                <div className="results-grid">
                    {filteredNgos.map((ngo) => {
                        const geo = ngo.geographic_focus || "";
                        const parts = geo.split(",");
                        const state = (parts[0] || "").trim();
                        const country = (parts.length > 1 ? parts[parts.length - 1] : parts[0] || "").trim();
                        const tags = (ngo.sector || "").split("|").map(s => s.trim()).filter(Boolean);
                        return (
                            <div key={ngo.id} className="card subtle">
                                <h3>{ngo.name}</h3>
                                {ngo.description && (
                                    <p className="muted" style={{ marginBottom: "0.5rem" }}>{ngo.description}</p>
                                )}
                                <div className="pill-row">
                                    {tags.map(tag => <span key={tag} className="pill">{tag}</span>)}
                                </div>
                                <p style={{ marginTop: "0.5rem" }}>
                                    <strong>Location:</strong>{" "}
                                    {state && country ? `${state}, ${country}` : geo || "N/A"}
                                </p>
                                <div className="pill-row" style={{ marginTop: "0.5rem" }}>
                                    {/* FIXED: dynamic className */}
                                    <span className={`pill status-${(ngo.verification_status || "").toLowerCase()}`}>
                                        {ngo.verification_status}
                                    </span>
                                    <span className="pill">
                                        Credibility: {Number(ngo.credibility_score || 0).toFixed(1)} / 100
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {!loading && ngos.length === 0 && <p className="muted">No NGOs registered yet.</p>}
                    {!loading && ngos.length > 0 && filteredNgos.length === 0 && (
                        <p className="muted">No NGOs match your current search or filters.</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ADD THIS just above CorporateMatchPanel — it is a module-level helper, not a React component

// REPLACE the entire _buildFilteredPool function

function _buildFilteredPool(prefs) {
    const DEFAULT_POOL = [
        { name: "Infosys Foundation",    type: "corporate",  csr_focus: ["Education", "Rural Development", "Healthcare"],           location: "Bengaluru Karnataka India", budget_tier: "enterprise", preferred_scale: "regional",  description: "Education, healthcare, rural upliftment across India." },
        { name: "Wipro Foundation",      type: "corporate",  csr_focus: ["Education", "Environment", "Technology"],                  location: "Bengaluru Karnataka India", budget_tier: "enterprise", preferred_scale: "national",  description: "Primary education, ecology, sustainable development." },
        { name: "Biocon Foundation",     type: "corporate",  csr_focus: ["Healthcare", "Women Empowerment", "Education"],            location: "Bengaluru Karnataka India", budget_tier: "high",       preferred_scale: "regional",  description: "Healthcare access, women health, education." },
        { name: "Tata Trusts",           type: "corporate",  csr_focus: ["Education", "Healthcare", "Rural Development"],            location: "Mumbai Maharashtra India",  budget_tier: "enterprise", preferred_scale: "national",  description: "Health, education, water, cultural preservation." },
        { name: "Azim Premji Philanthropic Initiatives", type: "corporate", csr_focus: ["Education", "Social Justice"],              location: "Bengaluru Karnataka India", budget_tier: "enterprise", preferred_scale: "national",  description: "Systemic education reform and social equity." },
        { name: "Manipal Foundation",    type: "corporate",  csr_focus: ["Education", "Healthcare", "Research"],                     location: "Manipal Karnataka India",   budget_tier: "high",       preferred_scale: "regional",  description: "Academic excellence, healthcare, community welfare in Karnataka." },
        { name: "TVS Motor Foundation",  type: "corporate",  csr_focus: ["Education", "Skills Development", "Community Development"],location: "Mysuru Karnataka India",    budget_tier: "high",       preferred_scale: "local",     description: "Skill development and education around Mysuru." },
        { name: "Titan Company CSR",     type: "corporate",  csr_focus: ["Women Empowerment", "Education", "Community Development"], location: "Bengaluru Karnataka India", budget_tier: "high",       preferred_scale: "regional",  description: "Women empowerment and education for underprivileged." },
        { name: "Google.org India",      type: "corporate",  csr_focus: ["Technology", "Education", "Social Justice"],               location: "Bengaluru Karnataka India", budget_tier: "enterprise", preferred_scale: "national",  description: "Tech-driven education and economic opportunity." },
        { name: "Microsoft Philanthropies India", type: "corporate", csr_focus: ["Technology", "Skills Development", "Education"],   location: "Hyderabad Telangana India", budget_tier: "enterprise", preferred_scale: "national",  description: "Digital skills and cloud-powered social impact." },
        { name: "HCL Foundation",        type: "corporate",  csr_focus: ["Education", "Healthcare", "Environment"],                  location: "Noida Uttar Pradesh India", budget_tier: "enterprise", preferred_scale: "national",  description: "Education access, healthcare camps, environmental stewardship." },
        { name: "Godrej Good & Green",   type: "corporate",  csr_focus: ["Environment", "Skills Development", "Healthcare"],         location: "Mumbai Maharashtra India",  budget_tier: "high",       preferred_scale: "national",  description: "Green initiatives, employment skills, healthcare." },
        { name: "Mahindra Foundation",   type: "corporate",  csr_focus: ["Education", "Rural Development", "Women Empowerment"],     location: "Mumbai Maharashtra India",  budget_tier: "enterprise", preferred_scale: "national",  description: "Rural education, women empowerment, livelihood programs." },
        { name: "Larsen & Toubro CSR",   type: "corporate",  csr_focus: ["Education", "Healthcare", "Rural Development"],            location: "Mumbai Maharashtra India",  budget_tier: "enterprise", preferred_scale: "national",  description: "STEM education, primary healthcare, rural infrastructure." },
        { name: "HDFC Parivartan",       type: "corporate",  csr_focus: ["Education", "Rural Development", "Skills Development"],    location: "Mumbai Maharashtra India",  budget_tier: "enterprise", preferred_scale: "national",  description: "Livelihood, education, financial inclusion in rural India." },
        { name: "Bajaj Electricals CSR", type: "corporate",  csr_focus: ["Education", "Community Development", "Environment"],       location: "Mumbai Maharashtra India",  budget_tier: "medium",     preferred_scale: "regional",  description: "Community lighting, education, environmental projects." },
        { name: "Schneider Electric India Foundation", type: "corporate", csr_focus: ["Technology", "Skills Development", "Environment"], location: "Bengaluru Karnataka India", budget_tier: "high", preferred_scale: "national", description: "Energy access, digital skills, sustainable livelihoods." },
        { name: "Mphasis F1 Foundation", type: "corporate",  csr_focus: ["Education", "Technology", "Social Justice"],               location: "Bengaluru Karnataka India", budget_tier: "high",       preferred_scale: "regional",  description: "Digital inclusion, inclusive education for marginalized groups." },
        { name: "Bosch India Foundation",type: "corporate",  csr_focus: ["Skills Development", "Education", "Rural Development"],    location: "Bengaluru Karnataka India", budget_tier: "high",       preferred_scale: "regional",  description: "Vocational training, rural education, community development." },
        { name: "ABB India CSR",         type: "corporate",  csr_focus: ["Education", "Technology", "Skills Development"],           location: "Bengaluru Karnataka India", budget_tier: "high",       preferred_scale: "regional",  description: "STEM education, technical skills, youth empowerment." },
    ];

    // If no meaningful filters at all, return full pool immediately
    const hasFilter =
        (prefs.budget_tier     && prefs.budget_tier     !== "any") ||
        (prefs.preferred_scale && prefs.preferred_scale !== "any");

    if (!hasFilter) return DEFAULT_POOL;   // ← let backend AI do ALL filtering

    const BUDGET_ORDER = { enterprise: 4, high: 3, medium: 2, low: 1 };
    const minBudget  = BUDGET_ORDER[prefs.budget_tier]     || 0;
    const scaleFilter = prefs.preferred_scale === "any" ? null : prefs.preferred_scale;

    return DEFAULT_POOL.filter(corp => {
        if (minBudget > 0 && (BUDGET_ORDER[corp.budget_tier] || 0) < minBudget) return false;
        if (scaleFilter && corp.preferred_scale !== scaleFilter) return false;
        return true;
    });
}

// Add this component AFTER the NgoCatalogDashboard component and BEFORE the DonorPortal component

// function CorporateMatchPanel({ user, token }) {
//     // ── Search form state ──────────────────────────────────────────────
//     const [prefs, setPrefs] = useState({
//         sector:          "",
//         location:        "",
//         budget_tier:     "any",
//         preferred_scale: "any",
//         keywords:        "",
//     });
//     const [matches,     setMatches]     = useState([]);
//     const [loading,     setLoading]     = useState(false);
//     const [searched,    setSearched]    = useState(false);
//     const [ngoProfile,  setNgoProfile]  = useState(null);
//     const [topN,        setTopN]        = useState(8);
//     const [usedPrefs,   setUsedPrefs]   = useState(null);

//     // ── In-results filter/sort state ───────────────────────────────────
//     const [sortBy,        setSortBy]        = useState("score");
//     const [searchTerm,    setSearchTerm]    = useState("");
//     const [sectorFilter,  setSectorFilter]  = useState("ALL");
//     const [budgetFilter,  setBudgetFilter]  = useState("ALL");
//     const [selectedCorp,  setSelectedCorp]  = useState(null);
//     const [toastMsg,      setToastMsg]      = useState(null);

//     // ── Load NGO profile on mount ──────────────────────────────────────
//     useEffect(() => {
//         async function loadProfile() {
//             try {
//                 const res = await apiRequest("/users/me", "GET", undefined, token);
//                 if (res.ngo_profile) {
//                     setNgoProfile(res.ngo_profile);
//                     // Pre-fill form from profile
//                     setPrefs(prev => ({
//                         ...prev,
//                         sector:   res.ngo_profile.sector        || "",
//                         location: res.ngo_profile.geographic_focus || "",
//                     }));
//                 }
//             } catch (e) {
//                 console.error(e);
//             }
//         }
//         loadProfile();
//     }, [token]);

//     const handlePrefsChange = (e) => {
//         const { name, value } = e.target;
//         setPrefs(prev => ({ ...prev, [name]: value }));
//     };

//     // ── Main search handler ────────────────────────────────────────────
//     const handleSearch = async (e) => {
//         e.preventDefault();
//         if (!ngoProfile) {
//             setToastMsg({ type: "error", message: "NGO profile not found." });
//             return;
//         }
//         setLoading(true);
//         setSearched(false);
//         setMatches([]);
//         setSearchTerm("");
//         setSectorFilter("ALL");
//         setBudgetFilter("ALL");

//         try {
//             // Build a custom corporate pool filtered by user prefs,
//             // then pass it to the backend endpoint so the engine
//             // scores against exactly what the NGO is looking for.
//             const customPool = _buildFilteredPool(prefs);

//             const res = await apiRequest(
//                 `/ngo/${ngoProfile.id}/corporate-matches`,
//                 "POST",
//                 {
//                     top_n:          topN,
//                     corporate_pool: customPool,
//                 },
//                 token
//             );

//             setMatches(res.corporate_matches || []);
//             setUsedPrefs({ ...prefs });
//             setSearched(true);
//         } catch (err) {
//             setToastMsg({ type: "error", message: err.message });
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ── Quick-fill chips ───────────────────────────────────────────────
//     const SECTOR_CHIPS = [
//         "Education", "Healthcare", "Environment",
//         "Rural Development", "Women Empowerment",
//         "Technology", "Arts & Culture", "Food Security",
//         "Social Justice", "Skills Development",
//     ];

//     const LOCATION_CHIPS = [
//         "Mysuru Karnataka India",
//         "Bengaluru Karnataka India",
//         "Karnataka India",
//         "Mumbai Maharashtra India",
//         "India",
//     ];

//     // ── Derived filter options from results ────────────────────────────
//     const allSectors = Array.from(new Set(
//         matches.flatMap(m => (m.csr_focus || []).map(s => s.trim()).filter(Boolean))
//     )).sort();

//     const allBudgets = Array.from(new Set(
//         matches.map(m => m.budget_tier).filter(Boolean)
//     )).sort();

//     // ── Filter + sort results ──────────────────────────────────────────
//     const normalizedSearch = searchTerm.trim().toLowerCase();
//     let visible = [...matches];
//     if (normalizedSearch) {
//         visible = visible.filter(m => {
//             const hay = `${m.corporate_name} ${(m.csr_focus || []).join(" ")} ${m.location || ""}`.toLowerCase();
//             return hay.includes(normalizedSearch);
//         });
//     }
//     if (sectorFilter !== "ALL") {
//         visible = visible.filter(m =>
//             (m.csr_focus || []).some(s => s.toLowerCase() === sectorFilter.toLowerCase())
//         );
//     }
//     if (budgetFilter !== "ALL") {
//         visible = visible.filter(m => m.budget_tier === budgetFilter);
//     }
//     visible.sort((a, b) => {
//         if (sortBy === "name") {
//             return (a.corporate_name || "").localeCompare(b.corporate_name || "");
//         }
//         if (sortBy === "budget") {
//             const order = { enterprise: 4, high: 3, medium: 2, low: 1 };
//             return (order[b.budget_tier] || 0) - (order[a.budget_tier] || 0);
//         }
//         return (b.alignment_score || 0) - (a.alignment_score || 0);
//     });

//     // ── Visual helpers ─────────────────────────────────────────────────
//     const budgetColor = (tier) => ({
//         enterprise: "#00c896",
//         high:       "#38bdf8",
//         medium:     "#a78bfa",
//         low:        "#fb923c",
//     }[tier] || "#64748b");

//     const budgetLabel = (tier) => ({
//         enterprise: "💎 Enterprise",
//         high:       "🔷 High",
//         medium:     "🔹 Medium",
//         low:        "⬡ Low",
//     }[tier] || tier || "Unknown");

//     const scaleLabel = (scale) => ({
//         local:    "📍 Local",
//         regional: "🗺️ Regional",
//         national: "🇮🇳 National",
//         global:   "🌐 Global",
//     }[scale] || scale || "Any");

//     const typeIcon = (type) => {
//         if ((type || "").toLowerCase() === "corporate")  return "🏢";
//         if ((type || "").toLowerCase() === "foundation") return "🏛️";
//         return "🤝";
//     };

//     // ── Render ─────────────────────────────────────────────────────────
//     return (
//         <div className="card" style={{ marginTop: "1.5rem" }}>

//             {/* ── Page header ── */}
//             <div style={{
//                 display: "flex", alignItems: "flex-start",
//                 justifyContent: "space-between", flexWrap: "wrap",
//                 gap: "1rem", marginBottom: "1.5rem",
//             }}>
//                 <div>
//                     <h2 style={{ margin: 0 }}>Find Corporate & Foundation Partners</h2>
//                     <p className="muted" style={{ margin: "0.25rem 0 0" }}>
//                         Tell us what you're looking for — our AI engine will surface
//                         the best-aligned CSR partners for your mission.
//                     </p>
//                 </div>
//                 {ngoProfile && (
//                     <div style={{
//                         background: "rgba(0,200,150,0.08)",
//                         border: "1px solid rgba(0,200,150,0.2)",
//                         borderRadius: "10px", padding: "0.5rem 0.9rem",
//                         fontSize: "0.75rem", color: "#94a3b8",
//                         minWidth: "180px",
//                     }}>
//                         <div style={{ color: "#00c896", fontWeight: 700, marginBottom: "0.15rem" }}>
//                             Matching as
//                         </div>
//                         <div style={{ color: "#e2e8f0", fontWeight: 600 }}>
//                             {user?.organization_name || user?.name}
//                         </div>
//                         <div style={{ marginTop: "0.1rem" }}>
//                             {ngoProfile.sector} · {ngoProfile.geographic_focus}
//                         </div>
//                         <div style={{ marginTop: "0.1rem" }}>
//                             <span style={{
//                                 background: ngoProfile.verification_status === "VERIFIED"
//                                     ? "rgba(0,200,150,0.15)" : "rgba(251,146,60,0.15)",
//                                 color: ngoProfile.verification_status === "VERIFIED"
//                                     ? "#00c896" : "#fb923c",
//                                 border: `1px solid ${ngoProfile.verification_status === "VERIFIED"
//                                     ? "rgba(0,200,150,0.3)" : "rgba(251,146,60,0.3)"}`,
//                                 borderRadius: "999px", padding: "0.1rem 0.45rem",
//                                 fontSize: "0.65rem", fontWeight: 700,
//                             }}>
//                                 {ngoProfile.verification_status}
//                             </span>
//                             <span style={{ marginLeft: "0.4rem" }}>
//                                 Score: {Number(ngoProfile.credibility_score || 0).toFixed(1)}/100
//                             </span>
//                         </div>
//                     </div>
//                 )}
//             </div>

//             {/* ════════════════════════════════════════════════════════
//                 SEARCH FORM  — mirrors DonorPortal layout
//             ════════════════════════════════════════════════════════ */}
//             <div className="card subtle" style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
//                 <h3 style={{ margin: "0 0 0.1rem", fontSize: "0.95rem" }}>
//                     🔍 Search Preferences
//                 </h3>
//                 <p className="muted" style={{ margin: "0 0 1rem", fontSize: "0.78rem" }}>
//                     Your NGO profile is pre-filled — adjust to narrow or broaden your search.
//                 </p>

//                 <form className="form-grid" onSubmit={handleSearch}>

//                     {/* Row 1 — Sector + Location */}
//                     <label>
//                         Sector / Cause focus
//                         <input
//                             name="sector"
//                             value={prefs.sector}
//                             onChange={handlePrefsChange}
//                             placeholder="Education, Healthcare, Environment…"
//                         />
//                     </label>

//                     <label>
//                         Preferred location
//                         <input
//                             name="location"
//                             value={prefs.location}
//                             onChange={handlePrefsChange}
//                             placeholder="Mysuru / Karnataka / India"
//                         />
//                     </label>

//                     {/* Sector quick-chips */}
//                     <div className="full-width" style={{ marginTop: "-0.4rem" }}>
//                         <div style={{
//                             fontSize: "0.72rem", color: "#64748b",
//                             marginBottom: "0.35rem", fontWeight: 600,
//                         }}>
//                             Quick-fill sector:
//                         </div>
//                         <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
//                             {SECTOR_CHIPS.map(chip => (
//                                 <button
//                                     key={chip}
//                                     type="button"
//                                     onClick={() => setPrefs(p => ({ ...p, sector: chip }))}
//                                     style={{
//                                         fontSize: "0.68rem",
//                                         padding: "0.2rem 0.55rem",
//                                         borderRadius: "999px",
//                                         border: prefs.sector === chip
//                                             ? "1px solid rgba(0,200,150,0.5)"
//                                             : "1px solid rgba(255,255,255,0.1)",
//                                         background: prefs.sector === chip
//                                             ? "rgba(0,200,150,0.15)"
//                                             : "rgba(255,255,255,0.04)",
//                                         color: prefs.sector === chip ? "#00c896" : "#94a3b8",
//                                         cursor: "pointer",
//                                         transition: "all 0.15s",
//                                     }}
//                                 >
//                                     {getSectorIcon(chip)} {chip}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Location quick-chips */}
//                     <div className="full-width" style={{ marginTop: "-0.25rem" }}>
//                         <div style={{
//                             fontSize: "0.72rem", color: "#64748b",
//                             marginBottom: "0.35rem", fontWeight: 600,
//                         }}>
//                             Quick-fill location:
//                         </div>
//                         <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
//                             {LOCATION_CHIPS.map(chip => (
//                                 <button
//                                     key={chip}
//                                     type="button"
//                                     onClick={() => setPrefs(p => ({ ...p, location: chip }))}
//                                     style={{
//                                         fontSize: "0.68rem",
//                                         padding: "0.2rem 0.55rem",
//                                         borderRadius: "999px",
//                                         border: prefs.location === chip
//                                             ? "1px solid rgba(56,189,248,0.5)"
//                                             : "1px solid rgba(255,255,255,0.1)",
//                                         background: prefs.location === chip
//                                             ? "rgba(56,189,248,0.15)"
//                                             : "rgba(255,255,255,0.04)",
//                                         color: prefs.location === chip ? "#38bdf8" : "#94a3b8",
//                                         cursor: "pointer",
//                                         transition: "all 0.15s",
//                                     }}
//                                 >
//                                     📍 {chip}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Row 2 — Budget tier + Scale + Top N */}
//                     <label>
//                         Minimum budget tier
//                         <select
//                             name="budget_tier"
//                             value={prefs.budget_tier}
//                             onChange={handlePrefsChange}
//                         >
//                             <option value="any">Any budget</option>
//                             <option value="low">Low</option>
//                             <option value="medium">Medium</option>
//                             <option value="high">High</option>
//                             <option value="enterprise">Enterprise only</option>
//                         </select>
//                     </label>

//                     <label>
//                         Preferred partnership scale
//                         <select
//                             name="preferred_scale"
//                             value={prefs.preferred_scale}
//                             onChange={handlePrefsChange}
//                         >
//                             <option value="any">Any scale</option>
//                             <option value="local">Local</option>
//                             <option value="regional">Regional</option>
//                             <option value="national">National</option>
//                             <option value="global">Global</option>
//                         </select>
//                     </label>

//                     {/* Row 3 — Keywords + Top N */}
//                     <label>
//                         Keywords / notes
//                         <input
//                             name="keywords"
//                             value={prefs.keywords}
//                             onChange={handlePrefsChange}
//                             placeholder="e.g. girl education rural Karnataka STEM"
//                         />
//                     </label>

//                     <label>
//                         Max results
//                         <select
//                             value={topN}
//                             onChange={e => setTopN(Number(e.target.value))}
//                         >
//                             {[5, 8, 10, 15, 20].map(n => (
//                                 <option key={n} value={n}>Top {n}</option>
//                             ))}
//                         </select>
//                     </label>

//                     {/* Submit row */}
//                     <div className="full-width" style={{
//                         display: "flex", gap: "0.75rem",
//                         alignItems: "center", flexWrap: "wrap",
//                         marginTop: "0.25rem",
//                     }}>
//                         <button
//                             type="submit"
//                             className="primary-btn"
//                             disabled={loading || !ngoProfile}
//                             style={{ minWidth: "220px" }}
//                         >
//                             {loading ? "Matching…" : "🏢 Find Corporate Partners"}
//                         </button>
//                         <button
//                             type="button"
//                             className="ghost-btn"
//                             onClick={() => {
//                                 setPrefs({
//                                     sector:          ngoProfile?.sector        || "",
//                                     location:        ngoProfile?.geographic_focus || "",
//                                     budget_tier:     "any",
//                                     preferred_scale: "any",
//                                     keywords:        "",
//                                 });
//                                 setMatches([]);
//                                 setSearched(false);
//                             }}
//                         >
//                             Reset
//                         </button>
//                         {searched && usedPrefs && (
//                             <span className="muted" style={{ fontSize: "0.75rem" }}>
//                                 Matching for:
//                                 {usedPrefs.sector   && <strong style={{ color: "#e2e8f0" }}> {usedPrefs.sector}</strong>}
//                                 {usedPrefs.location && <> · <strong style={{ color: "#e2e8f0" }}>{usedPrefs.location}</strong></>}
//                                 {usedPrefs.budget_tier !== "any" && <> · <strong style={{ color: "#e2e8f0" }}>{budgetLabel(usedPrefs.budget_tier)}</strong></>}
//                                 {usedPrefs.preferred_scale !== "any" && <> · <strong style={{ color: "#e2e8f0" }}>{scaleLabel(usedPrefs.preferred_scale)}</strong></>}
//                             </span>
//                         )}
//                     </div>
//                 </form>
//             </div>

//             {/* ════════════════════════════════════════════════════════
//                 IN-RESULTS FILTERS  (shown after search)
//             ════════════════════════════════════════════════════════ */}
//             {searched && matches.length > 0 && (
//                 <>
//                     {/* Stats row */}
//                     <div style={{
//                         display: "flex", gap: "0.6rem",
//                         flexWrap: "wrap", marginBottom: "1rem",
//                     }}>
//                         {[
//                             { label: "Matched",        value: matches.length,                                                                                      color: "#00c896" },
//                             { label: "Showing",        value: visible.length,                                                                                      color: "#38bdf8" },
//                             { label: "Enterprise",     value: matches.filter(m => m.budget_tier === "enterprise").length,                                          color: "#a78bfa" },
//                             { label: "Avg alignment",  value: `${Math.round((matches.reduce((s, m) => s + (m.alignment_score || 0), 0) / matches.length) * 100)}%`, color: "#fb923c" },
//                         ].map((s, i) => (
//                             <div key={i} style={{
//                                 background: `${s.color}12`,
//                                 border: `1px solid ${s.color}30`,
//                                 borderRadius: "10px",
//                                 padding: "0.4rem 0.85rem",
//                                 textAlign: "center",
//                                 minWidth: "80px",
//                             }}>
//                                 <div style={{ fontSize: "1.2rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>
//                                     {s.value}
//                                 </div>
//                                 <div style={{ fontSize: "0.62rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "0.2rem" }}>
//                                     {s.label}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>

//                     {/* Filter + sort bar */}
//                     <div style={{
//                         display: "flex", gap: "0.6rem",
//                         flexWrap: "wrap", marginBottom: "0.85rem",
//                         alignItems: "center",
//                     }}>
//                         <input
//                             value={searchTerm}
//                             onChange={e => setSearchTerm(e.target.value)}
//                             placeholder="Search within results…"
//                             style={{ flex: 1, minWidth: "200px", padding: "0.4rem 0.65rem" }}
//                         />
//                         {allSectors.length > 0 && (
//                             <select
//                                 value={sectorFilter}
//                                 onChange={e => setSectorFilter(e.target.value)}
//                                 style={{ padding: "0.4rem 0.65rem" }}
//                             >
//                                 <option value="ALL">All CSR sectors</option>
//                                 {allSectors.map(s => (
//                                     <option key={s} value={s}>{s}</option>
//                                 ))}
//                             </select>
//                         )}
//                         {allBudgets.length > 0 && (
//                             <select
//                                 value={budgetFilter}
//                                 onChange={e => setBudgetFilter(e.target.value)}
//                                 style={{ padding: "0.4rem 0.65rem" }}
//                             >
//                                 <option value="ALL">All budgets</option>
//                                 {allBudgets.map(b => (
//                                     <option key={b} value={b}>{budgetLabel(b)}</option>
//                                 ))}
//                             </select>
//                         )}
//                         <select
//                             value={sortBy}
//                             onChange={e => setSortBy(e.target.value)}
//                             style={{ padding: "0.4rem 0.65rem" }}
//                         >
//                             <option value="score">Sort: Best match</option>
//                             <option value="budget">Sort: Budget high→low</option>
//                             <option value="name">Sort: Name A–Z</option>
//                         </select>
//                     </div>

//                     {/* Sector filter chips */}
//                     {allSectors.length > 0 && (
//                         <div style={{
//                             display: "flex", flexWrap: "wrap",
//                             gap: "0.3rem", marginBottom: "1rem",
//                         }}>
//                             <span style={{ fontSize: "0.72rem", color: "#64748b", alignSelf: "center", marginRight: "0.2rem" }}>
//                                 Filter:
//                             </span>
//                             <button
//                                 type="button"
//                                 onClick={() => setSectorFilter("ALL")}
//                                 style={{
//                                     fontSize: "0.68rem", padding: "0.2rem 0.55rem",
//                                     borderRadius: "999px", cursor: "pointer",
//                                     border: sectorFilter === "ALL"
//                                         ? "1px solid rgba(0,200,150,0.5)"
//                                         : "1px solid rgba(255,255,255,0.1)",
//                                     background: sectorFilter === "ALL"
//                                         ? "rgba(0,200,150,0.15)"
//                                         : "rgba(255,255,255,0.04)",
//                                     color: sectorFilter === "ALL" ? "#00c896" : "#94a3b8",
//                                 }}
//                             >
//                                 All
//                             </button>
//                             {allSectors.map(tag => (
//                                 <button
//                                     key={tag}
//                                     type="button"
//                                     onClick={() => setSectorFilter(tag)}
//                                     style={{
//                                         fontSize: "0.68rem", padding: "0.2rem 0.55rem",
//                                         borderRadius: "999px", cursor: "pointer",
//                                         border: sectorFilter === tag
//                                             ? "1px solid rgba(0,200,150,0.5)"
//                                             : "1px solid rgba(255,255,255,0.1)",
//                                         background: sectorFilter === tag
//                                             ? "rgba(0,200,150,0.15)"
//                                             : "rgba(255,255,255,0.04)",
//                                         color: sectorFilter === tag ? "#00c896" : "#94a3b8",
//                                     }}
//                                 >
//                                     {getSectorIcon(tag)} {tag}
//                                 </button>
//                             ))}
//                         </div>
//                     )}
//                 </>
//             )}

//             {/* ════════════════════════════════════════════════════════
//                 LOADING / EMPTY STATES
//             ════════════════════════════════════════════════════════ */}
//             {loading && (
//                 <div style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
//                     <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>🔄</div>
//                     Analysing CSR alignment across corporate partners…
//                 </div>
//             )}

//             {!loading && !searched && (
//                 <div style={{
//                     textAlign: "center", padding: "2.5rem",
//                     border: "1px dashed rgba(255,255,255,0.1)",
//                     borderRadius: "12px", color: "#64748b",
//                 }}>
//                     <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>🏢</div>
//                     <p style={{ margin: 0 }}>
//                         Fill in your preferences above and click{" "}
//                         <strong style={{ color: "#e2e8f0" }}>Find Corporate Partners</strong>.
//                     </p>
//                     <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem" }}>
//                         Your sector and location are pre-filled from your NGO profile.
//                     </p>
//                 </div>
//             )}

//             {!loading && searched && matches.length === 0 && (
//                 <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
//                     <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>😔</div>
//                     No corporate matches found. Try broadening your sector or removing the budget filter.
//                 </div>
//             )}

//             {!loading && searched && visible.length === 0 && matches.length > 0 && (
//                 <p className="muted" style={{ textAlign: "center" }}>
//                     No corporates match your current filters.{" "}
//                     <button
//                         type="button"
//                         className="link-btn"
//                         onClick={() => {
//                             setSearchTerm("");
//                             setSectorFilter("ALL");
//                             setBudgetFilter("ALL");
//                         }}
//                     >
//                         Clear filters
//                     </button>
//                 </p>
//             )}

//             {/* ════════════════════════════════════════════════════════
//                 RESULTS GRID
//             ════════════════════════════════════════════════════════ */}
//             {!loading && visible.length > 0 && (
//                 <div className="results-grid">
//                     {visible.map((corp, idx) => {
//                         const score   = Math.round((corp.alignment_score || 0) * 100);
//                         const bColor  = budgetColor(corp.budget_tier);
//                         const bd      = corp.score_breakdown || {};
//                         const sem     = Math.round((bd.semantic_similarity || 0) * 100);
//                         const sec     = Math.round((bd.sector_match        || 0) * 100);
//                         const geo     = Math.round((bd.geographic_affinity || 0) * 100);
//                         const fair    = Math.round((bd.fairness_boost      || 0) * 100);
//                         const overlap = corp.csr_sector_overlap || [];

//                         return (
//                             <div key={idx} className="card subtle" style={{ position: "relative" }}>

//                                 {/* Match % badge */}
//                                 <div style={{
//                                     position: "absolute", top: "0.75rem", right: "0.75rem",
//                                     background: score >= 70
//                                         ? "rgba(0,200,150,0.15)" : "rgba(56,189,248,0.12)",
//                                     border: `1px solid ${score >= 70
//                                         ? "rgba(0,200,150,0.35)" : "rgba(56,189,248,0.25)"}`,
//                                     borderRadius: "999px", padding: "0.15rem 0.55rem",
//                                     fontSize: "0.72rem", fontWeight: 700,
//                                     color: score >= 70 ? "#00c896" : "#38bdf8",
//                                 }}>
//                                     {score}% match
//                                 </div>

//                                 {/* Corp header */}
//                                 <div style={{
//                                     display: "flex", alignItems: "center",
//                                     gap: "0.75rem", marginBottom: "0.65rem",
//                                     paddingRight: "5.5rem",
//                                 }}>
//                                     <div style={{
//                                         width: "44px", height: "44px",
//                                         borderRadius: "10px",
//                                         background: `${bColor}18`,
//                                         border: `1px solid ${bColor}38`,
//                                         display: "flex", alignItems: "center",
//                                         justifyContent: "center",
//                                         fontSize: "1.4rem", flexShrink: 0,
//                                     }}>
//                                         {typeIcon(corp.corporate_type)}
//                                     </div>
//                                     <div>
//                                         <h3 style={{ margin: 0, fontSize: "0.92rem", color: "#e2e8f0" }}>
//                                             {corp.corporate_name}
//                                         </h3>
//                                         {corp.location && (
//                                             <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.1rem" }}>
//                                                 📍 {corp.location}
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>

//                                 {/* Budget + Scale pills */}
//                                 <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.6rem" }}>
//                                     <span style={{
//                                         fontSize: "0.7rem", fontWeight: 700,
//                                         color: bColor,
//                                         background: `${bColor}15`,
//                                         border: `1px solid ${bColor}35`,
//                                         borderRadius: "999px", padding: "0.15rem 0.55rem",
//                                     }}>
//                                         {budgetLabel(corp.budget_tier)}
//                                     </span>
//                                     {corp.preferred_scale && (
//                                         <span style={{
//                                             fontSize: "0.7rem", fontWeight: 600,
//                                             color: "#94a3b8",
//                                             background: "rgba(255,255,255,0.05)",
//                                             border: "1px solid rgba(255,255,255,0.1)",
//                                             borderRadius: "999px", padding: "0.15rem 0.55rem",
//                                         }}>
//                                             {scaleLabel(corp.preferred_scale)}
//                                         </span>
//                                     )}
//                                 </div>

//                                 {/* CSR focus tags — overlap highlighted green */}
//                                 {(corp.csr_focus || []).length > 0 && (
//                                     <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.55rem" }}>
//                                         {(corp.csr_focus || []).map(tag => {
//                                             const isMatch = overlap.includes(tag.toLowerCase());
//                                             return (
//                                                 <span key={tag} style={{
//                                                     fontSize: "0.67rem",
//                                                     background: isMatch
//                                                         ? "rgba(0,200,150,0.15)"
//                                                         : "rgba(255,255,255,0.05)",
//                                                     border: isMatch
//                                                         ? "1px solid rgba(0,200,150,0.35)"
//                                                         : "1px solid rgba(255,255,255,0.08)",
//                                                     color:  isMatch ? "#00c896" : "#94a3b8",
//                                                     borderRadius: "999px",
//                                                     padding: "0.15rem 0.5rem",
//                                                 }}>
//                                                     {isMatch ? "✓ " : ""}{tag}
//                                                 </span>
//                                             );
//                                         })}
//                                     </div>
//                                 )}

//                                 {/* Overlap note */}
//                                 {overlap.length > 0 && (
//                                     <div style={{
//                                         fontSize: "0.68rem", color: "#00c896",
//                                         background: "rgba(0,200,150,0.07)",
//                                         border: "1px solid rgba(0,200,150,0.18)",
//                                         borderRadius: "6px", padding: "0.3rem 0.55rem",
//                                         marginBottom: "0.5rem",
//                                     }}>
//                                         ✅ Sector overlap: {overlap.join(", ")}
//                                     </div>
//                                 )}

//                                 {/* Overall score bar */}
//                                 <div style={{ margin: "0.5rem 0 0.35rem" }}>
//                                     <div style={{
//                                         display: "flex", justifyContent: "space-between",
//                                         fontSize: "0.72rem", marginBottom: "0.22rem",
//                                     }}>
//                                         <span style={{ color: "#94a3b8" }}>Alignment score</span>
//                                         <span style={{ color: "#00c896", fontWeight: 700 }}>{score}%</span>
//                                     </div>
//                                     <div style={{ height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.07)" }}>
//                                         <div style={{
//                                             height: "100%", width: `${score}%`,
//                                             background: "linear-gradient(90deg,#00c896,#10b981)",
//                                             borderRadius: "999px", transition: "width 0.7s ease",
//                                         }} />
//                                     </div>
//                                 </div>

//                                 {/* Sub-score breakdown */}
//                                 <div style={{
//                                     display: "grid", gridTemplateColumns: "1fr 1fr",
//                                     gap: "0.2rem 0.65rem", fontSize: "0.68rem",
//                                     color: "#64748b", margin: "0.35rem 0 0.65rem",
//                                 }}>
//                                     <span>🧠 Semantic: <strong style={{ color: "#94a3b8" }}>{sem}%</strong></span>
//                                     <span>🏷️ Sector: <strong style={{ color: "#94a3b8" }}>{sec}%</strong></span>
//                                     <span>📍 Geo: <strong style={{ color: "#94a3b8" }}>{geo}%</strong></span>
//                                     <span>🌱 Fairness: <strong style={{ color: "#94a3b8" }}>{fair}%</strong></span>
//                                 </div>

//                                 {/* Action buttons */}
//                                 <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
//                                     <button
//                                         className="primary-btn"
//                                         style={{ flex: 1, fontSize: "0.78rem" }}
//                                         onClick={() => setSelectedCorp(corp)}
//                                     >
//                                         View Details
//                                     </button>
//                                     <button
//                                         className="secondary-btn"
//                                         style={{ flex: 1, fontSize: "0.78rem" }}
//                                         onClick={() => {
//                                             const subject = encodeURIComponent(
//                                                 `CSR Partnership Inquiry — ${user?.organization_name || "Our NGO"}`
//                                             );
//                                             const body = encodeURIComponent(
//                                                 `Dear ${corp.corporate_name} CSR Team,\n\n` +
//                                                 `We are ${user?.organization_name || "an NGO"} working in ` +
//                                                 `${ngoProfile?.sector || "social impact"} focused on ` +
//                                                 `${ngoProfile?.geographic_focus || "India"}.\n\n` +
//                                                 `Our AI engine scored our CSR alignment at ${score}%.\n\n` +
//                                                 `Matching sectors: ${overlap.join(", ") || "General"}\n\n` +
//                                                 `We would love to explore a partnership.\n\nBest regards,\n${user?.name}`
//                                             );
//                                             window.open(`mailto:?subject=${subject}&body=${body}`);
//                                         }}
//                                     >
//                                         📧 Draft Outreach
//                                     </button>
//                                 </div>
//                             </div>
//                         );
//                     })}
//                 </div>
//             )}

//             {/* ════════════════════════════════════════════════════════
//                 DETAIL MODAL
//             ════════════════════════════════════════════════════════ */}
//             {selectedCorp && (
//                 <div className="modal-backdrop" onClick={() => setSelectedCorp(null)}>
//                     <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
//                         <div style={{
//                             display: "flex", justifyContent: "space-between",
//                             alignItems: "flex-start", marginBottom: "1rem",
//                         }}>
//                             <div>
//                                 <h2 style={{ margin: 0 }}>{selectedCorp.corporate_name}</h2>
//                                 <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.8rem" }}>
//                                     📍 {selectedCorp.location}
//                                 </p>
//                             </div>
//                             <div style={{
//                                 background: "rgba(0,200,150,0.15)",
//                                 border: "1px solid rgba(0,200,150,0.3)",
//                                 borderRadius: "999px", padding: "0.25rem 0.75rem",
//                                 color: "#00c896", fontWeight: 700, fontSize: "0.85rem",
//                             }}>
//                                 {Math.round((selectedCorp.alignment_score || 0) * 100)}% match
//                             </div>
//                         </div>

//                         {/* Info grid */}
//                         <div style={{
//                             display: "grid", gridTemplateColumns: "1fr 1fr",
//                             gap: "0.65rem", marginBottom: "1rem",
//                         }}>
//                             {[
//                                 { label: "Budget Tier",     value: budgetLabel(selectedCorp.budget_tier) },
//                                 { label: "Preferred Scale", value: scaleLabel(selectedCorp.preferred_scale) },
//                                 { label: "Type",            value: selectedCorp.corporate_type || "Corporate" },
//                                 { label: "Sector Overlap",  value: `${(selectedCorp.csr_sector_overlap || []).length} sectors` },
//                             ].map((item, i) => (
//                                 <div key={i} style={{
//                                     background: "rgba(255,255,255,0.04)",
//                                     border: "1px solid rgba(255,255,255,0.08)",
//                                     borderRadius: "8px", padding: "0.5rem 0.75rem",
//                                 }}>
//                                     <div style={{ fontSize: "0.63rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
//                                         {item.label}
//                                     </div>
//                                     <div style={{ fontSize: "0.82rem", color: "#e2e8f0", fontWeight: 600, marginTop: "0.15rem" }}>
//                                         {item.value}
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>

//                         {/* CSR focus */}
//                         <div style={{ marginBottom: "1rem" }}>
//                             <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.4rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
//                                 CSR Focus Areas
//                             </div>
//                             <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
//                                 {(selectedCorp.csr_focus || []).map(tag => {
//                                     const isOverlap = (selectedCorp.csr_sector_overlap || []).includes(tag.toLowerCase());
//                                     return (
//                                         <span key={tag} style={{
//                                             fontSize: "0.72rem",
//                                             background: isOverlap ? "rgba(0,200,150,0.15)" : "rgba(255,255,255,0.05)",
//                                             border: isOverlap ? "1px solid rgba(0,200,150,0.35)" : "1px solid rgba(255,255,255,0.1)",
//                                             color: isOverlap ? "#00c896" : "#94a3b8",
//                                             borderRadius: "999px", padding: "0.2rem 0.6rem",
//                                         }}>
//                                             {isOverlap ? "✅ " : ""}{tag}
//                                         </span>
//                                     );
//                                 })}
//                             </div>
//                         </div>

//                         {/* Score breakdown bars */}
//                         <div style={{ marginBottom: "1rem" }}>
//                             <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.4rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
//                                 Score Breakdown
//                             </div>
//                             {Object.entries(selectedCorp.score_breakdown || {}).map(([key, val]) => {
//                                 if (typeof val !== "number") return null;
//                                 const pct = Math.round(val * 100);
//                                 const labelMap = {
//                                     semantic_similarity: "🧠 Semantic Similarity",
//                                     sector_match:        "🏷️ Sector Match",
//                                     geographic_affinity: "📍 Geographic Affinity",
//                                     fairness_boost:      "🌱 Fairness Boost",
//                                     credibility:         "🛡️ Credibility",
//                                 };
//                                 return (
//                                     <div key={key} style={{ marginBottom: "0.4rem" }}>
//                                         <div style={{
//                                             display: "flex", justifyContent: "space-between",
//                                             fontSize: "0.72rem", marginBottom: "0.15rem",
//                                         }}>
//                                             <span style={{ color: "#94a3b8" }}>{labelMap[key] || key}</span>
//                                             <span style={{ color: "#00c896", fontWeight: 700 }}>{pct}%</span>
//                                         </div>
//                                         <div style={{ height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.07)" }}>
//                                             <div style={{
//                                                 height: "100%", width: `${pct}%`,
//                                                 background: "linear-gradient(90deg,#00c896,#10b981)",
//                                                 borderRadius: "999px",
//                                             }} />
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>

//                         {/* Why this match */}
//                         {(selectedCorp.csr_sector_overlap || []).length > 0 && (
//                             <div style={{
//                                 background: "rgba(0,200,150,0.07)",
//                                 border: "1px solid rgba(0,200,150,0.2)",
//                                 borderRadius: "8px", padding: "0.65rem 0.85rem",
//                                 marginBottom: "1rem", fontSize: "0.78rem", color: "#94a3b8",
//                             }}>
//                                 <strong style={{ color: "#00c896" }}>Why this match?</strong>
//                                 <p style={{ margin: "0.3rem 0 0", lineHeight: 1.6 }}>
//                                     Your NGO's focus on{" "}
//                                     <strong style={{ color: "#e2e8f0" }}>{ngoProfile?.sector}</strong>{" "}
//                                     aligns with {selectedCorp.corporate_name}'s CSR mandate in{" "}
//                                     <strong style={{ color: "#e2e8f0" }}>
//                                         {selectedCorp.csr_sector_overlap.join(", ")}
//                                     </strong>.
//                                     {(selectedCorp.preferred_scale === "regional" || selectedCorp.preferred_scale === "local")
//                                         ? ` They prefer ${selectedCorp.preferred_scale} partnerships — well suited to your geographic focus.`
//                                         : " They fund at national scale, which can broaden your reach."}
//                                 </p>
//                             </div>
//                         )}

//                         <div className="row-actions">
//                             <button
//                                 className="primary-btn"
//                                 onClick={() => {
//                                     const subject = encodeURIComponent(
//                                         `CSR Partnership Inquiry — ${user?.organization_name || "Our NGO"}`
//                                     );
//                                     const body = encodeURIComponent(
//                                         `Dear ${selectedCorp.corporate_name} CSR Team,\n\n` +
//                                         `We are ${user?.organization_name || "an NGO"} working in ` +
//                                         `${ngoProfile?.sector || "social impact"} focused on ` +
//                                         `${ngoProfile?.geographic_focus || "India"}.\n\n` +
//                                         `Our AI engine scored our CSR alignment at ` +
//                                         `${Math.round((selectedCorp.alignment_score || 0) * 100)}%.\n\n` +
//                                         `Matching sectors: ${(selectedCorp.csr_sector_overlap || []).join(", ") || "General"}\n\n` +
//                                         `We would love to explore a potential partnership.\n\nBest regards,\n${user?.name}`
//                                     );
//                                     window.open(`mailto:?subject=${subject}&body=${body}`);
//                                 }}
//                             >
//                                 📧 Draft Outreach Email
//                             </button>
//                             <button className="ghost-btn" onClick={() => setSelectedCorp(null)}>
//                                 Close
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Toast */}
//             {toastMsg && (
//                 <div style={{
//                     position: "fixed", bottom: "1.5rem", right: "1.5rem",
//                     background: toastMsg.type === "error"
//                         ? "rgba(239,68,68,0.9)" : "rgba(0,200,150,0.9)",
//                     color: "#fff", borderRadius: "10px",
//                     padding: "0.65rem 1.1rem", fontSize: "0.82rem",
//                     zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
//                     display: "flex", gap: "0.75rem", alignItems: "center",
//                 }}>
//                     <span>{toastMsg.message}</span>
//                     <button
//                         onClick={() => setToastMsg(null)}
//                         style={{
//                             background: "none", border: "none",
//                             color: "#fff", cursor: "pointer",
//                             fontSize: "1rem", padding: 0,
//                         }}
//                     >×</button>
//                 </div>
//             )}
//         </div>
//     );
// }

function CorporateMatchPanel({ user, token }) {
    const [prefs, setPrefs] = useState({
        sector:          "",
        location:        "",
        budget_tier:     "any",
        preferred_scale: "any",
        keywords:        "",
    });
    const [matches,          setMatches]          = useState([]);
    const [loading,          setLoading]          = useState(false);
    const [searched,         setSearched]         = useState(false);
    const [ngoProfile,       setNgoProfile]       = useState(null);
    const [topN,             setTopN]             = useState(8);
    const [usedPrefs,        setUsedPrefs]        = useState(null);
    const [sortBy,           setSortBy]           = useState("score");
    const [searchTerm,       setSearchTerm]       = useState("");
    const [sectorFilter,     setSectorFilter]     = useState("ALL");
    const [budgetFilter,     setBudgetFilter]     = useState("ALL");
    const [selectedCorp,     setSelectedCorp]     = useState(null);
    const [toastMsg,         setToastMsg]         = useState(null);

    // ── NEW: low score popup state ─────────────────────────────────────────
    const [lowScoreWarnings,  setLowScoreWarnings]  = useState([]);
    const [showLowScoreModal, setShowLowScoreModal] = useState(false);

    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await apiRequest("/users/me", "GET", undefined, token);
                if (res.ngo_profile) {
                    setNgoProfile(res.ngo_profile);
                    setPrefs(prev => ({
                        ...prev,
                        sector:   res.ngo_profile.sector           || "",
                        location: res.ngo_profile.geographic_focus || "",
                    }));
                }
            } catch (e) {
                console.error(e);
            }
        }
        loadProfile();
    }, [token]);

    const handlePrefsChange = (e) => {
        const { name, value } = e.target;
        setPrefs(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!ngoProfile) {
            setToastMsg({ type: "error", message: "NGO profile not found." });
            return;
        }

        setLoading(true);
        setSearched(false);
        setMatches([]);
        setSearchTerm("");
        setSectorFilter("ALL");
        setBudgetFilter("ALL");

        // ── reset popup state on each new search ──────────────────────────
        setLowScoreWarnings([]);
        setShowLowScoreModal(false);

        try {
            const customPool = _buildFilteredPool(prefs);
            const res = await apiRequest(
                `/ngo/${ngoProfile.id}/corporate-matches`,
                "POST",
                {
                    top_n:          topN,
                    corporate_pool: customPool,
                },
                token
            );

            const fetchedMatches = res.corporate_matches || [];
            setMatches(fetchedMatches);
            setUsedPrefs({ ...prefs });
            setSearched(true);

            // ── LOW SCORE CHECK ──────────────────────────────────────────
            const LOW_THRESHOLD = 0.50;

            const lowMatches = fetchedMatches.filter(
                m => Number(m.alignment_score || 0) < LOW_THRESHOLD
            );

            const allLow  = lowMatches.length === fetchedMatches.length && fetchedMatches.length > 0;
            const mostLow = fetchedMatches.length > 0 &&
                (lowMatches.length / fetchedMatches.length) > 0.6;

            console.log(
                `[LowScore] total=${fetchedMatches.length} ` +
                `low=${lowMatches.length} ` +
                `allLow=${allLow} mostLow=${mostLow}`
            );

            if (allLow || mostLow) {
                const warnings = lowMatches.map(m => ({
                    right_entity: m.corporate_name,
                    score:        Number(m.alignment_score || 0),
                    message:
                        `Low CSR alignment ` +
                        `(${Math.round((m.alignment_score || 0) * 100)}%) ` +
                        `with "${m.corporate_name}". Their focus areas may not ` +
                        `closely match your NGO's sector or geography.`,
                }));
                setLowScoreWarnings(warnings);
                setShowLowScoreModal(true);
            }
            // ─────────────────────────────────────────────────────────────

        } catch (err) {
            setToastMsg({ type: "error", message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const SECTOR_CHIPS = [
        "Education", "Healthcare", "Environment",
        "Rural Development", "Women Empowerment",
        "Technology", "Arts & Culture", "Food Security",
        "Social Justice", "Skills Development",
    ];

    const LOCATION_CHIPS = [
        "Mysuru Karnataka India",
        "Bengaluru Karnataka India",
        "Karnataka India",
        "Mumbai Maharashtra India",
        "India",
    ];

    const allSectors = Array.from(new Set(
        matches.flatMap(m => (m.csr_focus || []).map(s => s.trim()).filter(Boolean))
    )).sort();

    const allBudgets = Array.from(new Set(
        matches.map(m => m.budget_tier).filter(Boolean)
    )).sort();

    const normalizedSearch = searchTerm.trim().toLowerCase();
    let visible = [...matches];

    if (normalizedSearch) {
        visible = visible.filter(m => {
            const hay = `${m.corporate_name} ${(m.csr_focus || []).join(" ")} ${m.location || ""}`.toLowerCase();
            return hay.includes(normalizedSearch);
        });
    }
    if (sectorFilter !== "ALL") {
        visible = visible.filter(m =>
            (m.csr_focus || []).some(s => s.toLowerCase() === sectorFilter.toLowerCase())
        );
    }
    if (budgetFilter !== "ALL") {
        visible = visible.filter(m => m.budget_tier === budgetFilter);
    }

    visible.sort((a, b) => {
        if (sortBy === "name")   return (a.corporate_name || "").localeCompare(b.corporate_name || "");
        if (sortBy === "budget") {
            const order = { enterprise: 4, high: 3, medium: 2, low: 1 };
            return (order[b.budget_tier] || 0) - (order[a.budget_tier] || 0);
        }
        return (b.alignment_score || 0) - (a.alignment_score || 0);
    });

    const budgetColor = (tier) => ({
        enterprise: "#00c896",
        high:       "#38bdf8",
        medium:     "#a78bfa",
        low:        "#fb923c",
    }[tier] || "#64748b");

    const budgetLabel = (tier) => ({
        enterprise: "💎 Enterprise",
        high:       "🔷 High",
        medium:     "🔹 Medium",
        low:        "⬡ Low",
    }[tier] || tier || "Unknown");

    const scaleLabel = (scale) => ({
        local:    "📍 Local",
        regional: "🗺️ Regional",
        national: "🇮🇳 National",
        global:   "🌐 Global",
    }[scale] || scale || "Any");

    const typeIcon = (type) => {
        if ((type || "").toLowerCase() === "corporate")  return "🏢";
        if ((type || "").toLowerCase() === "foundation") return "🏛️";
        return "🤝";
    };

    return (
        <div className="card" style={{ marginTop: "1.5rem" }}>

            {/* ══ LOW SCORE POPUP MODAL ══════════════════════════════════════ */}
            {showLowScoreModal && (
                <div
                    className="modal-backdrop"
                    onClick={() => setShowLowScoreModal(false)}
                    style={{ zIndex: 1200 }}
                >
                    <div
                        className="modal"
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: "480px",
                            border: "1px solid rgba(251,146,60,0.4)",
                            background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            marginBottom: "1rem",
                            paddingBottom: "0.75rem",
                            borderBottom: "1px solid rgba(251,146,60,0.2)",
                        }}>
                            <div style={{
                                width: "44px", height: "44px",
                                borderRadius: "10px",
                                background: "rgba(251,146,60,0.15)",
                                border: "1px solid rgba(251,146,60,0.4)",
                                display: "flex", alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.5rem", flexShrink: 0,
                            }}>
                                ⚠️
                            </div>
                            <div>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: "1.05rem",
                                    color: "#fb923c",
                                }}>
                                    Low Alignment Warning
                                </h2>
                                <p style={{
                                    margin: "0.15rem 0 0",
                                    fontSize: "0.75rem",
                                    color: "#94a3b8",
                                }}>
                                    {lowScoreWarnings.length} match
                                    {lowScoreWarnings.length !== 1 ? "es" : ""} scored
                                    below the 50% threshold
                                </p>
                            </div>
                            {/* Close X */}
                            <button
                                onClick={() => setShowLowScoreModal(false)}
                                style={{
                                    marginLeft: "auto",
                                    background: "none",
                                    border: "none",
                                    color: "#64748b",
                                    fontSize: "1.2rem",
                                    cursor: "pointer",
                                    lineHeight: 1,
                                    padding: "0.2rem",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* What does this mean */}
                        <div style={{
                            background: "rgba(251,146,60,0.07)",
                            border: "1px solid rgba(251,146,60,0.18)",
                            borderRadius: "8px",
                            padding: "0.65rem 0.9rem",
                            marginBottom: "1rem",
                            fontSize: "0.78rem",
                            color: "#94a3b8",
                            lineHeight: 1.65,
                        }}>
                            <strong style={{ color: "#fb923c" }}>What does this mean?</strong>
                            <p style={{ margin: "0.25rem 0 0" }}>
                                A CSR alignment score below{" "}
                                <strong style={{ color: "#e2e8f0" }}>50%</strong> means
                                the corporate partner's focus areas don't closely match
                                your NGO's sector or geography. Results are still shown
                                but may need outreach customisation.
                            </p>
                        </div>

                        {/* Individual warning rows */}
                        <div style={{
                            maxHeight: "220px",
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.45rem",
                            marginBottom: "1rem",
                        }}>
                            {lowScoreWarnings.map((w, i) => {
                                const pct = Math.round((w.score || 0) * 100);
                                const col = pct >= 40 ? "#fb923c"
                                          : pct >= 25 ? "#ef4444"
                                          : "#dc2626";
                                return (
                                    <div key={i} style={{
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(251,146,60,0.13)",
                                        borderRadius: "8px",
                                        padding: "0.55rem 0.75rem",
                                    }}>
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "0.35rem",
                                            gap: "0.5rem",
                                        }}>
                                            <span style={{
                                                fontSize: "0.8rem",
                                                color: "#e2e8f0",
                                                fontWeight: 600,
                                            }}>
                                                {w.right_entity || "Unknown"}
                                            </span>
                                            <span style={{
                                                background: `${col}22`,
                                                border: `1px solid ${col}55`,
                                                borderRadius: "999px",
                                                padding: "0.1rem 0.5rem",
                                                fontSize: "0.7rem",
                                                fontWeight: 700,
                                                color: col,
                                                whiteSpace: "nowrap",
                                                flexShrink: 0,
                                            }}>
                                                {pct}%
                                            </span>
                                        </div>

                                        {/* Mini score bar */}
                                        <div style={{
                                            height: "4px",
                                            borderRadius: "999px",
                                            background: "rgba(255,255,255,0.07)",
                                            overflow: "hidden",
                                            marginBottom: "0.3rem",
                                        }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${pct}%`,
                                                background:
                                                    `linear-gradient(90deg,${col},${col}88)`,
                                                borderRadius: "999px",
                                                transition: "width 0.5s ease",
                                            }} />
                                        </div>

                                        <div style={{
                                            fontSize: "0.69rem",
                                            color: "#64748b",
                                            lineHeight: 1.5,
                                        }}>
                                            {w.message}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Tips */}
                        <div style={{
                            background: "rgba(56,189,248,0.06)",
                            border: "1px solid rgba(56,189,248,0.15)",
                            borderRadius: "8px",
                            padding: "0.6rem 0.85rem",
                            marginBottom: "1.1rem",
                            fontSize: "0.72rem",
                            color: "#94a3b8",
                        }}>
                            <strong style={{ color: "#38bdf8" }}>
                                💡 Tips to improve alignment:
                            </strong>
                            <ul style={{
                                margin: "0.3rem 0 0",
                                paddingLeft: "1.1rem",
                                lineHeight: 1.85,
                            }}>
                                <li>Broaden your sector — e.g. "Education" not "Girl STEM literacy"</li>
                                <li>Change location to "India" to widen the corporate pool</li>
                                <li>Remove the budget tier filter to include more partners</li>
                                <li>Set preferred scale to "Any" to see all matching corporates</li>
                            </ul>
                        </div>

                        {/* Buttons */}
                        <div style={{
                            display: "flex",
                            gap: "0.75rem",
                            justifyContent: "flex-end",
                        }}>
                            <button
                                className="ghost-btn"
                                onClick={() => setShowLowScoreModal(false)}
                            >
                                Dismiss
                            </button>
                            <button
                                className="primary-btn"
                                onClick={() => setShowLowScoreModal(false)}
                                style={{
                                    background:
                                        "linear-gradient(135deg,#fb923c,#ef4444)",
                                    minWidth: "130px",
                                }}
                            >
                                Refine Search
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Page header ───────────────────────────────────────────────── */}
            <div style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1.5rem",
            }}>
                <div>
                    <h2 style={{ margin: 0 }}>Find Corporate & Foundation Partners</h2>
                    <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                        Tell us what you're looking for — our AI engine will surface
                        the best-aligned CSR partners for your mission.
                    </p>
                </div>
                {ngoProfile && (
                    <div style={{
                        background: "rgba(0,200,150,0.08)",
                        border: "1px solid rgba(0,200,150,0.2)",
                        borderRadius: "10px",
                        padding: "0.5rem 0.9rem",
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                        minWidth: "180px",
                    }}>
                        <div style={{ color: "#00c896", fontWeight: 700, marginBottom: "0.15rem" }}>
                            Matching as
                        </div>
                        <div style={{ color: "#e2e8f0", fontWeight: 600 }}>
                            {user?.organization_name || user?.name}
                        </div>
                        <div style={{ marginTop: "0.1rem" }}>
                            {ngoProfile.sector} · {ngoProfile.geographic_focus}
                        </div>
                        <div style={{ marginTop: "0.1rem" }}>
                            <span style={{
                                background: ngoProfile.verification_status === "VERIFIED"
                                    ? "rgba(0,200,150,0.15)" : "rgba(251,146,60,0.15)",
                                color: ngoProfile.verification_status === "VERIFIED"
                                    ? "#00c896" : "#fb923c",
                                border: `1px solid ${ngoProfile.verification_status === "VERIFIED"
                                    ? "rgba(0,200,150,0.3)" : "rgba(251,146,60,0.3)"}`,
                                borderRadius: "999px",
                                padding: "0.1rem 0.45rem",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                            }}>
                                {ngoProfile.verification_status}
                            </span>
                            <span style={{ marginLeft: "0.4rem" }}>
                                Score: {Number(ngoProfile.credibility_score || 0).toFixed(1)}/100
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Search form ───────────────────────────────────────────────── */}
            <div className="card subtle" style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
                <h3 style={{ margin: "0 0 0.1rem", fontSize: "0.95rem" }}>
                    🔍 Search Preferences
                </h3>
                <p className="muted" style={{ margin: "0 0 1rem", fontSize: "0.78rem" }}>
                    Your NGO profile is pre-filled — adjust to narrow or broaden your search.
                </p>
                <form className="form-grid" onSubmit={handleSearch}>
                    <label>
                        Sector / Cause focus
                        <input
                            name="sector"
                            value={prefs.sector}
                            onChange={handlePrefsChange}
                            placeholder="Education, Healthcare, Environment…"
                        />
                    </label>
                    <label>
                        Preferred location
                        <input
                            name="location"
                            value={prefs.location}
                            onChange={handlePrefsChange}
                            placeholder="Mysuru / Karnataka / India"
                        />
                    </label>

                    {/* Sector quick-chips */}
                    <div className="full-width" style={{ marginTop: "-0.4rem" }}>
                        <div style={{
                            fontSize: "0.72rem", color: "#64748b",
                            marginBottom: "0.35rem", fontWeight: 600,
                        }}>
                            Quick-fill sector:
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                            {SECTOR_CHIPS.map(chip => (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => setPrefs(p => ({ ...p, sector: chip }))}
                                    style={{
                                        fontSize: "0.68rem",
                                        padding: "0.2rem 0.55rem",
                                        borderRadius: "999px",
                                        border: prefs.sector === chip
                                            ? "1px solid rgba(0,200,150,0.5)"
                                            : "1px solid rgba(255,255,255,0.1)",
                                        background: prefs.sector === chip
                                            ? "rgba(0,200,150,0.15)"
                                            : "rgba(255,255,255,0.04)",
                                        color: prefs.sector === chip ? "#00c896" : "#94a3b8",
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {getSectorIcon(chip)} {chip}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location quick-chips */}
                    <div className="full-width" style={{ marginTop: "-0.25rem" }}>
                        <div style={{
                            fontSize: "0.72rem", color: "#64748b",
                            marginBottom: "0.35rem", fontWeight: 600,
                        }}>
                            Quick-fill location:
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                            {LOCATION_CHIPS.map(chip => (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => setPrefs(p => ({ ...p, location: chip }))}
                                    style={{
                                        fontSize: "0.68rem",
                                        padding: "0.2rem 0.55rem",
                                        borderRadius: "999px",
                                        border: prefs.location === chip
                                            ? "1px solid rgba(56,189,248,0.5)"
                                            : "1px solid rgba(255,255,255,0.1)",
                                        background: prefs.location === chip
                                            ? "rgba(56,189,248,0.15)"
                                            : "rgba(255,255,255,0.04)",
                                        color: prefs.location === chip ? "#38bdf8" : "#94a3b8",
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    📍 {chip}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label>
                        Minimum budget tier
                        <select
                            name="budget_tier"
                            value={prefs.budget_tier}
                            onChange={handlePrefsChange}
                        >
                            <option value="any">Any budget</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="enterprise">Enterprise only</option>
                        </select>
                    </label>
                    <label>
                        Preferred partnership scale
                        <select
                            name="preferred_scale"
                            value={prefs.preferred_scale}
                            onChange={handlePrefsChange}
                        >
                            <option value="any">Any scale</option>
                            <option value="local">Local</option>
                            <option value="regional">Regional</option>
                            <option value="national">National</option>
                            <option value="global">Global</option>
                        </select>
                    </label>
                    <label>
                        Keywords / notes
                        <input
                            name="keywords"
                            value={prefs.keywords}
                            onChange={handlePrefsChange}
                            placeholder="e.g. girl education rural Karnataka STEM"
                        />
                    </label>
                    <label>
                        Max results
                        <select
                            value={topN}
                            onChange={e => setTopN(Number(e.target.value))}
                        >
                            {[5, 8, 10, 15, 20].map(n => (
                                <option key={n} value={n}>Top {n}</option>
                            ))}
                        </select>
                    </label>

                    <div className="full-width" style={{
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginTop: "0.25rem",
                    }}>
                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={loading || !ngoProfile}
                            style={{ minWidth: "220px" }}
                        >
                            {loading ? "Matching…" : "🏢 Find Corporate Partners"}
                        </button>
                        <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => {
                                setPrefs({
                                    sector:          ngoProfile?.sector           || "",
                                    location:        ngoProfile?.geographic_focus || "",
                                    budget_tier:     "any",
                                    preferred_scale: "any",
                                    keywords:        "",
                                });
                                setMatches([]);
                                setSearched(false);
                                setLowScoreWarnings([]);
                                setShowLowScoreModal(false);
                            }}
                        >
                            Reset
                        </button>
                        {searched && usedPrefs && (
                            <span className="muted" style={{ fontSize: "0.75rem" }}>
                                Matching for:
                                {usedPrefs.sector && (
                                    <strong style={{ color: "#e2e8f0" }}>
                                        {" "}{usedPrefs.sector}
                                    </strong>
                                )}
                                {usedPrefs.location && (
                                    <> · <strong style={{ color: "#e2e8f0" }}>
                                        {usedPrefs.location}
                                    </strong></>
                                )}
                            </span>
                        )}
                    </div>
                </form>
            </div>

            {/* ── Low score inline reminder banner (after modal dismissed) ── */}
            {searched && !showLowScoreModal && lowScoreWarnings.length > 0 && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    background: "rgba(251,146,60,0.08)",
                    border: "1px solid rgba(251,146,60,0.25)",
                    borderRadius: "8px",
                    padding: "0.55rem 0.9rem",
                    marginBottom: "1rem",
                    fontSize: "0.78rem",
                    color: "#fb923c",
                    flexWrap: "wrap",
                }}>
                    <span>
                        ⚠️ {lowScoreWarnings.length} result
                        {lowScoreWarnings.length !== 1 ? "s" : ""} scored below the
                        50% similarity threshold — matches may be loosely aligned.
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowLowScoreModal(true)}
                        style={{
                            background: "rgba(251,146,60,0.15)",
                            border: "1px solid rgba(251,146,60,0.35)",
                            borderRadius: "6px",
                            color: "#fb923c",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.65rem",
                            cursor: "pointer",
                        }}
                    >
                        View Details
                    </button>
                </div>
            )}

            {/* ── Stats + filter bar (shown after search) ───────────────────── */}
            {searched && matches.length > 0 && (
                <>
                    <div style={{
                        display: "flex",
                        gap: "0.6rem",
                        flexWrap: "wrap",
                        marginBottom: "1rem",
                    }}>
                        {[
                            { label: "Matched",       value: matches.length,                                                                                       color: "#00c896" },
                            { label: "Showing",       value: visible.length,                                                                                       color: "#38bdf8" },
                            { label: "Enterprise",    value: matches.filter(m => m.budget_tier === "enterprise").length,                                           color: "#a78bfa" },
                            { label: "Avg alignment", value: `${Math.round((matches.reduce((s, m) => s + (m.alignment_score || 0), 0) / matches.length) * 100)}%`, color: "#fb923c" },
                            // ── NEW stat: how many are below threshold ──
                            {
                                label: "Below 50%",
                                value: matches.filter(m => Number(m.alignment_score || 0) < 0.50).length,
                                color: "#ef4444",
                            },
                        ].map((s, i) => (
                            <div key={i} style={{
                                background: `${s.color}12`,
                                border: `1px solid ${s.color}30`,
                                borderRadius: "10px",
                                padding: "0.4rem 0.85rem",
                                textAlign: "center",
                                minWidth: "75px",
                            }}>
                                <div style={{
                                    fontSize: "1.2rem",
                                    fontWeight: 800,
                                    color: s.color,
                                    lineHeight: 1,
                                }}>
                                    {s.value}
                                </div>
                                <div style={{
                                    fontSize: "0.62rem",
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginTop: "0.2rem",
                                }}>
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        display: "flex",
                        gap: "0.6rem",
                        flexWrap: "wrap",
                        marginBottom: "0.85rem",
                        alignItems: "center",
                    }}>
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search within results…"
                            style={{ flex: 1, minWidth: "200px", padding: "0.4rem 0.65rem" }}
                        />
                        {allSectors.length > 0 && (
                            <select
                                value={sectorFilter}
                                onChange={e => setSectorFilter(e.target.value)}
                                style={{ padding: "0.4rem 0.65rem" }}
                            >
                                <option value="ALL">All CSR sectors</option>
                                {allSectors.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        )}
                        {allBudgets.length > 0 && (
                            <select
                                value={budgetFilter}
                                onChange={e => setBudgetFilter(e.target.value)}
                                style={{ padding: "0.4rem 0.65rem" }}
                            >
                                <option value="ALL">All budgets</option>
                                {allBudgets.map(b => (
                                    <option key={b} value={b}>{budgetLabel(b)}</option>
                                ))}
                            </select>
                        )}
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            style={{ padding: "0.4rem 0.65rem" }}
                        >
                            <option value="score">Sort: Best match</option>
                            <option value="budget">Sort: Budget high→low</option>
                            <option value="name">Sort: Name A–Z</option>
                        </select>
                    </div>
                </>
            )}

            {/* ── Loading / empty states ─────────────────────────────────────── */}
            {loading && (
                <div style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                    <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>🔄</div>
                    Analysing CSR alignment across corporate partners…
                </div>
            )}
            {!loading && !searched && (
                <div style={{
                    textAlign: "center",
                    padding: "2.5rem",
                    border: "1px dashed rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#64748b",
                }}>
                    <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>🏢</div>
                    <p style={{ margin: 0 }}>
                        Fill in your preferences above and click{" "}
                        <strong style={{ color: "#e2e8f0" }}>Find Corporate Partners</strong>.
                    </p>
                    <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem" }}>
                        Your sector and location are pre-filled from your NGO profile.
                    </p>
                </div>
            )}
            {!loading && searched && matches.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>😔</div>
                    No corporate matches found. Try broadening your sector or
                    removing the budget filter.
                </div>
            )}
            {!loading && searched && visible.length === 0 && matches.length > 0 && (
                <p className="muted" style={{ textAlign: "center" }}>
                    No corporates match your current filters.{" "}
                    <button
                        type="button"
                        className="link-btn"
                        onClick={() => {
                            setSearchTerm("");
                            setSectorFilter("ALL");
                            setBudgetFilter("ALL");
                        }}
                    >
                        Clear filters
                    </button>
                </p>
            )}

            {/* ── Results grid ──────────────────────────────────────────────── */}
            {!loading && visible.length > 0 && (
                <div className="results-grid">
                    {visible.map((corp, idx) => {
                        const score   = Math.round((corp.alignment_score || 0) * 100);
                        const bColor  = budgetColor(corp.budget_tier);
                        const bd      = corp.score_breakdown || {};
                        const sem     = Math.round((bd.semantic_similarity || 0) * 100);
                        const sec     = Math.round((bd.sector_match        || 0) * 100);
                        const geo     = Math.round((bd.geographic_affinity || 0) * 100);
                        const fair    = Math.round((bd.fairness_boost      || 0) * 100);
                        const overlap = corp.csr_sector_overlap || [];

                        // ── is this card below threshold? ──────────────────
                        const isLow   = score < 50;

                        return (
                            <div
                                key={idx}
                                className="card subtle"
                                style={{
                                    position: "relative",
                                    // orange tint border for low-score cards
                                    border: isLow
                                        ? "1px solid rgba(251,146,60,0.3)"
                                        : undefined,
                                }}
                            >
                                {/* ── Low score inline badge on card ── */}
                                {isLow && (
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.35rem",
                                        background: "rgba(251,146,60,0.09)",
                                        border: "1px solid rgba(251,146,60,0.22)",
                                        borderRadius: "6px",
                                        padding: "0.25rem 0.55rem",
                                        marginBottom: "0.55rem",
                                        fontSize: "0.68rem",
                                        color: "#fb923c",
                                    }}>
                                        ⚠️ Below 50% threshold — loosely aligned
                                    </div>
                                )}

                                {/* Match % badge */}
                                <div style={{
                                    position: "absolute",
                                    top: isLow ? "2.5rem" : "0.75rem",
                                    right: "0.75rem",
                                    background: score >= 50
                                        ? "rgba(0,200,150,0.15)"
                                        : "rgba(251,146,60,0.15)",
                                    border: `1px solid ${score >= 50
                                        ? "rgba(0,200,150,0.35)"
                                        : "rgba(251,146,60,0.35)"}`,
                                    borderRadius: "999px",
                                    padding: "0.15rem 0.55rem",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    color: score >= 50 ? "#00c896" : "#fb923c",
                                }}>
                                    {score}% match
                                </div>

                                {/* Corp header */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    marginBottom: "0.65rem",
                                    paddingRight: "5.5rem",
                                }}>
                                    <div style={{
                                        width: "44px", height: "44px",
                                        borderRadius: "10px",
                                        background: `${bColor}18`,
                                        border: `1px solid ${bColor}38`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.4rem",
                                        flexShrink: 0,
                                    }}>
                                        {typeIcon(corp.corporate_type)}
                                    </div>
                                    <div>
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: "0.92rem",
                                            color: "#e2e8f0",
                                        }}>
                                            {corp.corporate_name}
                                        </h3>
                                        {corp.location && (
                                            <div style={{
                                                fontSize: "0.72rem",
                                                color: "#64748b",
                                                marginTop: "0.1rem",
                                            }}>
                                                📍 {corp.location}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Budget + Scale pills */}
                                <div style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.4rem",
                                    marginBottom: "0.6rem",
                                }}>
                                    <span style={{
                                        fontSize: "0.7rem", fontWeight: 700,
                                        color: bColor,
                                        background: `${bColor}15`,
                                        border: `1px solid ${bColor}35`,
                                        borderRadius: "999px",
                                        padding: "0.15rem 0.55rem",
                                    }}>
                                        {budgetLabel(corp.budget_tier)}
                                    </span>
                                    {corp.preferred_scale && (
                                        <span style={{
                                            fontSize: "0.7rem", fontWeight: 600,
                                            color: "#94a3b8",
                                            background: "rgba(255,255,255,0.05)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "999px",
                                            padding: "0.15rem 0.55rem",
                                        }}>
                                            {scaleLabel(corp.preferred_scale)}
                                        </span>
                                    )}
                                </div>

                                {/* CSR focus tags */}
                                {(corp.csr_focus || []).length > 0 && (
                                    <div style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "0.3rem",
                                        marginBottom: "0.55rem",
                                    }}>
                                        {(corp.csr_focus || []).map(tag => {
                                            const isMatch = overlap.includes(tag.toLowerCase());
                                            return (
                                                <span key={tag} style={{
                                                    fontSize: "0.67rem",
                                                    background: isMatch
                                                        ? "rgba(0,200,150,0.15)"
                                                        : "rgba(255,255,255,0.05)",
                                                    border: isMatch
                                                        ? "1px solid rgba(0,200,150,0.35)"
                                                        : "1px solid rgba(255,255,255,0.08)",
                                                    color: isMatch ? "#00c896" : "#94a3b8",
                                                    borderRadius: "999px",
                                                    padding: "0.15rem 0.5rem",
                                                }}>
                                                    {isMatch ? "✓ " : ""}{tag}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Overlap note */}
                                {overlap.length > 0 && (
                                    <div style={{
                                        fontSize: "0.68rem",
                                        color: "#00c896",
                                        background: "rgba(0,200,150,0.07)",
                                        border: "1px solid rgba(0,200,150,0.18)",
                                        borderRadius: "6px",
                                        padding: "0.3rem 0.55rem",
                                        marginBottom: "0.5rem",
                                    }}>
                                        ✅ Sector overlap: {overlap.join(", ")}
                                    </div>
                                )}

                                {/* Overall score bar */}
                                <div style={{ margin: "0.5rem 0 0.35rem" }}>
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "0.72rem",
                                        marginBottom: "0.22rem",
                                    }}>
                                        <span style={{ color: "#94a3b8" }}>
                                            Alignment score
                                        </span>
                                        <span style={{
                                            color: isLow ? "#fb923c" : "#00c896",
                                            fontWeight: 700,
                                        }}>
                                            {score}%
                                        </span>
                                    </div>
                                    <div style={{
                                        height: "5px",
                                        borderRadius: "999px",
                                        background: "rgba(255,255,255,0.07)",
                                    }}>
                                        <div style={{
                                            height: "100%",
                                            width: `${score}%`,
                                            background: isLow
                                                ? "linear-gradient(90deg,#fb923c,#ef4444)"
                                                : "linear-gradient(90deg,#00c896,#10b981)",
                                            borderRadius: "999px",
                                            transition: "width 0.7s ease",
                                        }} />
                                    </div>
                                </div>

                                {/* Sub-score breakdown */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "0.2rem 0.65rem",
                                    fontSize: "0.68rem",
                                    color: "#64748b",
                                    margin: "0.35rem 0 0.65rem",
                                }}>
                                    <span>🧠 Semantic: <strong style={{ color: "#94a3b8" }}>{sem}%</strong></span>
                                    <span>🏷️ Sector: <strong style={{ color: "#94a3b8" }}>{sec}%</strong></span>
                                    <span>📍 Geo: <strong style={{ color: "#94a3b8" }}>{geo}%</strong></span>
                                    <span>🌱 Fairness: <strong style={{ color: "#94a3b8" }}>{fair}%</strong></span>
                                </div>

                                {/* Action buttons */}
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                    <button
                                        className="primary-btn"
                                        style={{ flex: 1, fontSize: "0.78rem" }}
                                        onClick={() => setSelectedCorp(corp)}
                                    >
                                        View Details
                                    </button>
                                    <button
                                        className="secondary-btn"
                                        style={{ flex: 1, fontSize: "0.78rem" }}
                                        onClick={() => {
                                            const subject = encodeURIComponent(
                                                `CSR Partnership Inquiry — ${user?.organization_name || "Our NGO"}`
                                            );
                                            const body = encodeURIComponent(
                                                `Dear ${corp.corporate_name} CSR Team,\n\n` +
                                                `We are ${user?.organization_name || "an NGO"} working in ` +
                                                `${ngoProfile?.sector || "social impact"} focused on ` +
                                                `${ngoProfile?.geographic_focus || "India"}.\n\n` +
                                                `Our AI engine scored our CSR alignment at ${score}%.\n\n` +
                                                `Matching sectors: ${overlap.join(", ") || "General"}\n\n` +
                                                `We would love to explore a partnership.\n\nBest regards,\n${user?.name}`
                                            );
                                            window.open(`mailto:?subject=${subject}&body=${body}`);
                                        }}
                                    >
                                        📧 Draft Outreach
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Detail Modal ───────────────────────────────────────────────── */}
            {selectedCorp && (
                <div className="modal-backdrop" onClick={() => setSelectedCorp(null)}>
                    <div
                        className="modal"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: "500px" }}
                    >
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "1rem",
                        }}>
                            <div>
                                <h2 style={{ margin: 0 }}>{selectedCorp.corporate_name}</h2>
                                <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.8rem" }}>
                                    📍 {selectedCorp.location}
                                </p>
                            </div>
                            <div style={{
                                background: "rgba(0,200,150,0.15)",
                                border: "1px solid rgba(0,200,150,0.3)",
                                borderRadius: "999px",
                                padding: "0.25rem 0.75rem",
                                color: "#00c896",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                            }}>
                                {Math.round((selectedCorp.alignment_score || 0) * 100)}% match
                            </div>
                        </div>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.65rem",
                            marginBottom: "1rem",
                        }}>
                            {[
                                { label: "Budget Tier",     value: budgetLabel(selectedCorp.budget_tier) },
                                { label: "Preferred Scale", value: scaleLabel(selectedCorp.preferred_scale) },
                                { label: "Type",            value: selectedCorp.corporate_type || "Corporate" },
                                { label: "Sector Overlap",  value: `${(selectedCorp.csr_sector_overlap || []).length} sectors` },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "8px",
                                    padding: "0.5rem 0.75rem",
                                }}>
                                    <div style={{
                                        fontSize: "0.63rem",
                                        color: "#64748b",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                    }}>
                                        {item.label}
                                    </div>
                                    <div style={{
                                        fontSize: "0.82rem",
                                        color: "#e2e8f0",
                                        fontWeight: 600,
                                        marginTop: "0.15rem",
                                    }}>
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <div style={{
                                fontSize: "0.72rem",
                                color: "#64748b",
                                marginBottom: "0.4rem",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}>
                                CSR Focus Areas
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                                {(selectedCorp.csr_focus || []).map(tag => {
                                    const isOverlap = (selectedCorp.csr_sector_overlap || [])
                                        .includes(tag.toLowerCase());
                                    return (
                                        <span key={tag} style={{
                                            fontSize: "0.72rem",
                                            background: isOverlap
                                                ? "rgba(0,200,150,0.15)"
                                                : "rgba(255,255,255,0.05)",
                                            border: isOverlap
                                                ? "1px solid rgba(0,200,150,0.35)"
                                                : "1px solid rgba(255,255,255,0.1)",
                                            color: isOverlap ? "#00c896" : "#94a3b8",
                                            borderRadius: "999px",
                                            padding: "0.2rem 0.6rem",
                                        }}>
                                            {isOverlap ? "✅ " : ""}{tag}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <div style={{
                                fontSize: "0.72rem",
                                color: "#64748b",
                                marginBottom: "0.4rem",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}>
                                Score Breakdown
                            </div>
                            {Object.entries(selectedCorp.score_breakdown || {}).map(([key, val]) => {
                                if (typeof val !== "number") return null;
                                const pct = Math.round(val * 100);
                                const labelMap = {
                                    semantic_similarity: "🧠 Semantic Similarity",
                                    sector_match:        "🏷️ Sector Match",
                                    geographic_affinity: "📍 Geographic Affinity",
                                    fairness_boost:      "🌱 Fairness Boost",
                                    credibility:         "🛡️ Credibility",
                                };
                                return (
                                    <div key={key} style={{ marginBottom: "0.4rem" }}>
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "0.72rem",
                                            marginBottom: "0.15rem",
                                        }}>
                                            <span style={{ color: "#94a3b8" }}>
                                                {labelMap[key] || key}
                                            </span>
                                            <span style={{ color: "#00c896", fontWeight: 700 }}>
                                                {pct}%
                                            </span>
                                        </div>
                                        <div style={{
                                            height: "4px",
                                            borderRadius: "999px",
                                            background: "rgba(255,255,255,0.07)",
                                        }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${pct}%`,
                                                background: "linear-gradient(90deg,#00c896,#10b981)",
                                                borderRadius: "999px",
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {(selectedCorp.csr_sector_overlap || []).length > 0 && (
                            <div style={{
                                background: "rgba(0,200,150,0.07)",
                                border: "1px solid rgba(0,200,150,0.2)",
                                borderRadius: "8px",
                                padding: "0.65rem 0.85rem",
                                marginBottom: "1rem",
                                fontSize: "0.78rem",
                                color: "#94a3b8",
                            }}>
                                <strong style={{ color: "#00c896" }}>Why this match?</strong>
                                <p style={{ margin: "0.3rem 0 0", lineHeight: 1.6 }}>
                                    Your NGO's focus on{" "}
                                    <strong style={{ color: "#e2e8f0" }}>
                                        {ngoProfile?.sector}
                                    </strong>{" "}
                                    aligns with {selectedCorp.corporate_name}'s CSR mandate in{" "}
                                    <strong style={{ color: "#e2e8f0" }}>
                                        {selectedCorp.csr_sector_overlap.join(", ")}
                                    </strong>.
                                    {(selectedCorp.preferred_scale === "regional" ||
                                      selectedCorp.preferred_scale === "local")
                                        ? ` They prefer ${selectedCorp.preferred_scale} partnerships — well suited to your geographic focus.`
                                        : " They fund at national scale, which can broaden your reach."
                                    }
                                </p>
                            </div>
                        )}

                        <div className="row-actions">
                            <button
                                className="primary-btn"
                                onClick={() => {
                                    const subject = encodeURIComponent(
                                        `CSR Partnership Inquiry — ${user?.organization_name || "Our NGO"}`
                                    );
                                    const body = encodeURIComponent(
                                        `Dear ${selectedCorp.corporate_name} CSR Team,\n\n` +
                                        `We are ${user?.organization_name || "an NGO"} working in ` +
                                        `${ngoProfile?.sector || "social impact"} focused on ` +
                                        `${ngoProfile?.geographic_focus || "India"}.\n\n` +
                                        `Our AI engine scored our CSR alignment at ` +
                                        `${Math.round((selectedCorp.alignment_score || 0) * 100)}%.\n\n` +
                                        `Matching sectors: ${(selectedCorp.csr_sector_overlap || []).join(", ") || "General"}\n\n` +
                                        `We would love to explore a potential partnership.\n\nBest regards,\n${user?.name}`
                                    );
                                    window.open(`mailto:?subject=${subject}&body=${body}`);
                                }}
                            >
                                📧 Draft Outreach Email
                            </button>
                            <button
                                className="ghost-btn"
                                onClick={() => setSelectedCorp(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast ─────────────────────────────────────────────────────── */}
            {toastMsg && (
                <div style={{
                    position: "fixed",
                    bottom: "1.5rem",
                    right: "1.5rem",
                    background: toastMsg.type === "error"
                        ? "rgba(239,68,68,0.9)"
                        : "rgba(0,200,150,0.9)",
                    color: "#fff",
                    borderRadius: "10px",
                    padding: "0.65rem 1.1rem",
                    fontSize: "0.82rem",
                    zIndex: 9999,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "center",
                }}>
                    <span>{toastMsg.message}</span>
                    <button
                        onClick={() => setToastMsg(null)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "1rem",
                            padding: 0,
                        }}
                    >×</button>
                </div>
            )}
        </div>
    );
}

// function DonorPortal({ user, token }) {
//     const [prefs, setPrefs] = useState({ cause: "", location: "", sector: "", interests: "" });
//     const [results, setResults] = useState([]);
//     const [history, setHistory] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [donatingNgo, setDonatingNgo] = useState(null);
//     const [donationForm, setDonationForm] = useState({ amount: "", currency: "INR", description: "" });
//     const [searchTerm, setSearchTerm] = useState("");
//     const [sortBy, setSortBy] = useState("score");
//     const [usedFallback, setUsedFallback] = useState(false);
//     const [sectorChipFilter, setSectorChipFilter] = useState("");

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setPrefs((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleMatch = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setUsedFallback(false);
//         try {
//             const payload = {
//                 sector: prefs.sector || prefs.cause,
//                 cause: prefs.cause,
//                 interests: prefs.interests || prefs.cause,
//                 location: prefs.location,
//                 keywords: prefs.cause,
//                 top_n: 12,
//             };
//             const res = await apiRequest("/recommendations", "POST", payload, token);
//             const recs = res.recommendations || [];
//             if (recs.length > 0) {
//                 setResults(recs);
//             } else {
//                 const ngoRes = await apiRequest("/ngos", "GET", undefined, token);
//                 const mapped = (ngoRes.ngos || []).map((n, idx) => ({
//                     name: n.name, sector_tags: n.sector,
//                     geographic_focus: n.geographic_focus,
//                     description: n.description,
//                     state: n.geographic_focus, country: "India",
//                     score: 0.5 - idx * 0.005,
//                     score_breakdown: {
//                         semantic_similarity: 0.5, sector_match: 0.5,
//                         geographic_affinity: 0.5, fairness_boost: 0.5, credibility: 0.7,
//                     },
//                     recognition_tier: "mid_tier", db_enriched: true, ngo_db_id: n.id,
//                 }));
//                 setResults(mapped);
//                 setUsedFallback(true);
//             }
//         } catch (err) {
//             alert(err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         async function loadHistory() {
//             try {
//                 const res = await apiRequest("/transactions/mine", "GET", undefined, token);
//                 setHistory(res.transactions || []);
//             } catch (e) { console.error(e); }
//         }
//         loadHistory();
//     }, [token]);

//     const openDonate = async (ngo) => {
//         let ngoDbId = ngo.ngo_db_id;
//         if (!ngoDbId) {
//             try {
//                 const res = await apiRequest("/ngos", "GET", undefined, token);
//                 const match = (res.ngos || []).find(n => n.name === ngo.name);
//                 ngoDbId = match?.id;
//             } catch (_) {}
//         }
//         setDonatingNgo({ ...ngo, ngo_db_id: ngoDbId });
//         setDonationForm({ amount: "", currency: "INR", description: "" });
//     };

//     const submitDonation = async (e) => {
//         e.preventDefault();
//         if (!donatingNgo) return;
//         const amount = Number(donationForm.amount);
//         if (!Number.isFinite(amount) || amount <= 0) { alert("Please enter a valid amount."); return; }
//         if (!donatingNgo.ngo_db_id) { alert("Could not resolve NGO database ID."); return; }
//         try {
//             await apiRequest("/transactions", "POST", {
//                 ngo_id: donatingNgo.ngo_db_id, amount,
//                 currency: donationForm.currency,
//                 description: donationForm.description || undefined,
//             }, token);
//             setDonatingNgo(null);
//             const res = await apiRequest("/transactions/mine", "GET", undefined, token);
//             setHistory(res.transactions || []);
//             alert("Donation recorded successfully.");
//         } catch (e2) { alert(e2.message); }
//     };

//     const normalizedSearch = searchTerm.trim().toLowerCase();
//     const sectorTagsAvailable = Array.from(new Set(
//         results.flatMap(ngo =>
//             (ngo.sector_tags || ngo.sector || "").split("|").map(s => s.trim()).filter(Boolean)
//         )
//     )).sort();

//     let visibleResults = [...results];
//     if (normalizedSearch) {
//         visibleResults = visibleResults.filter(ngo => {
//             const haystack = `${ngo.name} ${ngo.sector_tags || ""} ${ngo.state || ""} ${ngo.country || ""} ${ngo.description || ""}`.toLowerCase();
//             return haystack.includes(normalizedSearch);
//         });
//     }
//     if (sectorChipFilter) {
//         visibleResults = visibleResults.filter(ngo => {
//             const tags = (ngo.sector_tags || ngo.sector || "").split("|").map(s => s.trim());
//             return tags.includes(sectorChipFilter);
//         });
//     }
//     visibleResults.sort((a, b) => {
//         const aScore = Number(a.score || 0), bScore = Number(b.score || 0);
//         const aFairness = Number(a.score_breakdown?.fairness_boost || 0);
//         const bFairness = Number(b.score_breakdown?.fairness_boost || 0);
//         const aSem = Number(a.score_breakdown?.semantic_similarity || 0);
//         const bSem = Number(b.score_breakdown?.semantic_similarity || 0);
//         if (sortBy === "fairness") return bFairness - aFairness || bScore - aScore;
//         if (sortBy === "similarity") return bSem - aSem || bScore - aScore;
//         return bScore - aScore;
//     });

//     const tierBadge = (tier) => {
//         if (tier === "grassroots") return { label: "🌱 Grassroots", color: "#00c896" };
//         if (tier === "mid_tier")   return { label: "🔷 Established", color: "#38bdf8" };
//         return                            { label: "⭐ Well-Known",  color: "#a78bfa" };
//     };

//     return (
//         <div className="grid-2">
//             <div className="card donor-card">
//                 <h2>AI-Matched NGO Recommendations</h2>
//                 <p className="muted" style={{ marginBottom: "0.75rem" }}>
//                     Powered by SBERT semantic matching with fairness boosts for grassroots NGOs.
//                 </p>
//                 <form className="form-grid" onSubmit={handleMatch}>
//                     <label>Cause / Sector
//                         <input name="cause" value={prefs.cause} onChange={handleChange}
//                             placeholder="Education, Healthcare, Environment…" required />
//                     </label>
//                     <label>Location
//                         <input name="location" value={prefs.location} onChange={handleChange}
//                             placeholder="Mysuru / Karnataka / India" />
//                     </label>
//                     <label>Specific sector tag (optional)
//                         <input name="sector" value={prefs.sector} onChange={handleChange}
//                             placeholder="e.g. Child Welfare" />
//                     </label>
//                     <label>Keywords / interests
//                         <input name="interests" value={prefs.interests} onChange={handleChange}
//                             placeholder="e.g. school meals rural girls literacy" />
//                     </label>
//                     <button type="submit" className="primary-btn" disabled={loading}>
//                         {loading ? "Matching…" : "Find NGOs"}
//                     </button>
//                 </form>
//                 {results.length > 0 && (
//                     <p className="muted" style={{ marginTop: "0.6rem" }}>
//                         Matching for: <strong>{prefs.cause || "Any cause"}</strong>
//                         {prefs.location && <> · <strong>{prefs.location}</strong></>}
//                         {prefs.sector && <> · <strong>{prefs.sector}</strong></>}
//                     </p>
//                 )}
//                 {results.length > 0 && (
//                     <div className="row-actions" style={{ marginTop: "0.75rem" }}>
//                         <label style={{ flex: 1, minWidth: "180px" }}>
//                             <span style={{ display: "block", fontSize: "0.78rem", color: "#64748b" }}>Search within results</span>
//                             <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
//                                 placeholder="Filter by name, sector, or location…" />
//                         </label>
//                         <label>
//                             <span style={{ display: "block", fontSize: "0.78rem", color: "#64748b" }}>Sort by</span>
//                             <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
//                                 <option value="score">Overall AI score</option>
//                                 <option value="fairness">Fairness boost (grassroots first)</option>
//                                 <option value="similarity">Semantic similarity</option>
//                             </select>
//                         </label>
//                     </div>
//                 )}
//                 {results.length > 0 && sectorTagsAvailable.length > 0 && (
//                     <div className="filter-chips">
//                         <span className="filter-label">Filter by sector:</span>
//                         <button type="button"
//                             className={!sectorChipFilter ? "chip chip-active" : "chip"}
//                             onClick={() => setSectorChipFilter("")}>All</button>
//                         {sectorTagsAvailable.map(tag => (
//                             <button key={tag} type="button"
//                                 className={sectorChipFilter === tag ? "chip chip-active" : "chip"}
//                                 onClick={() => setSectorChipFilter(tag)}>
//                                 {getSectorIcon(tag)} {tag}
//                             </button>
//                         ))}
//                     </div>
//                 )}
//                 <div className="results-grid">
//                     {visibleResults.map((ngo, idx) => {
//                         const badge    = tierBadge(ngo.recognition_tier);
//                         const score    = Number(ngo.score || 0);
//                         const semantic = Number(ngo.score_breakdown?.semantic_similarity || 0);
//                         const fairness = Number(ngo.score_breakdown?.fairness_boost || 0);
//                         const geo      = Number(ngo.score_breakdown?.geographic_affinity || 0);
//                         const sector   = Number(ngo.score_breakdown?.sector_match || 0);
//                         const engine   = ngo.score_breakdown?.similarity_engine || "tfidf";
//                         const location = [ngo.state, ngo.country].filter(Boolean).join(", ") || ngo.geographic_focus || "N/A";
//                         const sectorStr = ngo.sector_tags || ngo.sector || "";
//                         return (
//                             <div key={idx} className="card subtle ngo-card">
//                                 <div className="ngo-card-header">
//                                     <div className="avatar-circle">{getInitials(ngo.name)}</div>
//                                     <div className="ngo-card-title">
//                                         <h3>{ngo.name}</h3>
//                                         <div className="pill-row">{renderSectorTags(sectorStr)}</div>
//                                     </div>
//                                 </div>
//                                 {ngo.description && (
//                                     <p className="ngo-card-description">
//                                         {ngo.description.length > 140 ? `${ngo.description.slice(0, 137)}…` : ngo.description}
//                                     </p>
//                                 )}
//                                 <div className="ngo-card-meta">
//                                     <span className="location-pill">
//                                         <span className="pill-icon" aria-hidden="true">📍</span>{location}
//                                     </span>
//                                     <span style={{
//                                         fontSize: "0.72rem", fontWeight: 700, color: badge.color,
//                                         background: `${badge.color}18`, border: `1px solid ${badge.color}44`,
//                                         borderRadius: "999px", padding: "0.2rem 0.55rem",
//                                     }}>{badge.label}</span>
//                                 </div>
//                                 <div style={{ margin: "0.65rem 0 0.4rem" }}>
//                                     <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
//                                         <span style={{ color: "#94a3b8" }}>Overall match</span>
//                                         <span style={{ color: "#00c896", fontWeight: 700 }}>{Math.round(score * 100)}%</span>
//                                     </div>
//                                     <div style={{ height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.08)" }}>
//                                         <div style={{ height: "100%", width: `${Math.round(score * 100)}%`, background: "linear-gradient(90deg,#00c896,#10b981)", borderRadius: "999px" }} />
//                                     </div>
//                                 </div>
//                                 <div className="ngo-card-metrics" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem 0.75rem", fontSize: "0.72rem" }}>
//                                     <span>🧠 Semantic: {(semantic * 100).toFixed(0)}%
//                                         <span style={{ color: "#64748b", fontSize: "0.65rem" }}> [{engine}]</span>
//                                     </span>
//                                     <span>🏷️ Sector: {(sector * 100).toFixed(0)}%</span>
//                                     <span>📍 Geo: {(geo * 100).toFixed(0)}%</span>
//                                     <span>🌱 Fairness: {(fairness * 100).toFixed(0)}%</span>
//                                 </div>
//                                 <div className="row-actions ngo-card-actions" style={{ marginTop: "0.75rem" }}>
//                                     <button className="secondary-btn" onClick={() => openDonate(ngo)}>Donate</button>
//                                 </div>
//                             </div>
//                         );
//                     })}
//                     {results.length === 0 && (
//                         <p className="muted">Enter your preferences above and click <strong>Find NGOs</strong>.</p>
//                     )}
//                     {results.length > 0 && visibleResults.length === 0 && (
//                         <p className="muted">No NGOs match your current filters. Try clearing them.</p>
//                     )}
//                     {usedFallback && results.length > 0 && (
//                         <div className="info-banner" style={{ marginTop: "0.5rem" }}>
//                             Showing all registered NGOs — AI ranking will improve as more data accumulates.
//                         </div>
//                     )}
//                 </div>
//             </div>
//             <div className="card">
//                 <h2>Your Donation History</h2>
//                 {history.length === 0 ? (
//                     <p className="muted">Your donation records will appear here after your first contribution.</p>
//                 ) : (
//                     <ul className="timeline">
//                         {history.map((tx) => (
//                             <li key={tx.id}>
//                                 <div className="timeline-title">{tx.ngo_name} — {tx.amount} {tx.currency}</div>
//                                 <div className="timeline-meta">{new Date(tx.transacted_at).toLocaleString()}</div>
//                                 {tx.description && <div className="timeline-body">{tx.description}</div>}
//                             </li>
//                         ))}
//                     </ul>
//                 )}
//             </div>
//             {donatingNgo && (
//                 <div className="modal-backdrop" onClick={() => setDonatingNgo(null)}>
//                     <div className="modal" onClick={(e) => e.stopPropagation()}>
//                         <h2>Donate to {donatingNgo.name}</h2>
//                         <form className="form-grid" onSubmit={submitDonation}>
//                             <label>Amount
//                                 <input type="number" value={donationForm.amount}
//                                     onChange={(e) => setDonationForm(p => ({ ...p, amount: e.target.value }))} required />
//                             </label>
//                             <label>Currency
//                                 <select value={donationForm.currency}
//                                     onChange={(e) => setDonationForm(p => ({ ...p, currency: e.target.value }))}>
//                                     <option value="INR">INR</option>
//                                     <option value="USD">USD</option>
//                                     <option value="EUR">EUR</option>
//                                     <option value="GBP">GBP</option>
//                                 </select>
//                             </label>
//                             <label className="full-width">Description (optional)
//                                 <input value={donationForm.description}
//                                     onChange={(e) => setDonationForm(p => ({ ...p, description: e.target.value }))}
//                                     placeholder="e.g. Education supplies for Q2" />
//                             </label>
//                             <div className="row-actions full-width">
//                                 <button type="button" className="ghost-btn" onClick={() => setDonatingNgo(null)}>Cancel</button>
//                                 <button type="submit" className="primary-btn">Confirm Donation</button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }
// ─────────────────────────────────────────────────────────────────────────────
// SOURCE ICONS (module-level constant)
// ─────────────────────────────────────────────────────────────────────────────
const SOURCE_ICONS = { "Times of India": "📰", "UNICEF": "🌐" };

// ─────────────────────────────────────────────────────────────────────────────
// CRISIS DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function CrisisDetailModal({ crisis, user, token, onClose }) {
    const [donatingNgo,  setDonatingNgo]  = useState(null);
    const [donationForm, setDonationForm] = useState({
        amount: "", currency: "INR", description: "",
    });
    const [activeTab, setActiveTab] = useState("donate");
    const [donated,   setDonated]   = useState(false);

    const urgencyConfig = {
        high:   { color: "#ef4444", label: "🔴 High Urgency"   },
        medium: { color: "#fb923c", label: "🟡 Medium Urgency" },
        low:    { color: "#38bdf8", label: "🔵 Low Urgency"    },
    };
    const ucfg = urgencyConfig[crisis.urgency] || urgencyConfig.low;

    const verificationBadge = (status) => {
        if (status === "VERIFIED") return { color: "#00c896", label: "✓ Verified" };
        if (status === "CATALOG")  return { color: "#38bdf8", label: "📚 Catalog"  };
        return                            { color: "#fb923c", label: "⏳ Pending"  };
    };

    const submitDonation = async (e) => {
        e.preventDefault();
        const amount = Number(donationForm.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        if (!donatingNgo?.id) {
            alert(
                "This NGO is from our catalog and does not yet have a " +
                "donation account on the platform. Please contact them directly."
            );
            return;
        }
        try {
            await apiRequest("/transactions", "POST", {
                ngo_id:      donatingNgo.id,
                amount,
                currency:    donationForm.currency,
                description: donationForm.description ||
                    `Crisis donation: ${crisis.title.slice(0, 60)}`,
            }, token);
            setDonatingNgo(null);
            setDonated(true);
        } catch (err) {
            alert(err.message);
        }
    };

    const formatDate = (str) => {
        if (!str) return "Unknown date";
        try { return new Date(str).toLocaleString(); } catch { return str; }
    };

    const registeredNgos = (crisis.matched_ngos || []).filter(
        n => n.source === "registered" && n.id
    );
    const allNgos = crisis.matched_ngos || [];

    return (
        <div
            className="modal-backdrop"
            onClick={onClose}
            style={{ zIndex: 1100 }}
        >
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: "640px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    padding: "1.5rem",
                }}
            >
                {/* ── Header ── */}
                <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: "1rem", gap: "1rem",
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            display: "flex", alignItems: "center",
                            gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap",
                        }}>
                            <span style={{ fontSize: "1rem" }}>
                                {SOURCE_ICONS[crisis.source] || "📡"}
                            </span>
                            <span style={{
                                fontSize: "0.68rem", color: "#64748b",
                                fontWeight: 700, textTransform: "uppercase",
                                letterSpacing: "0.06em",
                            }}>
                                {crisis.source}
                            </span>
                            <span style={{
                                background: `${ucfg.color}18`,
                                border: `1px solid ${ucfg.color}44`,
                                borderRadius: "999px",
                                padding: "0.12rem 0.55rem",
                                fontSize: "0.67rem", fontWeight: 700,
                                color: ucfg.color,
                            }}>
                                {ucfg.label}
                            </span>
                        </div>
                        <h2 style={{
                            margin: 0, fontSize: "1rem",
                            lineHeight: 1.45, color: "#f1f5f9",
                        }}>
                            {crisis.title}
                        </h2>
                        <p style={{
                            margin: "0.3rem 0 0",
                            fontSize: "0.72rem", color: "#64748b",
                        }}>
                            📍 {crisis.location}
                            {crisis.published && (
                                <span style={{ marginLeft: "0.75rem" }}>
                                    🕒 {formatDate(crisis.published)}
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none", border: "none",
                            color: "#64748b", fontSize: "1.3rem",
                            cursor: "pointer", flexShrink: 0, padding: "0.2rem",
                            lineHeight: 1,
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* ── Description ── */}
                {crisis.description && (
                    <div style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "8px", padding: "0.75rem 0.9rem",
                        marginBottom: "1rem",
                        fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.65,
                    }}>
                        {crisis.description}
                    </div>
                )}

                {/* ── Sector tags ── */}
                {(crisis.sectors || []).length > 0 && (
                    <div style={{
                        display: "flex", flexWrap: "wrap",
                        gap: "0.35rem", marginBottom: "0.85rem",
                    }}>
                        {crisis.sectors.map(s => (
                            <span key={s} style={{
                                fontSize: "0.68rem",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "999px",
                                padding: "0.15rem 0.5rem",
                                color: "#94a3b8",
                            }}>
                                {getSectorIcon(s)} {s}
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Source link ── */}
                {crisis.url && (
                    <a
                        href={crisis.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: "inline-flex", alignItems: "center",
                            gap: "0.4rem", fontSize: "0.75rem",
                            color: "#38bdf8", marginBottom: "1.25rem",
                            textDecoration: "none",
                        }}
                    >
                        🔗 Read full article on {crisis.source} →
                    </a>
                )}

                {/* ── Donation success banner ── */}
                {donated && (
                    <div style={{
                        background: "rgba(0,200,150,0.12)",
                        border: "1px solid rgba(0,200,150,0.3)",
                        borderRadius: "8px", padding: "0.75rem 1rem",
                        marginBottom: "1rem", fontSize: "0.82rem",
                        color: "#00c896", display: "flex",
                        alignItems: "center", gap: "0.5rem",
                    }}>
                        ✅ Donation recorded successfully — thank you for your support!
                    </div>
                )}

                {/* ── Tab switcher ── */}
                <div style={{
                    display: "flex", gap: "0.3rem",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "10px", padding: "0.3rem",
                    marginBottom: "1.1rem",
                }}>
                    {[
                        {
                            key:   "donate",
                            label: "💰 Donate",
                            count: registeredNgos.length,
                        },
                        {
                            key:   "collaborate",
                            label: "🤝 All NGOs",
                            count: allNgos.length,
                        },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1, padding: "0.5rem 0.75rem",
                                borderRadius: "8px", border: "none",
                                fontSize: "0.78rem", fontWeight: 600,
                                cursor: "pointer", transition: "all 0.2s",
                                background: activeTab === tab.key
                                    ? "rgba(0,200,150,0.18)"
                                    : "transparent",
                                color: activeTab === tab.key
                                    ? "#00c896" : "#64748b",
                            }}
                        >
                            {tab.label}
                            <span style={{
                                marginLeft: "0.4rem",
                                background: activeTab === tab.key
                                    ? "rgba(0,200,150,0.2)"
                                    : "rgba(255,255,255,0.07)",
                                borderRadius: "999px",
                                padding: "0.05rem 0.4rem",
                                fontSize: "0.65rem",
                                color: activeTab === tab.key
                                    ? "#00c896" : "#475569",
                            }}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ════════════════════════════════════════
                    DONATE TAB
                ════════════════════════════════════════ */}
                {activeTab === "donate" && (
                    <div>
                        {registeredNgos.length === 0 ? (
                            <div style={{
                                textAlign: "center", padding: "2rem 1.5rem",
                                border: "1px dashed rgba(255,255,255,0.1)",
                                borderRadius: "10px", color: "#64748b",
                            }}>
                                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                                    💳
                                </div>
                                <p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem" }}>
                                    No registered platform NGOs matched for this crisis yet.
                                </p>
                                <p style={{ margin: 0, fontSize: "0.72rem" }}>
                                    Switch to <strong style={{ color: "#e2e8f0" }}>
                                        All NGOs
                                    </strong> to see catalog entries.
                                </p>
                            </div>
                        ) : (
                            <div style={{
                                display: "flex", flexDirection: "column",
                                gap: "0.75rem",
                            }}>
                                <p style={{
                                    margin: "0 0 0.1rem",
                                    fontSize: "0.74rem", color: "#64748b",
                                }}>
                                    These registered NGOs are actively working in the
                                    affected sectors. Your donation will be recorded on
                                    the platform.
                                </p>
                                {registeredNgos.map((ngo, i) => {
                                    const vb  = verificationBadge(ngo.verification_status);
                                    const pct = Math.round((ngo.match_score || 0) * 100);
                                    return (
                                        <div key={i} style={{
                                            background: "rgba(255,255,255,0.03)",
                                            border: "1px solid rgba(0,200,150,0.2)",
                                            borderRadius: "10px",
                                            padding: "0.9rem 1rem",
                                        }}>
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                marginBottom: "0.4rem",
                                                gap: "0.5rem",
                                            }}>
                                                <div>
                                                    <div style={{
                                                        fontWeight: 700,
                                                        color: "#e2e8f0",
                                                        fontSize: "0.88rem",
                                                    }}>
                                                        {ngo.name}
                                                    </div>
                                                    <div style={{
                                                        fontSize: "0.7rem",
                                                        color: "#64748b",
                                                        marginTop: "0.15rem",
                                                    }}>
                                                        📍 {ngo.geographic_focus}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    display: "flex", gap: "0.3rem",
                                                    flexShrink: 0, flexWrap: "wrap",
                                                    justifyContent: "flex-end",
                                                }}>
                                                    <span style={{
                                                        fontSize: "0.63rem", fontWeight: 700,
                                                        color: vb.color,
                                                        background: `${vb.color}18`,
                                                        border: `1px solid ${vb.color}38`,
                                                        borderRadius: "999px",
                                                        padding: "0.1rem 0.45rem",
                                                    }}>
                                                        {vb.label}
                                                    </span>
                                                    <span style={{
                                                        fontSize: "0.63rem", fontWeight: 700,
                                                        color: pct >= 50 ? "#00c896" : "#fb923c",
                                                        background: pct >= 50
                                                            ? "rgba(0,200,150,0.12)"
                                                            : "rgba(251,146,60,0.12)",
                                                        border: `1px solid ${pct >= 50
                                                            ? "rgba(0,200,150,0.3)"
                                                            : "rgba(251,146,60,0.3)"}`,
                                                        borderRadius: "999px",
                                                        padding: "0.1rem 0.45rem",
                                                    }}>
                                                        {pct}% match
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Sector tags */}
                                            {ngo.sector && (
                                                <div style={{
                                                    display: "flex", flexWrap: "wrap",
                                                    gap: "0.25rem", marginBottom: "0.55rem",
                                                }}>
                                                    {ngo.sector
                                                        .split("|")
                                                        .map(s => s.trim())
                                                        .filter(Boolean)
                                                        .map(s => (
                                                            <span key={s} style={{
                                                                fontSize: "0.62rem",
                                                                background: "rgba(255,255,255,0.05)",
                                                                border: "1px solid rgba(255,255,255,0.09)",
                                                                borderRadius: "999px",
                                                                padding: "0.1rem 0.4rem",
                                                                color: "#94a3b8",
                                                            }}>
                                                                {getSectorIcon(s)} {s}
                                                            </span>
                                                        ))
                                                    }
                                                </div>
                                            )}

                                            {/* Credibility bar */}
                                            <div style={{ marginBottom: "0.55rem" }}>
                                                <div style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    fontSize: "0.65rem",
                                                    marginBottom: "0.15rem",
                                                }}>
                                                    <span style={{ color: "#64748b" }}>
                                                        Crisis relevance
                                                    </span>
                                                    <span style={{
                                                        color: pct >= 50
                                                            ? "#00c896" : "#fb923c",
                                                        fontWeight: 700,
                                                    }}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                                <div style={{
                                                    height: "4px", borderRadius: "999px",
                                                    background: "rgba(255,255,255,0.07)",
                                                    overflow: "hidden",
                                                }}>
                                                    <div style={{
                                                        height: "100%",
                                                        width: `${pct}%`,
                                                        background: pct >= 50
                                                            ? "linear-gradient(90deg,#00c896,#10b981)"
                                                            : "linear-gradient(90deg,#fb923c,#ef4444)",
                                                        borderRadius: "999px",
                                                        transition: "width 0.5s ease",
                                                    }} />
                                                </div>
                                            </div>

                                            <button
                                                className="primary-btn"
                                                style={{ width: "100%", fontSize: "0.78rem" }}
                                                onClick={() => setDonatingNgo(ngo)}
                                            >
                                                💰 Donate to {ngo.name}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════════════════════════════════
                    COLLABORATE TAB
                ════════════════════════════════════════ */}
                {activeTab === "collaborate" && (
                    <div>
                        <p style={{
                            margin: "0 0 0.85rem",
                            fontSize: "0.74rem", color: "#64748b",
                        }}>
                            All NGOs relevant to this crisis — platform-registered
                            and catalog entries. NGOs can reach out to coordinate
                            relief efforts.
                        </p>
                        {allNgos.length === 0 ? (
                            <div style={{
                                textAlign: "center", padding: "1.5rem",
                                color: "#64748b", fontSize: "0.82rem",
                                border: "1px dashed rgba(255,255,255,0.1)",
                                borderRadius: "10px",
                            }}>
                                No matched NGOs for this crisis yet.
                            </div>
                        ) : (
                            <div style={{
                                display: "flex", flexDirection: "column",
                                gap: "0.65rem",
                            }}>
                                {allNgos.map((ngo, i) => {
                                    const vb     = verificationBadge(ngo.verification_status);
                                    const pct    = Math.round((ngo.match_score || 0) * 100);
                                    const isReg  = ngo.source === "registered";
                                    return (
                                        <div key={i} style={{
                                            background: "rgba(255,255,255,0.03)",
                                            border: isReg
                                                ? "1px solid rgba(0,200,150,0.2)"
                                                : "1px solid rgba(56,189,248,0.15)",
                                            borderRadius: "10px",
                                            padding: "0.8rem 1rem",
                                        }}>
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                marginBottom: "0.35rem",
                                                gap: "0.5rem",
                                            }}>
                                                <div>
                                                    <div style={{
                                                        fontWeight: 700, fontSize: "0.86rem",
                                                        color: "#e2e8f0",
                                                    }}>
                                                        {ngo.name}
                                                    </div>
                                                    <div style={{
                                                        fontSize: "0.68rem", color: "#64748b",
                                                        marginTop: "0.1rem",
                                                    }}>
                                                        📍 {ngo.geographic_focus}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    display: "flex", gap: "0.3rem",
                                                    flexShrink: 0, flexWrap: "wrap",
                                                    justifyContent: "flex-end",
                                                }}>
                                                    <span style={{
                                                        fontSize: "0.62rem", fontWeight: 700,
                                                        color: vb.color,
                                                        background: `${vb.color}18`,
                                                        border: `1px solid ${vb.color}38`,
                                                        borderRadius: "999px",
                                                        padding: "0.1rem 0.4rem",
                                                    }}>
                                                        {vb.label}
                                                    </span>
                                                    <span style={{
                                                        fontSize: "0.62rem", fontWeight: 700,
                                                        color: isReg ? "#00c896" : "#38bdf8",
                                                        background: isReg
                                                            ? "rgba(0,200,150,0.10)"
                                                            : "rgba(56,189,248,0.10)",
                                                        border: `1px solid ${isReg
                                                            ? "rgba(0,200,150,0.25)"
                                                            : "rgba(56,189,248,0.25)"}`,
                                                        borderRadius: "999px",
                                                        padding: "0.1rem 0.4rem",
                                                    }}>
                                                        {isReg ? "🏛 Platform" : "📚 Catalog"}
                                                    </span>
                                                </div>
                                            </div>

                                            {ngo.description && (
                                                <p style={{
                                                    margin: "0 0 0.4rem",
                                                    fontSize: "0.7rem", color: "#64748b",
                                                    lineHeight: 1.5,
                                                }}>
                                                    {ngo.description.length > 110
                                                        ? `${ngo.description.slice(0, 107)}…`
                                                        : ngo.description}
                                                </p>
                                            )}

                                            {/* Match bar */}
                                            <div style={{ marginBottom: "0.5rem" }}>
                                                <div style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    fontSize: "0.64rem",
                                                    marginBottom: "0.15rem",
                                                }}>
                                                    <span style={{ color: "#64748b" }}>
                                                        Crisis relevance
                                                    </span>
                                                    <span style={{
                                                        color: pct >= 50
                                                            ? "#00c896" : "#fb923c",
                                                        fontWeight: 700,
                                                    }}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                                <div style={{
                                                    height: "4px", borderRadius: "999px",
                                                    background: "rgba(255,255,255,0.07)",
                                                    overflow: "hidden",
                                                }}>
                                                    <div style={{
                                                        height: "100%",
                                                        width: `${pct}%`,
                                                        background: pct >= 50
                                                            ? "linear-gradient(90deg,#00c896,#10b981)"
                                                            : "linear-gradient(90deg,#fb923c,#ef4444)",
                                                        borderRadius: "999px",
                                                        transition: "width 0.5s ease",
                                                    }} />
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div style={{
                                                display: "flex", gap: "0.4rem",
                                                flexWrap: "wrap",
                                            }}>
                                                {isReg && (
                                                    <button
                                                        className="primary-btn"
                                                        style={{ flex: 1, fontSize: "0.72rem" }}
                                                        onClick={() => {
                                                            setDonatingNgo(ngo);
                                                            setActiveTab("donate");
                                                        }}
                                                    >
                                                        💰 Donate
                                                    </button>
                                                )}
                                                <button
                                                    className="secondary-btn"
                                                    style={{ flex: 1, fontSize: "0.72rem" }}
                                                    onClick={() => {
                                                        const subject = encodeURIComponent(
                                                            `Crisis Collaboration: ${crisis.title.slice(0, 50)}`
                                                        );
                                                        const body = encodeURIComponent(
                                                            `Dear ${ngo.name} Team,\n\n` +
                                                            `We are reaching out regarding the ongoing crisis:\n` +
                                                            `"${crisis.title}"\n\n` +
                                                            `Location: ${crisis.location}\n` +
                                                            `Urgency: ${crisis.urgency?.toUpperCase()}\n\n` +
                                                            `We believe our organisations can collaborate on ` +
                                                            `relief efforts in the sectors: ` +
                                                            `${(crisis.sectors || []).join(", ")}.\n\n` +
                                                            `We would love to explore a joint response.\n\n` +
                                                            `Best regards,\n${user?.name || "Our Organisation"}`
                                                        );
                                                        window.open(
                                                            `mailto:?subject=${subject}&body=${body}`
                                                        );
                                                    }}
                                                >
                                                    📧 Reach Out
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Close button ── */}
                <div style={{ marginTop: "1.25rem", textAlign: "right" }}>
                    <button className="ghost-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>

            {/* ════════════════════════════════════════
                DONATION MODAL (nested)
            ════════════════════════════════════════ */}
            {donatingNgo && (
                <div
                    className="modal-backdrop"
                    onClick={() => setDonatingNgo(null)}
                    style={{ zIndex: 1200 }}
                >
                    <div
                        className="modal"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: "380px" }}
                    >
                        <h2 style={{ marginTop: 0 }}>
                            Donate to {donatingNgo.name}
                        </h2>
                        <p style={{
                            margin: "0 0 1rem",
                            fontSize: "0.78rem", color: "#94a3b8",
                        }}>
                            Crisis: {crisis.title.slice(0, 70)}
                            {crisis.title.length > 70 ? "…" : ""}
                        </p>
                        <form className="form-grid" onSubmit={submitDonation}>
                            <label>
                                Amount
                                <input
                                    type="number"
                                    value={donationForm.amount}
                                    onChange={e => setDonationForm(
                                        p => ({ ...p, amount: e.target.value })
                                    )}
                                    placeholder="e.g. 500"
                                    required
                                    min="1"
                                />
                            </label>
                            <label>
                                Currency
                                <select
                                    value={donationForm.currency}
                                    onChange={e => setDonationForm(
                                        p => ({ ...p, currency: e.target.value })
                                    )}
                                >
                                    <option value="INR">INR ₹</option>
                                    <option value="USD">USD $</option>
                                    <option value="EUR">EUR €</option>
                                    <option value="GBP">GBP £</option>
                                </select>
                            </label>
                            <label className="full-width">
                                Note (optional)
                                <input
                                    value={donationForm.description}
                                    onChange={e => setDonationForm(
                                        p => ({ ...p, description: e.target.value })
                                    )}
                                    placeholder="e.g. For flood relief operations"
                                />
                            </label>
                            <div className="row-actions full-width">
                                <button
                                    type="button"
                                    className="ghost-btn"
                                    onClick={() => setDonatingNgo(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="primary-btn"
                                >
                                    Confirm Donation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CRISIS RESPONSE PAGE (main)
// ─────────────────────────────────────────────────────────────────────────────
function CrisisResponsePage({ user, token }) {
    const [crises,         setCrises]         = useState([]);
    const [loading,        setLoading]        = useState(true);
    const [error,          setError]          = useState(null);
    const [lastFetched,    setLastFetched]    = useState(null);
    const [sourceStatuses, setSourceStatuses] = useState({});
    const [urgencyFilter,  setUrgencyFilter]  = useState("ALL");
    const [sectorFilter,   setSectorFilter]   = useState("ALL");
    const [sourceFilter,   setSourceFilter]   = useState("ALL");
    const [searchTerm,     setSearchTerm]     = useState("");
    const [selectedCrisis, setSelectedCrisis] = useState(null);
    const [refreshing,     setRefreshing]     = useState(false);

    const urgencyConfig = {
        high:   {
            color: "#ef4444",
            bg:     "rgba(239,68,68,0.12)",
            border: "rgba(239,68,68,0.30)",
            label:  "🔴 High",
            pulse:  true,
        },
        medium: {
            color: "#fb923c",
            bg:     "rgba(251,146,60,0.10)",
            border: "rgba(251,146,60,0.28)",
            label:  "🟡 Medium",
            pulse:  false,
        },
        low: {
            color: "#38bdf8",
            bg:     "rgba(56,189,248,0.08)",
            border: "rgba(56,189,248,0.25)",
            label:  "🔵 Low",
            pulse:  false,
        },
    };

    const formatDate = (str) => {
        if (!str) return "";
        try { return new Date(str).toLocaleString(); } catch { return str; }
    };

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else           setLoading(true);
        setError(null);
        try {
            const res = await apiRequest(
                "/crisis/alerts", "GET", undefined, token
            );
            setCrises(res.crises || []);
            setSourceStatuses(res.source_statuses || {});
            setLastFetched(res.fetched_at || new Date().toISOString());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, []);

    // ── Derived values ──────────────────────────────────────────────────────
    const allSectors = Array.from(new Set(
        crises.flatMap(c => c.sectors || [])
    )).sort();

    const allSources = Array.from(new Set(
        crises.map(c => c.source).filter(Boolean)
    )).sort();

    const norm = searchTerm.trim().toLowerCase();
    const visible = crises.filter(c => {
        if (urgencyFilter !== "ALL" && c.urgency !== urgencyFilter) return false;
        if (sectorFilter  !== "ALL" && !(c.sectors || []).includes(sectorFilter)) return false;
        if (sourceFilter  !== "ALL" && c.source !== sourceFilter)  return false;
        if (norm) {
            const hay = `${c.title} ${c.description} ${c.location}`.toLowerCase();
            if (!hay.includes(norm)) return false;
        }
        return true;
    });

    const highCount   = crises.filter(c => c.urgency === "high").length;
    const mediumCount = crises.filter(c => c.urgency === "medium").length;
    const lowCount    = crises.filter(c => c.urgency === "low").length;

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 0.5rem" }}>

            {/* ══ PAGE HEADER ═══════════════════════════════════════════════ */}
            <div style={{
                background:
                    "linear-gradient(135deg," +
                    "rgba(239,68,68,0.10) 0%," +
                    "rgba(251,146,60,0.07) 100%)",
                border: "1px solid rgba(239,68,68,0.22)",
                borderRadius: "16px",
                padding: "1.75rem 2rem",
                marginBottom: "1.5rem",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Decorative background blobs */}
                <div style={{
                    position: "absolute", top: "-50px", right: "-50px",
                    width: "220px", height: "220px", borderRadius: "50%",
                    background: "rgba(239,68,68,0.05)", pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", bottom: "-30px", left: "30%",
                    width: "140px", height: "140px", borderRadius: "50%",
                    background: "rgba(251,146,60,0.04)", pointerEvents: "none",
                }} />

                <div style={{
                    display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between",
                    flexWrap: "wrap", gap: "1rem",
                    position: "relative",
                }}>
                    <div>
                        {/* Live badge */}
                        <div style={{
                            display: "inline-flex", alignItems: "center",
                            gap: "0.45rem",
                            background: "rgba(239,68,68,0.14)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "999px",
                            padding: "0.25rem 0.85rem",
                            fontSize: "0.7rem", fontWeight: 700,
                            color: "#ef4444",
                            marginBottom: "0.85rem",
                            letterSpacing: "0.05em",
                        }}>
                            <span style={{
                                width: "7px", height: "7px",
                                borderRadius: "50%",
                                background: "#ef4444",
                                display: "inline-block",
                                animation: "crisispulse 1.5s ease-in-out infinite",
                            }} />
                            LIVE CRISIS MONITORING
                        </div>

                        <h2 style={{
                            margin: "0 0 0.45rem",
                            fontSize: "1.65rem",
                            color: "#f1f5f9",
                            fontWeight: 800,
                        }}>
                            🚨 Crisis Response Center
                        </h2>
                        <p style={{
                            margin: "0 0 0.75rem",
                            color: "#94a3b8",
                            fontSize: "0.88rem",
                            maxWidth: "560px",
                            lineHeight: 1.6,
                        }}>
                            Real-time disaster and humanitarian crisis alerts sourced
                            from <strong style={{ color: "#e2e8f0" }}>
                                Times of India
                            </strong> and <strong style={{ color: "#e2e8f0" }}>
                                UNICEF
                            </strong>. Find NGOs to donate to or collaborate with
                            during active emergencies.
                        </p>

                        {/* Source status pills */}
                        {Object.keys(sourceStatuses).length > 0 && (
                            <div style={{
                                display: "flex", gap: "0.5rem",
                                flexWrap: "wrap",
                            }}>
                                {Object.entries(sourceStatuses).map(([src, status]) => (
                                    <div key={src} style={{
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.09)",
                                        borderRadius: "8px",
                                        padding: "0.28rem 0.75rem",
                                        fontSize: "0.68rem", color: "#94a3b8",
                                    }}>
                                        <strong style={{ color: "#e2e8f0" }}>
                                            {SOURCE_ICONS[src] || "📡"} {src}:
                                        </strong>{" "}
                                        {status}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Refresh button + timestamp */}
                    <div style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "flex-end", gap: "0.5rem",
                    }}>
                        <button
                            onClick={() => load(true)}
                            disabled={refreshing}
                            style={{
                                background: refreshing
                                    ? "rgba(255,255,255,0.04)"
                                    : "rgba(239,68,68,0.14)",
                                border: "1px solid rgba(239,68,68,0.28)",
                                borderRadius: "8px",
                                color: "#ef4444",
                                padding: "0.48rem 1.1rem",
                                fontSize: "0.78rem", fontWeight: 700,
                                cursor: refreshing ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center",
                                gap: "0.4rem", transition: "all 0.2s",
                            }}
                        >
                            <span style={{
                                display: "inline-block",
                                animation: refreshing
                                    ? "spin 1s linear infinite" : "none",
                            }}>
                                🔄
                            </span>
                            {refreshing ? "Refreshing…" : "Refresh Now"}
                        </button>
                        {lastFetched && (
                            <span style={{ fontSize: "0.67rem", color: "#475569" }}>
                                Last updated: {formatDate(lastFetched)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ SUMMARY STATS ═════════════════════════════════════════════ */}
            {!loading && crises.length > 0 && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
                    gap: "0.75rem",
                    marginBottom: "1.5rem",
                }}>
                    {[
                        { label: "Total Crises",    value: crises.length,   color: "#e2e8f0" },
                        { label: "🔴 High Urgency", value: highCount,       color: "#ef4444" },
                        { label: "🟡 Medium",       value: mediumCount,     color: "#fb923c" },
                        { label: "🔵 Low",          value: lowCount,        color: "#38bdf8" },
                        {
                            label: "Sources",
                            value: Object.keys(sourceStatuses).length,
                            color: "#00c896",
                        },
                        { label: "Showing",         value: visible.length,  color: "#a78bfa" },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: `${s.color}0e`,
                            border: `1px solid ${s.color}28`,
                            borderRadius: "12px",
                            padding: "0.85rem 1rem",
                            textAlign: "center",
                        }}>
                            <div style={{
                                fontSize: "1.65rem", fontWeight: 800,
                                color: s.color, lineHeight: 1,
                            }}>
                                {s.value}
                            </div>
                            <div style={{
                                fontSize: "0.63rem", color: "#64748b",
                                textTransform: "uppercase",
                                letterSpacing: "0.07em",
                                marginTop: "0.28rem",
                            }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ══ FILTERS ═══════════════════════════════════════════════════ */}
            {!loading && crises.length > 0 && (
                <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    marginBottom: "1.5rem",
                }}>
                    {/* Top row: search + dropdowns */}
                    <div style={{
                        display: "flex", flexWrap: "wrap",
                        gap: "0.75rem", alignItems: "flex-end",
                        marginBottom: "0.85rem",
                    }}>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                            <div style={{
                                fontSize: "0.68rem", color: "#64748b",
                                marginBottom: "0.28rem", fontWeight: 600,
                            }}>
                                Search crises
                            </div>
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search by title, location…"
                                style={{ width: "100%", padding: "0.42rem 0.75rem" }}
                            />
                        </div>

                        {allSectors.length > 0 && (
                            <div style={{ minWidth: "160px" }}>
                                <div style={{
                                    fontSize: "0.68rem", color: "#64748b",
                                    marginBottom: "0.28rem", fontWeight: 600,
                                }}>
                                    Sector
                                </div>
                                <select
                                    value={sectorFilter}
                                    onChange={e => setSectorFilter(e.target.value)}
                                    style={{ width: "100%", padding: "0.42rem 0.65rem" }}
                                >
                                    <option value="ALL">All sectors</option>
                                    {allSectors.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {allSources.length > 1 && (
                            <div style={{ minWidth: "155px" }}>
                                <div style={{
                                    fontSize: "0.68rem", color: "#64748b",
                                    marginBottom: "0.28rem", fontWeight: 600,
                                }}>
                                    Source
                                </div>
                                <select
                                    value={sourceFilter}
                                    onChange={e => setSourceFilter(e.target.value)}
                                    style={{ width: "100%", padding: "0.42rem 0.65rem" }}
                                >
                                    <option value="ALL">All sources</option>
                                    {allSources.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Urgency quick-chips */}
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        <span style={{
                            fontSize: "0.68rem", color: "#475569",
                            alignSelf: "center", marginRight: "0.1rem",
                        }}>
                            Urgency:
                        </span>
                        {[
                            { key: "ALL",    label: "All",         color: "#64748b" },
                            { key: "high",   label: "🔴 High",     color: "#ef4444" },
                            { key: "medium", label: "🟡 Medium",   color: "#fb923c" },
                            { key: "low",    label: "🔵 Low",      color: "#38bdf8" },
                        ].map(u => {
                            const active = urgencyFilter === u.key;
                            return (
                                <button
                                    key={u.key}
                                    type="button"
                                    onClick={() => setUrgencyFilter(u.key)}
                                    style={{
                                        fontSize: "0.7rem",
                                        padding: "0.22rem 0.65rem",
                                        borderRadius: "999px",
                                        border: active
                                            ? `1px solid ${u.color}70`
                                            : "1px solid rgba(255,255,255,0.1)",
                                        background: active
                                            ? `${u.color}18`
                                            : "rgba(255,255,255,0.03)",
                                        color: active ? u.color : "#64748b",
                                        cursor: "pointer",
                                        fontWeight: active ? 700 : 400,
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {u.label}
                                </button>
                            );
                        })}

                        {(urgencyFilter !== "ALL" || sectorFilter !== "ALL" ||
                          sourceFilter !== "ALL" || searchTerm) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setUrgencyFilter("ALL");
                                    setSectorFilter("ALL");
                                    setSourceFilter("ALL");
                                    setSearchTerm("");
                                }}
                                style={{
                                    fontSize: "0.68rem",
                                    padding: "0.22rem 0.65rem",
                                    borderRadius: "999px",
                                    border: "1px solid rgba(239,68,68,0.3)",
                                    background: "rgba(239,68,68,0.08)",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                    marginLeft: "0.25rem",
                                }}
                            >
                                ✕ Clear all
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ══ LOADING ═══════════════════════════════════════════════════ */}
            {loading && (
                <div style={{
                    textAlign: "center", padding: "4.5rem 2rem",
                    color: "#64748b",
                }}>
                    <div style={{
                        fontSize: "2.8rem", marginBottom: "1rem",
                        display: "inline-block",
                        animation: "spin 1.5s linear infinite",
                    }}>
                        🔄
                    </div>
                    <p style={{
                        margin: 0, fontSize: "1rem", color: "#94a3b8",
                    }}>
                        Fetching live crisis data from Times of India & UNICEF…
                    </p>
                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem" }}>
                        This may take a few seconds
                    </p>
                </div>
            )}

            {/* ══ ERROR ═════════════════════════════════════════════════════ */}
            {!loading && error && (
                <div style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: "12px", padding: "2.5rem",
                    textAlign: "center",
                }}>
                    <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>
                        ⚠️
                    </div>
                    <p style={{
                        margin: "0 0 0.5rem",
                        fontWeight: 700, color: "#ef4444",
                        fontSize: "0.95rem",
                    }}>
                        Failed to fetch crisis data
                    </p>
                    <p style={{
                        margin: "0 0 1.25rem",
                        fontSize: "0.78rem", color: "#94a3b8",
                    }}>
                        {error}
                    </p>
                    <button className="primary-btn" onClick={() => load()}>
                        Try Again
                    </button>
                </div>
            )}

            {/* ══ EMPTY STATE ═══════════════════════════════════════════════ */}
            {!loading && !error && crises.length === 0 && (
                <div style={{
                    textAlign: "center", padding: "3.5rem 2rem",
                    border: "1px dashed rgba(255,255,255,0.1)",
                    borderRadius: "14px", color: "#64748b",
                }}>
                    <div style={{ fontSize: "2.8rem", marginBottom: "0.75rem" }}>
                        ✅
                    </div>
                    <p style={{
                        margin: 0, fontSize: "1rem", color: "#94a3b8",
                    }}>
                        No active crisis alerts found right now.
                    </p>
                    <p style={{ margin: "0.4rem 0 1.25rem", fontSize: "0.78rem" }}>
                        Sources were checked but no disaster-related headlines
                        were detected.
                    </p>
                    <button className="ghost-btn" onClick={() => load(true)}>
                        🔄 Check Again
                    </button>
                </div>
            )}

            {/* ══ NO FILTER RESULTS ═════════════════════════════════════════ */}
            {!loading && !error && crises.length > 0 && visible.length === 0 && (
                <div style={{
                    textAlign: "center", padding: "2.5rem",
                    border: "1px dashed rgba(255,255,255,0.1)",
                    borderRadius: "12px", color: "#64748b",
                }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                        🔍
                    </div>
                    <p style={{ margin: "0 0 0.75rem" }}>
                        No crises match your current filters.
                    </p>
                    <button
                        className="ghost-btn"
                        onClick={() => {
                            setUrgencyFilter("ALL");
                            setSectorFilter("ALL");
                            setSourceFilter("ALL");
                            setSearchTerm("");
                        }}
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {/* ══ CRISIS GRID ═══════════════════════════════════════════════ */}
            {!loading && visible.length > 0 && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))",
                    gap: "1.25rem",
                }}>
                    {visible.map((crisis) => {
                        const ucfg = urgencyConfig[crisis.urgency] || urgencyConfig.low;
                        return (
                            <div
                                key={crisis.id}
                                style={{
                                    background: "rgba(255,255,255,0.025)",
                                    border: `1px solid ${ucfg.border}`,
                                    borderRadius: "14px",
                                    padding: "1.1rem 1.25rem",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.7rem",
                                    transition: "transform 0.2s,box-shadow 0.2s",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform =
                                        "translateY(-3px)";
                                    e.currentTarget.style.boxShadow =
                                        `0 10px 32px ${ucfg.color}18`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform =
                                        "translateY(0)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                {/* ── Source + urgency row ── */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                    }}>
                                        <span style={{ fontSize: "0.9rem" }}>
                                            {SOURCE_ICONS[crisis.source] || "📡"}
                                        </span>
                                        <span style={{
                                            fontSize: "0.67rem", fontWeight: 700,
                                            color: "#64748b",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em",
                                        }}>
                                            {crisis.source}
                                        </span>
                                    </div>
                                    <span style={{
                                        background: ucfg.bg,
                                        border: `1px solid ${ucfg.border}`,
                                        borderRadius: "999px",
                                        padding: "0.14rem 0.6rem",
                                        fontSize: "0.67rem", fontWeight: 700,
                                        color: ucfg.color,
                                        display: "flex",
                                        alignItems: "center", gap: "0.3rem",
                                    }}>
                                        {ucfg.pulse && (
                                            <span style={{
                                                width: "6px", height: "6px",
                                                borderRadius: "50%",
                                                background: ucfg.color,
                                                display: "inline-block",
                                                animation:
                                                    "crisispulse 1.2s ease-in-out infinite",
                                            }} />
                                        )}
                                        {ucfg.label}
                                    </span>
                                </div>

                                {/* ── Title ── */}
                                <h3 style={{
                                    margin: 0, fontSize: "0.92rem",
                                    color: "#f1f5f9", lineHeight: 1.45,
                                    fontWeight: 700,
                                }}>
                                    {crisis.title}
                                </h3>

                                {/* ── Description ── */}
                                {crisis.description && (
                                    <p style={{
                                        margin: 0, fontSize: "0.77rem",
                                        color: "#94a3b8", lineHeight: 1.6,
                                    }}>
                                        {crisis.description.length > 155
                                            ? `${crisis.description.slice(0, 152)}…`
                                            : crisis.description}
                                    </p>
                                )}

                                {/* ── Location + date ── */}
                                <div style={{
                                    display: "flex", gap: "0.75rem",
                                    flexWrap: "wrap", fontSize: "0.71rem",
                                    color: "#64748b",
                                }}>
                                    <span>📍 {crisis.location}</span>
                                    {crisis.published && (
                                        <span>🕒 {formatDate(crisis.published)}</span>
                                    )}
                                </div>

                                {/* ── Sector tags ── */}
                                {(crisis.sectors || []).length > 0 && (
                                    <div style={{
                                        display: "flex", flexWrap: "wrap",
                                        gap: "0.28rem",
                                    }}>
                                        {crisis.sectors.map(s => (
                                            <span key={s} style={{
                                                fontSize: "0.63rem",
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "999px",
                                                padding: "0.1rem 0.42rem",
                                                color: "#94a3b8",
                                            }}>
                                                {getSectorIcon(s)} {s}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* ── Matched NGOs preview ── */}
                                {(crisis.matched_ngos || []).length > 0 && (
                                    <div style={{
                                        background: "rgba(0,200,150,0.06)",
                                        border: "1px solid rgba(0,200,150,0.15)",
                                        borderRadius: "8px",
                                        padding: "0.55rem 0.75rem",
                                    }}>
                                        <div style={{
                                            fontSize: "0.67rem", fontWeight: 700,
                                            color: "#00c896", marginBottom: "0.4rem",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                        }}>
                                            🤝 {crisis.matched_ngos.length} NGO
                                            {crisis.matched_ngos.length !== 1 ? "s" : ""} can help
                                        </div>
                                        <div style={{
                                            display: "flex", flexWrap: "wrap",
                                            gap: "0.28rem",
                                        }}>
                                            {crisis.matched_ngos.slice(0, 4).map((ngo, i) => (
                                                <span key={i} style={{
                                                    fontSize: "0.66rem",
                                                    background: "rgba(0,200,150,0.10)",
                                                    border: "1px solid rgba(0,200,150,0.22)",
                                                    borderRadius: "999px",
                                                    padding: "0.1rem 0.45rem",
                                                    color: "#00c896",
                                                }}>
                                                    {ngo.name}
                                                </span>
                                            ))}
                                            {crisis.matched_ngos.length > 4 && (
                                                <span style={{
                                                    fontSize: "0.66rem",
                                                    color: "#64748b",
                                                    alignSelf: "center",
                                                }}>
                                                    +{crisis.matched_ngos.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Action buttons ── */}
                                <div style={{
                                    display: "flex", gap: "0.5rem",
                                    marginTop: "auto",
                                }}>
                                    <button
                                        className="primary-btn"
                                        style={{ flex: 1, fontSize: "0.78rem" }}
                                        onClick={() => setSelectedCrisis(crisis)}
                                    >
                                        View NGOs & Details
                                    </button>
                                    {crisis.url && (
                                        <a
                                            href={crisis.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Read full article"
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "38px", height: "38px",
                                                borderRadius: "8px", flexShrink: 0,
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                color: "#94a3b8",
                                                textDecoration: "none",
                                                fontSize: "0.9rem",
                                                transition: "all 0.15s",
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background =
                                                    "rgba(56,189,248,0.12)";
                                                e.currentTarget.style.borderColor =
                                                    "rgba(56,189,248,0.3)";
                                                e.currentTarget.style.color = "#38bdf8";
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background =
                                                    "rgba(255,255,255,0.05)";
                                                e.currentTarget.style.borderColor =
                                                    "rgba(255,255,255,0.1)";
                                                e.currentTarget.style.color = "#94a3b8";
                                            }}
                                        >
                                            🔗
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══ DETAIL MODAL ══════════════════════════════════════════════ */}
            {selectedCrisis && (
                <CrisisDetailModal
                    crisis={selectedCrisis}
                    user={user}
                    token={token}
                    onClose={() => setSelectedCrisis(null)}
                />
            )}

            {/* ══ CSS KEYFRAMES ═════════════════════════════════════════════ */}
            <style>{`
                @keyframes crisispulse {
                    0%,100% { opacity:1; transform:scale(1);   }
                    50%     { opacity:0.4; transform:scale(1.4); }
                }
                @keyframes spin {
                    from { transform:rotate(0deg);   }
                    to   { transform:rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

function DonorPortal({ user, token }) {
    const [prefs, setPrefs] = useState({ cause: "", location: "", sector: "", interests: "" });
    const [results, setResults] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [donatingNgo, setDonatingNgo] = useState(null);
    const [donationForm, setDonationForm] = useState({ amount: "", currency: "INR", description: "" });
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("score");
    const [usedFallback, setUsedFallback] = useState(false);
    const [sectorChipFilter, setSectorChipFilter] = useState("");
    const [lowScoreWarnings, setLowScoreWarnings] = useState([]);
    const [showLowScoreModal, setShowLowScoreModal] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPrefs((prev) => ({ ...prev, [name]: value }));
    };

    const handleMatch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setUsedFallback(false);
        setLowScoreWarnings([]);
        setShowLowScoreModal(false);
        try {
            const payload = {
                sector: prefs.sector || prefs.cause,
                cause: prefs.cause,
                interests: prefs.interests || prefs.cause,
                location: prefs.location,
                keywords: prefs.cause,
                top_n: 12,
            };
            const res = await apiRequest("/recommendations", "POST", payload, token);
            const recs = res.recommendations || [];
            if (recs.length > 0) {
                setResults(recs);

                // ── LOW SCORE CHECK ──────────────────────────────────────
                const LOW_THRESHOLD = 0.50;
                const lowMatches = recs
                    .filter(r => Number(r.score || 0) < LOW_THRESHOLD)
                    .map(r => ({
                        right_entity: r.name,
                        score: Number(r.score || 0),
                        message:
                            `Low alignment (${Math.round((r.score || 0) * 100)}%) for ` +
                            `"${r.name}". Their sector or location may not closely ` +
                            `match your stated preferences.`,
                    }));
                if (lowMatches.length > 0) {
                    setLowScoreWarnings(lowMatches);
                    setShowLowScoreModal(true);
                }
                // ─────────────────────────────────────────────────────────
            } else {
                const ngoRes = await apiRequest("/ngos", "GET", undefined, token);
                const mapped = (ngoRes.ngos || []).map((n, idx) => ({
                    name: n.name,
                    sector_tags: n.sector,
                    geographic_focus: n.geographic_focus,
                    description: n.description,
                    state: n.geographic_focus,
                    country: "India",
                    score: 0.5 - idx * 0.005,
                    score_breakdown: {
                        semantic_similarity: 0.5,
                        sector_match: 0.5,
                        geographic_affinity: 0.5,
                        fairness_boost: 0.5,
                        credibility: 0.7,
                    },
                    recognition_tier: "mid_tier",
                    db_enriched: true,
                    ngo_db_id: n.id,
                }));
                setResults(mapped);
                setUsedFallback(true);
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        async function loadHistory() {
            try {
                const res = await apiRequest("/transactions/mine", "GET", undefined, token);
                setHistory(res.transactions || []);
            } catch (e) {
                console.error(e);
            }
        }
        loadHistory();
    }, [token]);

    const openDonate = async (ngo) => {
        let ngoDbId = ngo.ngo_db_id;
        if (!ngoDbId) {
            try {
                const res = await apiRequest("/ngos", "GET", undefined, token);
                const match = (res.ngos || []).find(n => n.name === ngo.name);
                ngoDbId = match?.id;
            } catch (_) {}
        }
        setDonatingNgo({ ...ngo, ngo_db_id: ngoDbId });
        setDonationForm({ amount: "", currency: "INR", description: "" });
    };

    const submitDonation = async (e) => {
        e.preventDefault();
        if (!donatingNgo) return;
        const amount = Number(donationForm.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        if (!donatingNgo.ngo_db_id) {
            alert("Could not resolve NGO database ID.");
            return;
        }
        try {
            await apiRequest("/transactions", "POST", {
                ngo_id: donatingNgo.ngo_db_id,
                amount,
                currency: donationForm.currency,
                description: donationForm.description || undefined,
            }, token);
            setDonatingNgo(null);
            const res = await apiRequest("/transactions/mine", "GET", undefined, token);
            setHistory(res.transactions || []);
            alert("Donation recorded successfully.");
        } catch (e2) {
            alert(e2.message);
        }
    };

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const sectorTagsAvailable = Array.from(new Set(
        results.flatMap(ngo =>
            (ngo.sector_tags || ngo.sector || "")
                .split("|")
                .map(s => s.trim())
                .filter(Boolean)
        )
    )).sort();

    let visibleResults = [...results];

    if (normalizedSearch) {
        visibleResults = visibleResults.filter(ngo => {
            const haystack = `${ngo.name} ${ngo.sector_tags || ""} ${ngo.state || ""} ${ngo.country || ""} ${ngo.description || ""}`.toLowerCase();
            return haystack.includes(normalizedSearch);
        });
    }

    if (sectorChipFilter) {
        visibleResults = visibleResults.filter(ngo => {
            const tags = (ngo.sector_tags || ngo.sector || "").split("|").map(s => s.trim());
            return tags.includes(sectorChipFilter);
        });
    }

    visibleResults.sort((a, b) => {
        const aScore    = Number(a.score || 0);
        const bScore    = Number(b.score || 0);
        const aFairness = Number(a.score_breakdown?.fairness_boost || 0);
        const bFairness = Number(b.score_breakdown?.fairness_boost || 0);
        const aSem      = Number(a.score_breakdown?.semantic_similarity || 0);
        const bSem      = Number(b.score_breakdown?.semantic_similarity || 0);
        if (sortBy === "fairness")   return bFairness - aFairness || bScore - aScore;
        if (sortBy === "similarity") return bSem - aSem           || bScore - aScore;
        return bScore - aScore;
    });

    const tierBadge = (tier) => {
        if (tier === "grassroots") return { label: "🌱 Grassroots",  color: "#00c896" };
        if (tier === "mid_tier")   return { label: "🔷 Established", color: "#38bdf8" };
        return                            { label: "⭐ Well-Known",   color: "#a78bfa" };
    };

    return (
        <div className="grid-2">
            {/* ── Low Score Warning Modal ── */}
            {showLowScoreModal && (
                <LowScoreWarningModal
                    warnings={lowScoreWarnings}
                    onClose={() => setShowLowScoreModal(false)}
                />
            )}

            <div className="card donor-card">
                <h2>AI-Matched NGO Recommendations</h2>
                <p className="muted" style={{ marginBottom: "0.75rem" }}>
                    Powered by SBERT semantic matching with fairness boosts for grassroots NGOs.
                </p>

                <form className="form-grid" onSubmit={handleMatch}>
                    <label>
                        Cause / Sector
                        <input
                            name="cause"
                            value={prefs.cause}
                            onChange={handleChange}
                            placeholder="Education, Healthcare, Environment…"
                            required
                        />
                    </label>
                    <label>
                        Location
                        <input
                            name="location"
                            value={prefs.location}
                            onChange={handleChange}
                            placeholder="Mysuru / Karnataka / India"
                        />
                    </label>
                    <label>
                        Specific sector tag (optional)
                        <input
                            name="sector"
                            value={prefs.sector}
                            onChange={handleChange}
                            placeholder="e.g. Child Welfare"
                        />
                    </label>
                    <label>
                        Keywords / interests
                        <input
                            name="interests"
                            value={prefs.interests}
                            onChange={handleChange}
                            placeholder="e.g. school meals rural girls literacy"
                        />
                    </label>
                    <button type="submit" className="primary-btn" disabled={loading}>
                        {loading ? "Matching…" : "Find NGOs"}
                    </button>
                </form>

                {results.length > 0 && (
                    <p className="muted" style={{ marginTop: "0.6rem" }}>
                        Matching for: <strong>{prefs.cause || "Any cause"}</strong>
                        {prefs.location && <> · <strong>{prefs.location}</strong></>}
                        {prefs.sector   && <> · <strong>{prefs.sector}</strong></>}
                    </p>
                )}

                {results.length > 0 && (
                    <div className="row-actions" style={{ marginTop: "0.75rem" }}>
                        <label style={{ flex: 1, minWidth: "180px" }}>
                            <span style={{ display: "block", fontSize: "0.78rem", color: "#64748b" }}>
                                Search within results
                            </span>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filter by name, sector, or location…"
                            />
                        </label>
                        <label>
                            <span style={{ display: "block", fontSize: "0.78rem", color: "#64748b" }}>
                                Sort by
                            </span>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="score">Overall AI score</option>
                                <option value="fairness">Fairness boost (grassroots first)</option>
                                <option value="similarity">Semantic similarity</option>
                            </select>
                        </label>
                    </div>
                )}

                {results.length > 0 && sectorTagsAvailable.length > 0 && (
                    <div className="filter-chips">
                        <span className="filter-label">Filter by sector:</span>
                        <button
                            type="button"
                            className={!sectorChipFilter ? "chip chip-active" : "chip"}
                            onClick={() => setSectorChipFilter("")}
                        >
                            All
                        </button>
                        {sectorTagsAvailable.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                className={sectorChipFilter === tag ? "chip chip-active" : "chip"}
                                onClick={() => setSectorChipFilter(tag)}
                            >
                                {getSectorIcon(tag)} {tag}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Low score summary banner (shown inline when modal is dismissed) ── */}
                {!showLowScoreModal && lowScoreWarnings.length > 0 && results.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            background: "rgba(251,146,60,0.08)",
                            border: "1px solid rgba(251,146,60,0.22)",
                            borderRadius: "8px",
                            padding: "0.5rem 0.85rem",
                            marginTop: "0.75rem",
                            fontSize: "0.78rem",
                            color: "#fb923c",
                            flexWrap: "wrap",
                        }}
                    >
                        <span>
                            ⚠️ {lowScoreWarnings.length} result
                            {lowScoreWarnings.length !== 1 ? "s" : ""} scored below
                            the 50% similarity threshold.
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowLowScoreModal(true)}
                            style={{
                                background: "rgba(251,146,60,0.15)",
                                border: "1px solid rgba(251,146,60,0.35)",
                                borderRadius: "6px",
                                color: "#fb923c",
                                fontSize: "0.72rem",
                                padding: "0.2rem 0.6rem",
                                cursor: "pointer",
                                fontWeight: 600,
                            }}
                        >
                            View Details
                        </button>
                    </div>
                )}

                <div className="results-grid">
                    {visibleResults.map((ngo, idx) => {
                        const badge    = tierBadge(ngo.recognition_tier);
                        const score    = Number(ngo.score || 0);
                        const semantic = Number(ngo.score_breakdown?.semantic_similarity || 0);
                        const fairness = Number(ngo.score_breakdown?.fairness_boost || 0);
                        const geo      = Number(ngo.score_breakdown?.geographic_affinity || 0);
                        const sector   = Number(ngo.score_breakdown?.sector_match || 0);
                        const engine   = ngo.score_breakdown?.similarity_engine || "tfidf";
                        const location = [ngo.state, ngo.country]
                            .filter(Boolean).join(", ") || ngo.geographic_focus || "N/A";
                        const sectorStr   = ngo.sector_tags || ngo.sector || "";
                        const isLowScore  = score < 0.50;

                        return (
                            <div key={idx} className="card subtle ngo-card" style={{
                                border: isLowScore
                                    ? "1px solid rgba(251,146,60,0.25)"
                                    : undefined,
                            }}>
                                {/* ── Low score inline badge ── */}
                                {isLowScore && (
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        background: "rgba(251,146,60,0.10)",
                                        border: "1px solid rgba(251,146,60,0.25)",
                                        borderRadius: "6px",
                                        padding: "0.3rem 0.6rem",
                                        marginBottom: "0.6rem",
                                        fontSize: "0.7rem",
                                        color: "#fb923c",
                                    }}>
                                        <span>⚠️</span>
                                        <span>
                                            Below 50% threshold ({Math.round(score * 100)}%) —
                                            may be loosely aligned
                                        </span>
                                    </div>
                                )}

                                <div className="ngo-card-header">
                                    <div className="avatar-circle">{getInitials(ngo.name)}</div>
                                    <div className="ngo-card-title">
                                        <h3>{ngo.name}</h3>
                                        <div className="pill-row">{renderSectorTags(sectorStr)}</div>
                                    </div>
                                </div>

                                {ngo.description && (
                                    <p className="ngo-card-description">
                                        {ngo.description.length > 140
                                            ? `${ngo.description.slice(0, 137)}…`
                                            : ngo.description}
                                    </p>
                                )}

                                <div className="ngo-card-meta">
                                    <span className="location-pill">
                                        <span className="pill-icon" aria-hidden="true">📍</span>
                                        {location}
                                    </span>
                                    <span style={{
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        color: badge.color,
                                        background: `${badge.color}18`,
                                        border: `1px solid ${badge.color}44`,
                                        borderRadius: "999px",
                                        padding: "0.2rem 0.55rem",
                                    }}>
                                        {badge.label}
                                    </span>
                                </div>

                                {/* Overall score bar */}
                                <div style={{ margin: "0.65rem 0 0.4rem" }}>
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "0.75rem",
                                        marginBottom: "0.25rem",
                                    }}>
                                        <span style={{ color: "#94a3b8" }}>Overall match</span>
                                        <span style={{
                                            color: isLowScore ? "#fb923c" : "#00c896",
                                            fontWeight: 700,
                                        }}>
                                            {Math.round(score * 100)}%
                                        </span>
                                    </div>
                                    <div style={{
                                        height: "6px",
                                        borderRadius: "999px",
                                        background: "rgba(255,255,255,0.08)",
                                    }}>
                                        <div style={{
                                            height: "100%",
                                            width: `${Math.round(score * 100)}%`,
                                            background: isLowScore
                                                ? "linear-gradient(90deg,#fb923c,#ef4444)"
                                                : "linear-gradient(90deg,#00c896,#10b981)",
                                            borderRadius: "999px",
                                            transition: "width 0.5s ease",
                                        }} />
                                    </div>
                                </div>

                                {/* Sub-score metrics */}
                                <div
                                    className="ngo-card-metrics"
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "0.25rem 0.75rem",
                                        fontSize: "0.72rem",
                                    }}
                                >
                                    <span>
                                        🧠 Semantic: {(semantic * 100).toFixed(0)}%
                                        <span style={{ color: "#64748b", fontSize: "0.65rem" }}>
                                            {" "}[{engine}]
                                        </span>
                                    </span>
                                    <span>🏷️ Sector: {(sector * 100).toFixed(0)}%</span>
                                    <span>📍 Geo: {(geo * 100).toFixed(0)}%</span>
                                    <span>🌱 Fairness: {(fairness * 100).toFixed(0)}%</span>
                                </div>

                                <div
                                    className="row-actions ngo-card-actions"
                                    style={{ marginTop: "0.75rem" }}
                                >
                                    <button
                                        className="secondary-btn"
                                        onClick={() => openDonate(ngo)}
                                    >
                                        Donate
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {results.length === 0 && (
                        <p className="muted">
                            Enter your preferences above and click{" "}
                            <strong>Find NGOs</strong>.
                        </p>
                    )}
                    {results.length > 0 && visibleResults.length === 0 && (
                        <p className="muted">
                            No NGOs match your current filters. Try clearing them.
                        </p>
                    )}
                    {usedFallback && results.length > 0 && (
                        <div className="info-banner" style={{ marginTop: "0.5rem" }}>
                            Showing all registered NGOs — AI ranking will improve as
                            more data accumulates.
                        </div>
                    )}
                </div>
            </div>

            {/* ── Donation History ── */}
            <div className="card">
                <h2>Your Donation History</h2>
                {history.length === 0 ? (
                    <p className="muted">
                        Your donation records will appear here after your first contribution.
                    </p>
                ) : (
                    <ul className="timeline">
                        {history.map((tx) => (
                            <li key={tx.id}>
                                <div className="timeline-title">
                                    {tx.ngo_name} — {tx.amount} {tx.currency}
                                </div>
                                <div className="timeline-meta">
                                    {new Date(tx.transacted_at).toLocaleString()}
                                </div>
                                {tx.description && (
                                    <div className="timeline-body">{tx.description}</div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* ── Donation Modal ── */}
            {donatingNgo && (
                <div className="modal-backdrop" onClick={() => setDonatingNgo(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Donate to {donatingNgo.name}</h2>
                        <form className="form-grid" onSubmit={submitDonation}>
                            <label>
                                Amount
                                <input
                                    type="number"
                                    value={donationForm.amount}
                                    onChange={(e) =>
                                        setDonationForm(p => ({ ...p, amount: e.target.value }))
                                    }
                                    required
                                />
                            </label>
                            <label>
                                Currency
                                <select
                                    value={donationForm.currency}
                                    onChange={(e) =>
                                        setDonationForm(p => ({ ...p, currency: e.target.value }))
                                    }
                                >
                                    <option value="INR">INR</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </label>
                            <label className="full-width">
                                Description (optional)
                                <input
                                    value={donationForm.description}
                                    onChange={(e) =>
                                        setDonationForm(p => ({
                                            ...p,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Education supplies for Q2"
                                />
                            </label>
                            <div className="row-actions full-width">
                                <button
                                    type="button"
                                    className="ghost-btn"
                                    onClick={() => setDonatingNgo(null)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn">
                                    Confirm Donation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function NetworkingDirectory({ token, requireAuth }) {
    const [ngos, setNgos] = useState([]);
    const [followeeIds, setFolloweeIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sectorFilter, setSectorFilter] = useState("ALL");
    const [selectedNgo, setSelectedNgo] = useState(null);
    const [selectedDetails, setSelectedDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [ngoRes, relRes] = await Promise.all([
                apiRequest("/ngos", "GET", undefined, token),
                token
                    ? apiRequest("/relationships/mine", "GET", undefined, token)
                    : Promise.resolve({ followee_ids: [] }),
            ]);
            setNgos(ngoRes.ngos || []);
            setFolloweeIds(relRes.followee_ids || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [token]);

    const follow   = async (userId) => { if (!requireAuth()) return; await apiRequest("/relationships/follow",   "POST", { followee_id: userId }, token); load(); };
    const unfollow = async (userId) => { if (!requireAuth()) return; await apiRequest("/relationships/unfollow", "POST", { followee_id: userId }, token); load(); };

    const openDetails = async (ngo) => {
        setSelectedNgo(ngo);
        setSelectedDetails(null);
        setDetailsLoading(true);
        try {
            // FIXED: proper function call syntax
            const res = await apiRequest(`/ngos/${ngo.id}`, "GET", undefined, token);
            setSelectedDetails(res);
        } catch (e) { console.error(e); }
        finally { setDetailsLoading(false); }
    };

    const closeDetails = () => { setSelectedNgo(null); setSelectedDetails(null); };

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const sectors = Array.from(new Set(ngos.map(n => n.sector).filter(Boolean))).sort();
    const filteredNgos = ngos.filter(ngo => {
        if (sectorFilter !== "ALL" && ngo.sector !== sectorFilter) return false;
        if (!normalizedSearch) return true;
        const haystack = `${ngo.name} ${ngo.sector} ${ngo.geographic_focus}`.toLowerCase();
        return haystack.includes(normalizedSearch);
    });

    const verifiedCount = ngos.filter(n => n.verification_status === "VERIFIED").length;
    const sectorHighlights = sectors.slice(0, 2).join(" and ") || "Impact sectors";

    return (
        <div className="networking-layout">
            <section className="card network-directory-surface">
                <div className="network-directory-head">
                    <div>
                        <h2>NGO Discovery</h2>
                        <p className="muted">Find verified partners by mission, sector, and geography.</p>
                    </div>
                    <div className="network-directory-count">{filteredNgos.length} Partners Available</div>
                </div>
                <div className="network-search-row">
                    <label className="network-search-wrap" aria-label="Search NGOs">
                        <span aria-hidden="true">🔍</span>
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Find by name, mission, or location..." />
                    </label>
                    {sectors.length > 0 && (
                        <select className="network-sector-select" value={sectorFilter}
                            onChange={(e) => setSectorFilter(e.target.value)}>
                            <option value="ALL">All Impact Sectors</option>
                            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}
                </div>
                {loading ? <p>Loading NGOs...</p> : (
                    <div className="network-cards-grid">
                        {filteredNgos.map(ngo => {
                            const isFollowing = followeeIds.includes(ngo.user_id);
                            const score = Math.max(0, Math.min(100, Number(ngo.credibility_score || 0)));
                            return (
                                <article key={ngo.id} className="network-ngo-card">
                                    <div className="network-ngo-header">
                                        <div className="avatar-circle">{getInitials(ngo.name)}</div>
                                        <div>
                                            <h3>{ngo.name}</h3>
                                            <p className="network-ngo-location">
                                                <span aria-hidden="true">📍</span>{ngo.geographic_focus}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pill-row">{renderSectorTags(ngo.sector)}</div>
                                    <div className="network-score-row">
                                        <span>Trust Score</span>
                                        {/* FIXED: dynamic className */}
                                        <span className={`pill status-${(ngo.verification_status || "").toLowerCase()}`}>
                                            {ngo.verification_status}
                                        </span>
                                    </div>
                                    <div className="network-score-value">{Math.round(score)}%</div>
                                    <div className="network-score-track" aria-hidden="true">
                                        <span className="network-score-fill" style={{ width: `${score}%` }} />
                                    </div>
                                    <div className="network-ngo-actions">
                                        {isFollowing
                                            ? <button className="secondary-btn" onClick={() => unfollow(ngo.user_id)}>Following</button>
                                            : <button className="primary-btn"   onClick={() => follow(ngo.user_id)}>Follow Partner</button>
                                        }
                                        <button type="button" className="ghost-btn" onClick={() => openDetails(ngo)}>Profile →</button>
                                    </div>
                                </article>
                            );
                        })}
                        {ngos.length === 0 && <p className="muted">No NGOs registered yet.</p>}
                        {ngos.length > 0 && filteredNgos.length === 0 && (
                            <p className="muted">No NGOs match your current search or filters.</p>
                        )}
                    </div>
                )}
            </section>
            <aside className="networking-side-stack">
                <section className="card network-side-card">
                    <h3>Your Impact Network</h3>
                    <p className="muted">Building your network improves your feed and collaboration matches.</p>
                    <div className="network-kpi-grid">
                        <div><strong>{followeeIds.length}</strong><span>Following</span></div>
                        <div><strong>{Math.min(12, followeeIds.length * 2)}</strong><span>Collaborations</span></div>
                    </div>
                </section>
                <section className="card network-side-card">
                    <h3>Platform Insights</h3>
                    <ul className="simple-list">
                        <li><strong>High Impact Sectors:</strong> {sectorHighlights} lead this week.</li>
                        <li><strong>Verified Partners:</strong> {verifiedCount} trusted NGOs available now.</li>
                        <li><strong>Regional Growth:</strong> {ngos.length} NGOs listed across your network.</li>
                    </ul>
                </section>
            </aside>
            {selectedNgo && (
                <div className="modal-backdrop" onClick={closeDetails}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedNgo.name}</h2>
                        {detailsLoading || !selectedDetails ? (
                            <p className="muted">Loading NGO profile...</p>
                        ) : (
                            <>
                                <p className="muted" style={{ marginBottom: "0.75rem" }}>{selectedDetails.mission_statement}</p>
                                <div className="pill-row" style={{ marginBottom: "0.75rem" }}>
                                    <span className="pill">Sector: {selectedDetails.sector}</span>
                                    <span className="pill">Geography: {selectedDetails.geographic_focus}</span>
                                </div>
                            </>
                        )}
                        <div className="row-actions" style={{ marginTop: "0.5rem" }}>
                            {selectedNgo && (
                                followeeIds.includes(selectedNgo.user_id)
                                    ? <button type="button" className="secondary-btn"
                                        onClick={() => { if (!requireAuth()) return; unfollow(selectedNgo.user_id); }}>Unfollow</button>
                                    : <button type="button" className="secondary-btn"
                                        onClick={() => { if (!requireAuth()) return; follow(selectedNgo.user_id); }}>Follow</button>
                            )}
                            <button type="button" className="ghost-btn" onClick={closeDetails}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SocialNetworking({ token, requireAuth, onViewDiscover }) {
    const [feed, setFeed]               = useState([]);
    const [loading, setLoading]         = useState(true);
    const [newPost, setNewPost]         = useState("");
    const [mediaUrl, setMediaUrl]       = useState("");
    const [selectedFile, setSelectedFile]     = useState(null);
    const [selectedPreview, setSelectedPreview] = useState("");
    const [uploading, setUploading]     = useState(false);
    const fileInputRef = useRef(null);

    const loadFeed = async () => {
        setLoading(true);
        try {
            const res = await apiRequest("/feed", "GET", undefined, token);
            setFeed(res.feed || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadFeed(); }, [token]);

    const pickImage = () => { if (fileInputRef.current) fileInputRef.current.click(); };

    const onFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = () => setSelectedPreview(String(reader.result || ""));
        reader.readAsDataURL(file);
    };

    const clearSelectedFile = () => {
        setSelectedFile(null);
        setSelectedPreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const uploadSelectedImage = async () => {
        if (!selectedFile) return undefined;
        const formData = new FormData();
        formData.append("file", selectedFile);
        const headers = {};
        if (token) headers["X-User-Id"] = token;
        // FIXED: proper fetch() call
        const res = await fetch(`${API_BASE}/uploads/media`, {
            method: "POST", headers, body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Image upload failed");
        return data.media_url;
    };

    const submitPost = async (e) => {
        e.preventDefault();
        try {
            if (!requireAuth()) return;
            setUploading(true);
            let resolvedMediaUrl = mediaUrl.trim() || undefined;
            if (selectedFile) resolvedMediaUrl = await uploadSelectedImage();
            await apiRequest("/posts", "POST", {
                content: newPost, media_url: resolvedMediaUrl, visibility: "PUBLIC",
            }, token);
            setNewPost(""); setMediaUrl(""); clearSelectedFile(); loadFeed();
        } catch (e) { alert(e.message); }
        finally { setUploading(false); }
    };

    // FIXED: all apiRequest calls use proper () syntax
    const likePost  = async (id) => {
        try { if (!requireAuth()) return; await apiRequest(`/posts/${id}/like`,  "POST", {}, token); loadFeed(); }
        catch (e) { alert(e.message); }
    };
    const sharePost = async (id) => {
        try { if (!requireAuth()) return; await apiRequest(`/posts/${id}/share`, "POST", {}, token); loadFeed(); }
        catch (e) { alert(e.message); }
    };
    const commentPost = async (id, text, reset) => {
        try {
            if (!requireAuth()) return;
            await apiRequest(`/posts/${id}/comments`, "POST", { comment_text: text }, token);
            reset(); loadFeed();
        } catch (e) { alert(e.message); }
    };

    const trending = [...feed].sort((a, b) => (b.like_count || 0) - (a.like_count || 0)).slice(0, 3);

    return (
        <div className="social-layout">
            <div className="social-main-column">
                <section className="card social-compose-card">
                    <h2>Share an Update</h2>
                    <p className="muted">Stories, impact reports, or funding needs</p>
                    <form onSubmit={submitPost} className="social-compose-form">
                        <input ref={fileInputRef} type="file" accept="image/*"
                            onChange={onFileChange} style={{ display: "none" }} />
                        <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)}
                            placeholder="What's happening in your impact journey?" />
                        {selectedFile && (
                            <div className="social-upload-preview">
                                {selectedPreview
                                    ? <img src={selectedPreview} alt="Selected preview" />
                                    : <div className="social-upload-fallback">Image selected</div>
                                }
                                <div className="social-upload-meta">
                                    <strong>{selectedFile.name}</strong>
                                    <span>{Math.round(selectedFile.size / 1024)} KB</span>
                                </div>
                                <button type="button" className="social-upload-clear" onClick={clearSelectedFile}>Remove</button>
                            </div>
                        )}
                        <div className="social-compose-actions">
                            <label className="social-media-input" aria-label="Media URL">
                                <span aria-hidden="true">🔗</span>
                                <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)}
                                    placeholder="Link media (Image/Video URL)" />
                            </label>
                            <button type="button" className="secondary-btn social-upload-btn" onClick={pickImage}>
                                Upload Photo
                            </button>
                            <button type="submit" className="primary-btn" disabled={uploading}>
                                {uploading ? "Posting..." : "Post Update"}
                            </button>
                        </div>
                    </form>
                </section>
                <section className="social-feed-stack">
                    {loading ? <p>Loading feed...</p> : feed.length === 0
                        ? <div className="card"><p className="muted">No posts yet. Be the first to share.</p></div>
                        : <div className="feed-list">
                            {feed.map(post => (
                                <FeedItem key={post.id} post={post}
                                    onLike={likePost} onComment={commentPost}
                                    onShare={sharePost} token={token} />
                            ))}
                        </div>
                    }
                </section>
            </div>
            <aside className="social-side-column">
                <section className="card social-side-card">
                    <h3>Trending NGOs</h3>
                    {trending.length === 0 ? <p className="muted">No trends yet.</p> : (
                        <ul className="social-trending-list">
                            {trending.map(post => {
                                const displayName = post.ngo_name || post.author_name || "NGO";
                                return (
                                    <li key={post.id}>
                                        <div className="avatar-circle avatar-small">{getInitials(displayName)}</div>
                                        <div>
                                            <strong>{displayName}</strong>
                                            <span>{post.content.slice(0, 36)}{post.content.length > 36 ? "..." : ""}</span>
                                        </div>
                                        <button type="button" className="ghost-btn" onClick={() => likePost(post.id)}>
                                            Follow
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <button type="button" className="link-btn"
                        onClick={() => onViewDiscover ? onViewDiscover() : navigate("/impact-network")}>
                        View All NGOs →
                    </button>
                </section>
                <section className="card social-side-card">
                    <h3>Impact Tips</h3>
                    <ul className="simple-list">
                        <li><strong>Be Specific:</strong> Use tags like [Urgent] for funding needs.</li>
                        <li><strong>Visuals Matter:</strong> Posts with media get higher engagement.</li>
                        <li><strong>Tag Locations:</strong> Mention city or region to attract local donors.</li>
                    </ul>
                </section>
            </aside>
        </div>
    );
}

function FeedItem({ post, onLike, onComment, onShare, token }) {
    const [comment, setComment]             = useState("");
    const [showComments, setShowComments]   = useState(false);
    const [comments, setComments]           = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);

    const loadComments = async () => {
        setLoadingComments(true);
        try {
            // FIXED: proper function call syntax
            const res = await apiRequest(`/posts/${post.id}/comments`, "GET", undefined, token);
            setComments(res.comments || []);
        } catch (e) { console.error(e); }
        finally { setLoadingComments(false); }
    };

    const displayName = post.ngo_name || post.author_name || "Community Member";

    return (
        <article className="feed-item">
            <header className="feed-header">
                <div className="feed-header-main">
                    <div className="avatar-circle avatar-small">{getInitials(displayName)}</div>
                    <div>
                        <div className="feed-title">{displayName}</div>
                        <div className="feed-meta">{new Date(post.created_at).toLocaleString()}</div>
                    </div>
                </div>
            </header>
            <p>{post.content}</p>
            {post.media_url && isImageMediaUrl(post.media_url) && (
                <img src={post.media_url} alt="Post media" className="feed-media-image" />
            )}
            {post.media_url && !isImageMediaUrl(post.media_url) && (
                <a href={post.media_url} target="_blank" rel="noreferrer" className="media-link">
                    View attached media
                </a>
            )}
            <div className="feed-actions">
                <button className="feed-action-btn" onClick={() => onLike(post.id)} aria-label="Like post">
                    <svg className="feed-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{post.like_count}</span>
                </button>
                <button className="feed-action-btn"
                    onClick={async () => { const next = !showComments; setShowComments(next); if (next) await loadComments(); }}
                    aria-label="View comments">
                    <svg className="feed-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>{post.comment_count}</span>
                </button>
                <button className="feed-action-btn" onClick={() => onShare(post.id)} aria-label="Share post">
                    <svg className="feed-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    <span>{post.share_count}</span>
                </button>
            </div>
            {showComments && (
                <div className="comments-panel">
                    {loadingComments ? <p className="muted">Loading comments...</p>
                    : comments.length === 0 ? <p className="muted">No comments yet.</p>
                    : (
                        <ul className="comments-list">
                            {comments.map(c => (
                                <li key={c.id}>
                                    <div className="comment-head">
                                        <strong>{c.user_name || "User"}</strong>
                                        <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="comment-body">{c.comment_text}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            <form className="comment-form"
                onSubmit={(e) => { e.preventDefault(); if (!comment.trim()) return; onComment(post.id, comment, () => setComment("")); }}>
                <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." />
                <button type="submit">Send</button>
            </form>
        </article>
    );
}

function GamificationPanel({ user, token }) {
    const [overview, setOverview] = useState(null);
    useEffect(() => {
        async function load() {
            try {
                const res = await apiRequest("/analytics/overview", "GET", undefined, token);
                setOverview(res);
            } catch (e) { console.error(e); }
        }
        load();
    }, [token]);

    const badges = [];
    if (overview && overview.total_amount > 0) badges.push("Impact Investor");
    if (overview && Object.keys(overview.per_sector || {}).length >= 3) badges.push("Portfolio Diversifier");
    if (user.role === "NGO") badges.push("Change Maker");
    const progressValue = overview ? Math.min(100, (overview.total_amount || 0) / 1000) : 0;

    return (
        <div className="grid-2">
            <div className="card">
                <h2>Your Impact Badges</h2>
                {badges.length === 0
                    ? <p className="muted">Donate, collaborate, and share updates to unlock badges.</p>
                    : <div className="badge-grid">{badges.map(b => <div key={b} className="badge"><span>{b}</span></div>)}</div>
                }
                <div className="progress-card">
                    <div className="progress-header">
                        <span className="muted">Engagement level</span>
                        <span className="progress-label">
                            Level {progressValue >= 80 ? "Impact Champion" : progressValue >= 40 ? "Rising Ally" : "Starter"}
                        </span>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progressValue}%` }} />
                    </div>
                </div>
            </div>
            <div className="card">
                <h2>Leaderboard (Sample)</h2>
                <ul className="leaderboard">
                    <li><span>Top Corporate Donor</span><strong>FutureTech Inc.</strong></li>
                    <li><span>Top NGO (Education)</span><strong>Rural EduCare</strong></li>
                    <li><span>Top Individual Ally</span><strong>Anonymous</strong></li>
                </ul>
            </div>
        </div>
    );
}

function AnalyticsDashboard({ token }) {
    const [data, setData] = useState(null);
    useEffect(() => {
        async function load() {
            try {
                const res = await apiRequest("/analytics/overview", "GET", undefined, token);
                setData(res);
            } catch (e) { console.error(e); }
        }
        load();
    }, [token]);

    if (!data) return <div className="card">Loading analytics...</div>;

    const maxSector = Math.max(1, ...Object.values(data.per_sector || {}).map(v => v || 0));
    const totalNgos    = Object.keys(data.per_ngo    || {}).length;
    const totalSectors = Object.keys(data.per_sector || {}).length;

    return (
        <div className="grid-2">
            <div className="card">
                <h2>Funding Overview</h2>
                <div className="summary-grid">
                    <div className="summary-card">
                        <span className="summary-label">Total tracked funding</span>
                        <span className="summary-value">{Number(data.total_amount || 0).toFixed(2)} USD</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">NGOs supported</span>
                        <span className="summary-value">{totalNgos}</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Active sectors</span>
                        <span className="summary-value">{totalSectors}</span>
                    </div>
                </div>
                <h3>By Sector</h3>
                <div className="bar-chart">
                    {Object.entries(data.per_sector || {}).map(([sector, amount]) => (
                        <div key={sector} className="bar-row">
                            <span className="bar-label">{sector}</span>
                            <div className="bar-track">
                                <div className="bar-fill" style={{ width: `${(amount / maxSector) * 100 || 5}%` }} />
                            </div>
                            <span className="bar-value">{Number(amount).toFixed(2)}</span>
                        </div>
                    ))}
                    {Object.keys(data.per_sector || {}).length === 0 && (
                        <p className="muted">No sector analytics yet.</p>
                    )}
                </div>
            </div>
            <div className="card">
                <h2>Top Supported NGOs</h2>
                <ul className="simple-list">
                    {Object.entries(data.per_ngo || {}).map(([ngo, amount]) => (
                        <li key={ngo}>
                            <span>{ngo}</span>
                            <strong>{Number(amount).toFixed(2)} USD</strong>
                        </li>
                    ))}
                    {Object.keys(data.per_ngo || {}).length === 0 && (
                        <p className="muted">No NGO-level analytics yet.</p>
                    )}
                </ul>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
//  CHATBOT  –  existing chat + NLP NGO search in two tabs
//  The original chat tab is 100% unchanged.
//  The new NLP tab is added alongside it.
// ══════════════════════════════════════════════════════════════════════════════

// Quick-reply chips for the classic chat tab (unchanged)
const QUICK_REPLIES = [
    "Tell me about NGOs",
    "How do I donate?",
    "What is AI matching?",
    "Show me analytics",
];

// Quick-query chips for the NLP tab
const NLP_QUICK_QUERIES = [
    "Find education NGOs near Mysuru",
    "Healthcare NGOs in Karnataka",
    "Grassroots women empowerment NGOs",
    "Show top 10 NGOs in India",
    "I want to donate to child welfare",
    "Environment NGOs in South India",
];

// ── Shared sub-components used by the NLP tab ────────────────────────────────

function IntentBadge({ intent }) {
    if (!intent || (!intent.sectors?.length && !intent.locations?.length)) return null;
    const confidence = Math.round((intent.confidence || 0) * 100);
    return (
        <div style={{
            background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.2)",
            borderRadius: "8px", padding: "0.4rem 0.65rem",
            fontSize: "0.7rem", display: "flex", flexWrap: "wrap",
            gap: "0.35rem", alignItems: "center", marginTop: "0.4rem",
        }}>
            <span style={{ color: "#64748b", fontWeight: 600 }}>Understood:</span>
            {(intent.sectors || []).map(s => (
                <span key={s} style={{
                    background: "#00c89618", color: "#00c896",
                    border: "1px solid #00c89640", borderRadius: "999px",
                    padding: "0.1rem 0.45rem",
                }}>🏷️ {s}</span>
            ))}
            {(intent.locations || []).map(l => (
                <span key={l} style={{
                    background: "#38bdf818", color: "#38bdf8",
                    border: "1px solid #38bdf840", borderRadius: "999px",
                    padding: "0.1rem 0.45rem",
                }}>📍 {l}</span>
            ))}
            {intent.tier_filter && (
                <span style={{
                    background: "#a78bfa18", color: "#a78bfa",
                    border: "1px solid #a78bfa40", borderRadius: "999px",
                    padding: "0.1rem 0.45rem",
                }}>
                    {intent.tier_filter === "grassroots" ? "🌱 Grassroots" : "⭐ Well-known"}
                </span>
            )}
            <span style={{ marginLeft: "auto", color: "#475569", fontSize: "0.65rem" }}>
                {confidence}% confidence
            </span>
        </div>
    );
}

function NLPResultCard({ ngo, onDonate }) {
    const score    = Math.round(Number(ngo.score || 0) * 100);
    const tier     = ngo.recognition_tier || "mid_tier";
    const tierIcon = tier === "grassroots" ? "🌱" : tier === "well_known" ? "⭐" : "🔷";
    const tags     = (ngo.sector_tags || "").replace(/\|/g, " · ");
    const location = [ngo.state, ngo.country].filter(Boolean).join(", ") || "India";
    const sem      = Math.round(Number(ngo.score_breakdown?.semantic_similarity || 0) * 100);
    const geo      = Math.round(Number(ngo.score_breakdown?.geographic_affinity  || 0) * 100);
    const fair     = Math.round(Number(ngo.score_breakdown?.fairness_boost       || 0) * 100);
    const sec      = Math.round(Number(ngo.score_breakdown?.sector_match         || 0) * 100);

    return (
        <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "10px", padding: "0.65rem 0.8rem", marginBottom: "0.45rem",
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.84rem" }}>
                    {tierIcon} {ngo.name}
                </div>
                <div style={{
                    background: score >= 70 ? "#00c89620" : "#38bdf820",
                    color:      score >= 70 ? "#00c896"   : "#38bdf8",
                    border:     `1px solid ${score >= 70 ? "#00c89640" : "#38bdf840"}`,
                    borderRadius: "999px", padding: "0.1rem 0.45rem",
                    fontSize: "0.68rem", fontWeight: 700, whiteSpace: "nowrap",
                }}>
                    {score}%
                </div>
            </div>
            <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.2rem" }}>
                📍 {location} &nbsp;|&nbsp; 🏷️ {tags || "General"}
            </div>
            {ngo.match_explanation && (
                <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontStyle: "italic", marginBottom: "0.3rem", lineHeight: 1.45 }}>
                    {ngo.match_explanation}
                </div>
            )}
            {/* Mini score bars */}
            <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                {[
                    { label: "Sem", val: sem, color: "#00c896" },
                    { label: "Sec", val: sec, color: "#38bdf8" },
                    { label: "Geo", val: geo, color: "#a78bfa" },
                    { label: "Fair",val: fair,color: "#fb923c" },
                ].map(({ label, val, color }) => (
                    <span key={label} style={{ fontSize: "0.63rem", color: "#64748b" }}>
                        <span style={{ color }}>{label}</span> {val}%
                    </span>
                ))}
            </div>
            {onDonate && (
                <button onClick={() => onDonate(ngo)} style={{
                    background: "linear-gradient(135deg,#00c896,#10b981)",
                    color: "#fff", border: "none", borderRadius: "6px",
                    padding: "0.22rem 0.65rem", fontSize: "0.7rem",
                    cursor: "pointer", fontWeight: 600,
                }}>
                    Donate →
                </button>
            )}
        </div>
    );
}

// ── Main Chatbot component ────────────────────────────────────────────────────
function Chatbot({ token }) {
    // ── Shared state ──────────────────────────────────────────────────────────
    const [isOpen,   setIsOpen]   = useState(false);
    // "chat" = original tab   |   "nlp" = new NLP search tab
    const [activeTab, setActiveTab] = useState("chat");

    // ── Classic chat tab state (unchanged) ────────────────────────────────────
    const [chatMessages, setChatMessages] = useState([
        {
            role: "assistant",
            content: "👋 Hi! I'm ImpactBot, your AI assistant. Ask me anything about NGOs, donations, or platform features!",
        },
    ]);
    const [chatInput,   setChatInput]   = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, chatLoading]);

    const sendChatMessage = async (text) => {
        const content = (text || chatInput).trim();
        if (!content || chatLoading) return;
        setChatMessages(prev => [...prev, { role: "user", content }]);
        setChatInput("");
        setChatLoading(true);
        try {
            const response = await apiRequest("/chat", "POST", { message: content });
            setChatMessages(prev => [...prev, {
                role: "assistant",
                content: response.reply || "I couldn't find a response.",
            }]);
        } catch {
            setChatMessages(prev => [...prev, {
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again.",
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    // ── NLP search tab state ──────────────────────────────────────────────────
    const [nlpMessages,   setNlpMessages]   = useState([
        {
            role: "assistant",
            content: "🧠 Ask me in plain English!\n\nExamples:\n• \"Find education NGOs near Mysuru\"\n• \"Show grassroots healthcare NGOs in Karnataka\"\n• \"I want to donate to child welfare\"",
            intent:      null,
            results:     [],
            suggestions: NLP_QUICK_QUERIES.slice(0, 3),
        },
    ]);
    const [nlpInput,      setNlpInput]      = useState("");
    const [nlpLoading,    setNlpLoading]    = useState(false);
    const [liveIntent,    setLiveIntent]    = useState(null);
    const [sessionId]                       = useState(() => `s-${Date.now()}`);
    const nlpEndRef    = useRef(null);
    const parseTimer   = useRef(null);

    // Donation state (shared between tabs)
    const [donatingNgo,  setDonatingNgo]  = useState(null);
    const [donationForm, setDonationForm] = useState({ amount: "", currency: "INR", description: "" });

    useEffect(() => {
        if (nlpEndRef.current) nlpEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, [nlpMessages, nlpLoading]);

    // Live intent preview while typing (debounced 400 ms)
    useEffect(() => {
        if (parseTimer.current) clearTimeout(parseTimer.current);
        if (!nlpInput.trim() || nlpInput.length < 4) { setLiveIntent(null); return; }
        parseTimer.current = setTimeout(async () => {
            try {
                const res = await apiRequest("/nlp/parse", "POST", { query: nlpInput });
                if (res.intent) setLiveIntent(res.intent);
            } catch (_) { /* silent */ }
        }, 400);
        return () => clearTimeout(parseTimer.current);
    }, [nlpInput]);

    const sendNlpMessage = async (text) => {
        const content = (text || nlpInput).trim();
        if (!content || nlpLoading) return;
        setNlpMessages(prev => [...prev, {
            role: "user", content, intent: null, results: [], suggestions: [],
        }]);
        setNlpInput(""); setLiveIntent(null);
        setNlpLoading(true);
        try {
            const res = await apiRequest("/nlp/chat", "POST", {
                message: content, session_id: sessionId, top_n: 5,
            });
            setNlpMessages(prev => [...prev, {
                role:        "assistant",
                content:     res.reply     || "",
                intent:      res.intent    || null,
                results:     res.results   || [],
                suggestions: res.suggestions || [],
            }]);
        } catch (err) {
            setNlpMessages(prev => [...prev, {
                role: "assistant",
                content: `Sorry — ${err.message}. Please try again.`,
                intent: null, results: [], suggestions: [],
            }]);
        } finally {
            setNlpLoading(false);
        }
    };

    // ── Donation helpers ──────────────────────────────────────────────────────
    const openDonate = async (ngo) => {
        let ngoDbId = ngo.ngo_db_id;
        if (!ngoDbId) {
            try {
                const res = await apiRequest("/ngos", "GET", undefined, token);
                const match = (res.ngos || []).find(n => n.name === ngo.name);
                ngoDbId = match?.id;
            } catch (_) {}
        }
        setDonatingNgo({ ...ngo, ngo_db_id: ngoDbId });
        setDonationForm({ amount: "", currency: "INR", description: "" });
    };

    const submitDonation = async (e) => {
        e.preventDefault();
        const amount = Number(donationForm.amount);
        if (!Number.isFinite(amount) || amount <= 0) { alert("Enter a valid amount."); return; }
        if (!donatingNgo?.ngo_db_id) { alert("NGO ID not found. Please use the Donor Portal to donate."); return; }
        try {
            await apiRequest("/transactions", "POST", {
                ngo_id:      donatingNgo.ngo_db_id,
                amount,
                currency:    donationForm.currency,
                description: donationForm.description || undefined,
            }, token);
            setDonatingNgo(null);
            // Confirm in NLP thread
            setNlpMessages(prev => [...prev, {
                role: "assistant",
                content: `✅ Donation of ${donationForm.currency} ${amount} to **${donatingNgo.name}** recorded! Thank you 🌱`,
                intent: null, results: [],
                suggestions: ["Find more NGOs to support", "Show healthcare NGOs in Mysuru"],
            }]);
        } catch (err) { alert(err.message); }
    };

    // ── Markdown-like renderer for NLP replies ────────────────────────────────
    const renderMarkdown = (text) => {
        if (!text) return null;
        const html = text
            .replace(/\*\*(.*?)\*\*/g, "<strong style='color:#e2e8f0'>$1</strong>")
            .replace(/\*(.*?)\*/g,     "<em style='color:#94a3b8'>$1</em>")
            .replace(/\n/g,            "<br/>");
        return <div style={{ lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: html }} />;
    };

    // ── Shared window chrome ──────────────────────────────────────────────────
    const tabStyle = (active) => ({
        flex: 1, padding: "0.45rem 0", fontSize: "0.75rem", fontWeight: 600,
        border: "none", cursor: "pointer", borderRadius: "8px",
        background:  active ? "rgba(0,200,150,0.18)" : "transparent",
        color:       active ? "#00c896"               : "#64748b",
        transition: "all 0.2s",
    });

    return (
        <>
            {/* ── FAB ── */}
            {!isOpen && (
                <button className="chatbot-fab" onClick={() => setIsOpen(true)} title="Chat with ImpactBot">
                    💬<span className="chatbot-fab-dot" />
                </button>
            )}

            {/* ── Chat window ── */}
            {isOpen && (
                <div className="chatbot-window" style={{ display: "flex", flexDirection: "column" }}>

                    {/* Header */}
                    <div className="chatbot-window-header">
                        <div className="chatbot-header-left">
                            <div className="chatbot-avatar-wrap">
                                {activeTab === "nlp" ? "🧠" : "🤖"}
                            </div>
                            <div>
                                <div className="chatbot-bot-name">ImpactBot</div>
                                <div className="chatbot-status">
                                    <span className="chatbot-online-dot" />
                                    <span>
                                        {activeTab === "nlp"
                                            ? "NLP Search · entity-aware"
                                            : "AI Assistant · Online"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>✕</button>
                    </div>

                    {/* Tab switcher */}
                    <div style={{
                        display: "flex", gap: "0.3rem",
                        padding: "0.5rem 0.75rem 0",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(0,0,0,0.15)",
                        flexShrink: 0,
                    }}>
                        <button style={tabStyle(activeTab === "chat")} onClick={() => setActiveTab("chat")}>
                            🤖 Chat
                        </button>
                        <button style={tabStyle(activeTab === "nlp")}  onClick={() => setActiveTab("nlp")}>
                            🧠 NLP Search
                        </button>
                    </div>

                    {/* ══ TAB: Classic Chat (100% unchanged behaviour) ══════════════ */}
                    {activeTab === "chat" && (
                        <>
                            <div className="chatbot-messages-area">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`chatbot-msg-row ${msg.role}`}>
                                        {/* FIXED: dynamic classNames */}
                                        <div className={`chatbot-msg-avatar ${msg.role}`}>
                                            {msg.role === "user" ? "👤" : "🤖"}
                                        </div>
                                        <div className={`chatbot-bubble ${msg.role}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="chatbot-msg-row assistant">
                                        <div className="chatbot-msg-avatar assistant">🤖</div>
                                        <div className="chatbot-bubble assistant chatbot-typing">
                                            <span className="chatbot-dot" />
                                            <span className="chatbot-dot" />
                                            <span className="chatbot-dot" />
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="chatbot-quick-replies">
                                {QUICK_REPLIES.map(r => (
                                    <button key={r} className="chatbot-quick-btn"
                                        onClick={() => sendChatMessage(r)}>{r}</button>
                                ))}
                            </div>
                            <div className="chatbot-input-area">
                                <input className="chatbot-text-input"
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                                    placeholder="Ask me anything..."
                                    disabled={chatLoading}
                                />
                                <button className="chatbot-send-btn"
                                    onClick={() => sendChatMessage()}
                                    disabled={chatLoading || !chatInput.trim()}>➤</button>
                            </div>
                        </>
                    )}

                    {/* ══ TAB: NLP Search ══════════════════════════════════════════ */}
                    {activeTab === "nlp" && (
                        <>
                            {/* Messages */}
                            <div className="chatbot-messages-area">
                                {nlpMessages.map((msg, idx) => (
                                    <div key={idx}>
                                        {/* Bubble */}
                                        <div style={{
                                            display: "flex",
                                            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                                            gap: "0.45rem", alignItems: "flex-start",
                                            marginBottom: "0.1rem",
                                        }}>
                                            {msg.role === "assistant" && (
                                                <div style={{
                                                    width: "24px", height: "24px", borderRadius: "50%",
                                                    background: "linear-gradient(135deg,#00c896,#10b981)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: "0.7rem", flexShrink: 0, marginTop: "3px",
                                                }}>🧠</div>
                                            )}
                                            <div style={{
                                                maxWidth: "85%",
                                                background: msg.role === "user"
                                                    ? "rgba(0,200,150,0.15)"
                                                    : "rgba(255,255,255,0.04)",
                                                border: msg.role === "user"
                                                    ? "1px solid rgba(0,200,150,0.3)"
                                                    : "1px solid rgba(255,255,255,0.08)",
                                                borderRadius: msg.role === "user"
                                                    ? "14px 14px 4px 14px"
                                                    : "4px 14px 14px 14px",
                                                padding: "0.5rem 0.75rem",
                                                color: "#cbd5e1", fontSize: "0.82rem",
                                            }}>
                                                {msg.role === "assistant"
                                                    ? renderMarkdown(msg.content)
                                                    : msg.content
                                                }
                                            </div>
                                            {msg.role === "user" && (
                                                <div style={{
                                                    width: "24px", height: "24px", borderRadius: "50%",
                                                    background: "rgba(0,200,150,0.15)",
                                                    border: "1px solid rgba(0,200,150,0.25)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: "0.7rem", flexShrink: 0, marginTop: "3px",
                                                }}>👤</div>
                                            )}
                                        </div>

                                        {/* Intent badge */}
                                        {msg.role === "assistant" && msg.intent && (
                                            <div style={{ paddingLeft: "32px" }}>
                                                <IntentBadge intent={msg.intent} />
                                            </div>
                                        )}

                                        {/* Inline NGO results */}
                                        {msg.role === "assistant" && msg.results?.length > 0 && (
                                            <div style={{ paddingLeft: "32px", marginTop: "0.45rem" }}>
                                                <div style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "0.35rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    {msg.results.length} Matched NGOs
                                                </div>
                                                {msg.results.map((ngo, i) => (
                                                    <NLPResultCard key={i} ngo={ngo}
                                                        onDonate={token ? openDonate : null} />
                                                ))}
                                            </div>
                                        )}

                                        {/* Suggestions */}
                                        {msg.role === "assistant" && msg.suggestions?.length > 0 && (
                                            <div style={{ paddingLeft: "32px", marginTop: "0.4rem", display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                                                {msg.suggestions.map((s, i) => (
                                                    <button key={i} onClick={() => sendNlpMessage(s)} style={{
                                                        fontSize: "0.65rem", padding: "0.2rem 0.55rem",
                                                        background: "rgba(0,200,150,0.08)",
                                                        border: "1px solid rgba(0,200,150,0.22)",
                                                        borderRadius: "999px", color: "#00c896", cursor: "pointer",
                                                    }}>💬 {s}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Loading dots */}
                                {nlpLoading && (
                                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", paddingLeft: "2px" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg,#00c896,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>🧠</div>
                                        <div style={{ display: "flex", gap: "4px", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px 14px 14px 14px" }}>
                                            {[0, 1, 2].map(i => (
                                                <div key={i} style={{
                                                    width: "5px", height: "5px", borderRadius: "50%", background: "#00c896",
                                                    animation: `nlpDot 1.2s ${i * 0.2}s infinite`,
                                                }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div ref={nlpEndRef} />
                            </div>

                            {/* Live entity preview */}
                            {liveIntent && (liveIntent.sectors?.length > 0 || liveIntent.locations?.length > 0) && (
                                <div style={{ padding: "0 0.75rem 0.25rem", flexShrink: 0 }}>
                                    <IntentBadge intent={liveIntent} />
                                </div>
                            )}

                            {/* Quick query chips */}
                            <div style={{
                                padding: "0.4rem 0.75rem 0",
                                display: "flex", gap: "0.3rem", flexWrap: "nowrap",
                                overflowX: "auto", flexShrink: 0,
                                borderTop: "1px solid rgba(255,255,255,0.05)",
                            }}>
                                {NLP_QUICK_QUERIES.map(q => (
                                    <button key={q} onClick={() => sendNlpMessage(q)}
                                        disabled={nlpLoading} style={{
                                            fontSize: "0.62rem", padding: "0.22rem 0.5rem",
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.09)",
                                            borderRadius: "999px", color: "#94a3b8",
                                            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                                        }}>
                                        {q}
                                    </button>
                                ))}
                            </div>

                            {/* Input */}
                            <div style={{ padding: "0.6rem 0.75rem 0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "0.45rem", flexShrink: 0 }}>
                                <input
                                    value={nlpInput}
                                    onChange={e => setNlpInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendNlpMessage()}
                                    placeholder="Ask in plain English…"
                                    disabled={nlpLoading}
                                    style={{
                                        flex: 1, background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "10px", padding: "0.5rem 0.75rem",
                                        color: "#e2e8f0", fontSize: "0.82rem", outline: "none",
                                    }}
                                    onFocus={e  => e.target.style.borderColor = "rgba(0,200,150,0.5)"}
                                    onBlur={e   => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                                />
                                <button onClick={() => sendNlpMessage()} disabled={nlpLoading || !nlpInput.trim()} style={{
                                    background: nlpInput.trim() && !nlpLoading
                                        ? "linear-gradient(135deg,#00c896,#10b981)"
                                        : "rgba(255,255,255,0.06)",
                                    border: "none", borderRadius: "10px",
                                    width: "38px", height: "38px",
                                    color: nlpInput.trim() && !nlpLoading ? "#fff" : "#475569",
                                    cursor: nlpInput.trim() && !nlpLoading ? "pointer" : "not-allowed",
                                    fontSize: "0.95rem", flexShrink: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.2s",
                                }}>➤</button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Donation modal (works from either tab) ── */}
            {donatingNgo && (
                <div className="modal-backdrop" onClick={() => setDonatingNgo(null)} style={{ zIndex: 1100 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "360px" }}>
                        <h2>Donate to {donatingNgo.name}</h2>
                        {donatingNgo.match_explanation && (
                            <p className="muted" style={{ fontSize: "0.78rem", marginBottom: "0.75rem" }}>
                                {donatingNgo.match_explanation}
                            </p>
                        )}
                        <form className="form-grid" onSubmit={submitDonation}>
                            <label>Amount
                                <input type="number" value={donationForm.amount}
                                    onChange={e => setDonationForm(p => ({ ...p, amount: e.target.value }))}
                                    placeholder="e.g. 500" required />
                            </label>
                            <label>Currency
                                <select value={donationForm.currency}
                                    onChange={e => setDonationForm(p => ({ ...p, currency: e.target.value }))}>
                                    <option value="INR">INR ₹</option>
                                    <option value="USD">USD $</option>
                                    <option value="EUR">EUR €</option>
                                    <option value="GBP">GBP £</option>
                                </select>
                            </label>
                            <label className="full-width">Note (optional)
                                <input value={donationForm.description}
                                    onChange={e => setDonationForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="e.g. For girls education program" />
                            </label>
                            <div className="row-actions full-width">
                                <button type="button" className="ghost-btn" onClick={() => setDonatingNgo(null)}>Cancel</button>
                                <button type="submit" className="primary-btn">Confirm Donation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Animation keyframes */}
            <style>{`
                @keyframes nlpDot {
                    0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
                    40%           { opacity: 1.0; transform: scale(1.1); }
                }
            `}</style>
        </>
    );
}

// ── rest of components (unchanged) ───────────────────────────────────────────

const ALL_TESTIMONIALS = [
    { name: "Priya Sharma",      role: "Corporate CSR Head",     org: "TechBridge Corp",         text: "The AI matching saved us weeks of research. We found three perfect NGO partners within hours.",                                                  initials: "PS", color: "#00c896" },
    { name: "Dr. Arjun Mehta",   role: "NGO Founder",            org: "EduReach Foundation",     text: "As a small NGO, visibility was our biggest challenge. This platform gave us credibility scoring and connected us with donors we never would have found.", initials: "AM", color: "#10b981" },
    { name: "Sunita Rao",        role: "Individual Contributor", org: "Impact Champion",         text: "The gamification and social feed make giving feel meaningful. I can track exactly how my donations are used.",                                    initials: "SR", color: "#00b894" },
    { name: "Karthik Nair",      role: "CSR Manager",            org: "Infosys Foundation",      text: "We used to spend months vetting NGOs manually. The credibility score and sector filters let us shortlist quality partners in minutes.",          initials: "KN", color: "#38bdf8" },
    { name: "Meena Iyer",        role: "Executive Director",     org: "GreenShores Trust",       text: "After joining this platform our donation inflow grew by 60% in six months.",                                                                    initials: "MI", color: "#a78bfa" },
    { name: "Rahul Verma",       role: "Social Impact Lead",     org: "Paytm Foundation",        text: "The networking directory helped us find three complementary NGOs for a joint project.",                                                          initials: "RV", color: "#fb923c" },
    { name: "Anjali Desai",      role: "Volunteer Coordinator",  org: "Teach For India",         text: "Managing volunteer sign-ups used to be chaos. The portal streamlined everything.",                                                               initials: "AD", color: "#00c896" },
    { name: "Vikram Singh",      role: "Philanthropist",         org: "Singh Family Foundation", text: "I donate to eight different NGOs and this is the first platform that lets me track all from a single dashboard.",                               initials: "VS", color: "#10b981" },
    { name: "Dr. Lakshmi Reddy", role: "Programme Officer",      org: "CARE India",              text: "We received expressions of interest from four corporate donors within two weeks of publishing our grant request.",                               initials: "LR", color: "#00b894" },
    { name: "Nikhil Bose",       role: "Co-founder",             org: "RuralTech Initiative",    text: "As a rural-focused NGO, the AI matching actually brought us to donors who cared about our specific geography.",                                  initials: "NB", color: "#38bdf8" },
    { name: "Farah Khan",        role: "Head of Partnerships",   org: "Reliance Foundation",     text: "We have partnered with eleven NGOs through this platform. The transparency in credibility scoring makes decision-making straightforward.",       initials: "FK", color: "#a78bfa" },
    { name: "Shanthi Pillai",    role: "Beneficiary Advocate",   org: "Akshaya Patra",           text: "Engagement from our network has more than doubled since we started posting here.",                                                               initials: "SP", color: "#fb923c" },
];

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function Home({ goto, token }) {
    const [visibleIdx, setVisibleIdx] = React.useState(0);
    const [shuffled] = React.useState(() => shuffleArray(ALL_TESTIMONIALS));
    const shown = shuffled.slice(0, 3);
    React.useEffect(() => {
        const id = setInterval(() => setVisibleIdx(v => (v + 1) % shown.length), 4000);
        return () => clearInterval(id);
    }, [shown.length]);
    return (
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-content-modern">
                    <div className="hero-badge-chip">✨ AI-Powered NGO Platform</div>
                    <h2 className="hero-title">Empower Change,<br />Together</h2>
                    <p className="hero-tagline">
                        A modern, unified platform bridging the gap between NGOs, corporate donors, and individual contributors.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-modern btn-primary" onClick={() => goto("/login")}>Get Started / Log In</button>
                        <button className="btn-modern btn-secondary" onClick={() => goto("/networking", { requireLogin: true })}>Explore NGOs →</button>
                    </div>
                </div>
                <div className="hero-illustration-modern">
                    <div className="glass-shape shape-1" /><div className="glass-shape shape-2" /><div className="glass-shape shape-3" />
                </div>
            </section>
            <section className="impact-counters">
                <div className="counter-card glass-card"><h3>50+</h3><p>NGOs in Network</p></div>
                <div className="counter-card glass-card"><h3>15+</h3><p>Impact Sectors</p></div>
                <div className="counter-card glass-card"><h3>AI Powered</h3><p>Matching Algorithm</p></div>
            </section>
            <section className="how-it-works-modern">
                <h2 className="section-title">How It Works</h2>
                <p className="section-subtitle">Three simple steps to amplify your social impact</p>
                <div className="steps-grid">
                    {[
                        { icon: "🎯", step: "Step 1", title: "Set your intent",   desc: "Specify causes, geographies, and budgets." },
                        { icon: "🤝", step: "Step 2", title: "Match with Needs",  desc: "Our AI engine surfaces aligned opportunities." },
                        { icon: "📈", step: "Step 3", title: "Track Real Impact", desc: "Analytics and stories evidence your outcomes." },
                    ].map((s, i) => (
                        <div key={i} className="step-card glass-card">
                            <div className="step-icon">{s.icon}</div>
                            <div className="step-number">{s.step}</div>
                            <h3>{s.title}</h3><p>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
            <section className="features-section">
                <div className="features-header">
                    <h2 className="section-title">Everything You Need</h2>
                    <p className="section-subtitle">Built for NGOs, donors, and contributors</p>
                </div>
                <div className="features-grid">
                    {[
                        { icon: "⚡", title: "AI-Powered Matching",  desc: "SBERT semantic matching with fairness boosts.",        color: "#00c896" },
                        { icon: "🛡️", title: "Verified NGOs",         desc: "Credibility-scored organisations you can trust.",      color: "#10b981" },
                        { icon: "🌍", title: "Global Reach",           desc: "Connect across 50+ countries and impact sectors.",    color: "#00b894" },
                        { icon: "👥", title: "Community Driven",       desc: "Social feed, networking, and gamification.",          color: "#00c896" },
                        { icon: "📊", title: "Real-time Analytics",    desc: "Track donations and measure impact.",                 color: "#059669" },
                        { icon: "❤️", title: "Multiple Giving Modes",  desc: "One-time, recurring, or grant applications.",         color: "#00b894" },
                    ].map((f, i) => (
                        <div key={i} className="feature-card glass-card">
                            <div className="feature-icon-wrap" style={{ background: f.color + "18", color: f.color }}>
                                <span style={{ fontSize: "1.3rem" }}>{f.icon}</span>
                            </div>
                            <h3 className="feature-title">{f.title}</h3>
                            <p className="feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
            <section className="testimonials-section">
                <h2 className="section-title">Voices of Impact</h2>
                <p className="section-subtitle">Real stories from our community</p>
                <div className="testimonials-grid">
                    {shown.map((t, i) => (
                        <div key={i} className="testimonial-card glass-card" style={{
                            transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
                            transform:   visibleIdx === i ? "translateY(-6px)" : "translateY(0)",
                            borderColor: visibleIdx === i ? `${t.color}55` : undefined,
                            boxShadow:   visibleIdx === i ? `0 20px 40px ${t.color}22` : undefined,
                        }}>
                            <div className="testimonial-header">
                                <div className="testimonial-avatar" style={{ background: t.color }}>{t.initials}</div>
                                <div>
                                    <div className="testimonial-name">{t.name}</div>
                                    <div className="testimonial-role">{t.role} · {t.org}</div>
                                </div>
                            </div>
                            <p className="testimonial-text">"{t.text}"</p>
                            <div className="testimonial-stars">★★★★★</div>
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
                    {shown.map((_, i) => (
                        <button key={i} onClick={() => setVisibleIdx(i)} style={{
                            width: visibleIdx === i ? "20px" : "8px", height: "8px",
                            borderRadius: "999px", border: "none",
                            background: visibleIdx === i ? "#00c896" : "rgba(255,255,255,0.2)",
                            cursor: "pointer", transition: "all 0.3s ease", padding: 0,
                        }} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function ImpactNetwork({ token, requireAuth, initialTab = "feed" }) {
    const [tab, setTab] = useState(initialTab);
    useEffect(() => { setTab(initialTab); }, [initialTab]);
    return (
        <section className="impact-network-page">
            <div className="impact-network-top">
                <div className="impact-network-brand">
                    <span className="impact-network-brand-icon" aria-hidden="true">🌐</span>
                    <div><h2>Impact Network</h2><p>Social collaboration for NGOs and donors</p></div>
                </div>
                <div className="impact-network-tabs" role="tablist" aria-label="Impact Network Views">
                    <button type="button" role="tab" aria-selected={tab === "feed"}
                        className={tab === "feed" ? "impact-tab active" : "impact-tab"}
                        onClick={() => setTab("feed")}>Feed</button>
                    <button type="button" role="tab" aria-selected={tab === "discover"}
                        className={tab === "discover" ? "impact-tab active" : "impact-tab"}
                        onClick={() => setTab("discover")}>Discover NGO</button>
                </div>
            </div>
            {tab === "feed"
                ? <SocialNetworking token={token} requireAuth={requireAuth} onViewDiscover={() => setTab("discover")} />
                : <NetworkingDirectory token={token} requireAuth={requireAuth} />
            }
        </section>
    );
}

function AppShell() {
    const [user,  setUser]  = useState(null);
    const [token, setToken] = useState(null);
    const [route, setRoute] = useState(getHashRoute());
    const [toast, setToast] = useState(null);

    const handleAuthenticated = (u, t) => {
        setUser(u); setToken(t);
        setToast({ type: "success", message: `Welcome, ${u.name}.` });
        navigate("/home");
    };
    const logout = () => {
        setUser(null); setToken(null);
        setToast({ type: "info", message: "You have been logged out." });
        navigate("/home");
    };

    useEffect(() => {
        const onHashChange = () => setRoute(getHashRoute());
        window.addEventListener("hashchange", onHashChange);
        if (!window.location.hash) navigate("/home");
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    const requireAuth = () => {
        if (token) return true;
        setToast({ type: "warning", message: "Please login to continue." });
        navigate("/login");
        return false;
    };

    const goto = (path, { requireLogin = false } = {}) => {
        if (requireLogin && !token) {
            setToast({ type: "warning", message: "Please login to access that page." });
            navigate("/login");
            return;
        }
        navigate(path);
    };

    return (
        <div className="app-shell">
            <Toast toast={toast} onClose={() => setToast(null)} />
            <header className="top-bar">
                <div className="branding">
                    <h1>Unified Impact Platform</h1>
                    <p>Bridging NGOs, corporate donors, and individual allies through <strong>real-time collaboration</strong>.</p>
                </div>
                <nav className="main-nav">
                    {[
                        { label: "Home",           path: "/home" },
                        { label: "Login",          path: "/login" },
                        { label: "NGO Portal",     path: "/ngo-portal" },
                        { label: "Donor Portal",   path: "/donor-portal" },
                        { label: "Impact Network", path: "/impact-network" },
                        //{ label: "Gamification",   path: "/gamification" },
                        //{ label: "Analytics",      path: "/analytics" },
                        { label: "Crisis Response", path: "/crisis" },
                    ].map(({ label, path }) => (
                        <button
                            key={path}
                            className={route === path ? "nav-btn active" : "nav-btn"}
                            onClick={() => {
                                if (path === "/crisis") { goto(path); return; }
                                if (path === "/home" || path === "/login") { goto(path); return; }
                                if (path === "/ngo-portal") {
                                    if (!requireAuth()) return;
                                    if (user?.role !== "NGO") {
                                        setToast({ type: "warning", message: "NGO Portal is only for NGO accounts." });
                                        return;
                                    }
                                    goto(path); return;
                                }
                                if (path === "/donor-portal") {
                                    if (!requireAuth()) return;
                                    if (user?.role === "NGO") {
                                        setToast({ type: "warning", message: "Donor Portal is for Corporate/Individual accounts." });
                                        return;
                                    }
                                    goto(path); return;
                                }
                                goto(path, { requireLogin: true });
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </nav>
                {user && (
                    <div className="user-pill">
                        <span>{user.name}</span>
                        <span className="role">{user.role}</span>
                        <button onClick={logout}>Logout</button>
                    </div>
                )}
            </header>
            <main className="page">
                {route === "/home"         && <Home goto={goto} token={token} />}
                {route === "/login"        && (
                    <div className="login-page">
                        <div className="login-page-left">
                            <div className="login-left-inner">
                                <div className="login-left-logo">
                                    <span className="login-left-logo-icon">🌐</span>
                                    <span className="login-left-logo-name">Unified Impact Platform</span>
                                </div>
                                <h2 className="login-left-headline">
                                    Bridge the gap.<br />
                                    <span className="login-left-headline-accent">Amplify impact.</span>
                                </h2>
                                <p className="login-left-desc">
                                    Connect NGOs, corporate donors, and individual contributors through AI-powered matching.
                                </p>
                                <ul className="login-left-features">
                                    {[
                                        { icon: "⚡", title: "AI Matching Engine", desc: "Fairness-aware SBERT algorithm connects you with the right partners" },
                                        { icon: "🛡️", title: "Verified NGOs",      desc: "Credibility-scored organizations you can trust" },
                                        { icon: "📊", title: "Real-time Impact",   desc: "Track exactly where your contributions go" },
                                    ].map((f, i) => (
                                        <li key={i}>
                                            <span className="login-feat-icon">{f.icon}</span>
                                            <div>
                                                <strong>{f.title}</strong>
                                                <span>{f.desc}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="login-deco-circle login-deco-1" />
                                <div className="login-deco-circle login-deco-2" />
                                <div className="login-deco-circle login-deco-3" />
                            </div>
                        </div>
                        <div className="login-page-right">
                            <AuthPanel onAuthenticated={handleAuthenticated} defaultMode="login" />
                        </div>
                    </div>
                )}
                {route === "/ngo-portal"     && user && user.role === "NGO"  && <NGOPortal user={user} token={token} />}
                {route === "/donor-portal"   && user && user.role !== "NGO"  && <DonorPortal user={user} token={token} />}
                {route === "/impact-network" && <ImpactNetwork token={token} requireAuth={requireAuth} initialTab="feed" />}
                {route === "/networking"     && <ImpactNetwork token={token} requireAuth={requireAuth} initialTab="discover" />}
                {route === "/social-feed"    && <ImpactNetwork token={token} requireAuth={requireAuth} initialTab="feed" />}
                {route === "/gamification"   && user && <GamificationPanel user={user} token={token} />}
                {route === "/analytics"      && user && <AnalyticsDashboard token={token} />}
                {route === "/crisis" && <CrisisResponsePage user={user} token={token} />}
            </main>
            {/* CHANGED: pass token so the NLP tab can offer Donate buttons */}
            <Chatbot token={token} />
            <footer className="footer">
                <span>© {new Date().getFullYear()} Unified Digital Impact Platform</span>
            </footer>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppShell />);
