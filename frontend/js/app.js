const { useState, useEffect } = React;

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
                <span className="pill-icon" aria-hidden="true">
                    {getSectorIcon(tag)}
                </span>
                {tag}
            </span>
        ));
}

function getInitials(name) {
    if (!name) return "?";
    const parts = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
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

async function apiRequest(path, method = "GET", body, token) {
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["X-User-Id"] = token;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Request failed");
    }
    return data;
}

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
            <button onClick={onClose} aria-label="Dismiss">
                ×
            </button>
        </div>
    );
}

function AuthPanel({ onAuthenticated, defaultMode = "login" }) {
    const [mode, setMode] = useState("login");
    const [role, setRole] = useState("INDIVIDUAL");
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        organization_name: "",
        mission_statement: "",
        sector: "",
        geographic_focus: "",
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
                const res = await apiRequest("/auth/login", "POST", { email: form.email, password: form.password });
                onAuthenticated(res.user, res.token);
            } else {
                const payload = { name: form.name, email: form.email, password: form.password, role, organization_name: form.organization_name };
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
            {/* Gradient Header */}
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

            {/* Tabs */}
            <div className="auth-v2-tabs">
                <button
                    className={mode === "login" ? "auth-v2-tab active" : "auth-v2-tab"}
                    onClick={() => setMode("login")}
                    type="button"
                >
                    Login
                </button>
                <button
                    className={mode === "register" ? "auth-v2-tab active" : "auth-v2-tab"}
                    onClick={() => setMode("register")}
                    type="button"
                >
                    Register
                </button>
            </div>

            <form className="auth-v2-form" onSubmit={handleSubmit}>
                {/* Register: Role Picker */}
                {mode === "register" && (
                    <div className="auth-v2-role-section">
                        <div className="auth-v2-label-small">I am a...</div>
                        <div className="auth-v2-role-grid">
                            {roleOptions.map(r => (
                                <button
                                    key={r.value}
                                    type="button"
                                    className={role === r.value ? "auth-v2-role-card active" : "auth-v2-role-card"}
                                    onClick={() => setRole(r.value)}
                                >
                                    <span className="auth-v2-role-icon">{r.icon}</span>
                                    <span className="auth-v2-role-label">{r.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Register: Name + Org */}
                {mode === "register" && (
                    <>
                        <div className="auth-v2-input-wrap">
                            <span className="auth-v2-input-icon">👤</span>
                            <input
                                className="auth-v2-input"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Full name"
                                required
                            />
                        </div>
                        <div className="auth-v2-input-wrap">
                            <span className="auth-v2-input-icon">🏢</span>
                            <input
                                className="auth-v2-input"
                                name="organization_name"
                                value={form.organization_name}
                                onChange={handleChange}
                                placeholder="Organization name (optional)"
                            />
                        </div>
                    </>
                )}

                {/* Email */}
                <div className="auth-v2-input-wrap">
                    <span className="auth-v2-input-icon">✉️</span>
                    <input
                        className="auth-v2-input"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email address"
                        required
                    />
                </div>

                {/* Password */}
                <div className="auth-v2-input-wrap">
                    <span className="auth-v2-input-icon">🔒</span>
                    <input
                        className="auth-v2-input"
                        type={showPass ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Password"
                        required
                    />
                    <button
                        type="button"
                        className="auth-v2-eye-btn"
                        onClick={() => setShowPass(s => !s)}
                        tabIndex={-1}
                    >
                        {showPass ? "🙈" : "👁️"}
                    </button>
                </div>

                {/* Forgot password */}
                {mode === "login" && (
                    <div className="auth-v2-forgot">
                        <button type="button" className="auth-v2-text-link">Forgot password?</button>
                    </div>
                )}

                {/* NGO extra fields */}
                {mode === "register" && role === "NGO" && (
                    <div className="auth-v2-ngo-extras">
                        <div className="auth-v2-section-divider">
                            <span>NGO Details</span>
                        </div>
                        <div className="auth-v2-input-wrap">
                            <span className="auth-v2-input-icon">📋</span>
                            <textarea
                                className="auth-v2-input auth-v2-textarea"
                                name="mission_statement"
                                value={form.mission_statement}
                                onChange={handleChange}
                                placeholder="Mission statement..."
                                required
                            />
                        </div>
                        <div className="auth-v2-input-wrap">
                            <span className="auth-v2-input-icon">🏷️</span>
                            <input
                                className="auth-v2-input"
                                name="sector"
                                value={form.sector}
                                onChange={handleChange}
                                placeholder="Sector (e.g. Education, Health)"
                                required
                            />
                        </div>
                        <div className="auth-v2-input-wrap">
                            <span className="auth-v2-input-icon">📍</span>
                            <input
                                className="auth-v2-input"
                                name="geographic_focus"
                                value={form.geographic_focus}
                                onChange={handleChange}
                                placeholder="Geographic focus (city / region / country)"
                                required
                            />
                        </div>
                    </div>
                )}

                {error && <div className="auth-v2-error">{error}</div>}

                <button type="submit" className="auth-v2-submit" disabled={loading}>
                    {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
                </button>

                <p className="auth-v2-switch">
                    {mode === "login" ? (
                        <>Don't have an account? <button type="button" className="auth-v2-text-link bold" onClick={() => setMode("register")}>Register</button></>
                    ) : (
                        <>Already have an account? <button type="button" className="auth-v2-text-link bold" onClick={() => setMode("login")}>Login</button></>
                    )}
                </p>
            </form>
        </div>
    );
}

function NGOPortal({ user, token }) {
    const [profile, setProfile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

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
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!profile) return;
        setSaving(true);
        setMessage(null);
        try {
            await apiRequest(
                `/ngos/${profile.id}`,
                "PUT",
                {
                    mission_statement: profile.mission_statement,
                    sector: profile.sector,
                    geographic_focus: profile.geographic_focus,
                },
                token
            );
            setMessage("Profile updated and credibility recalculated.");
        } catch (err) {
            setMessage(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!profile) {
        return <div className="card">Loading NGO profile...</div>;
    }

    return (
        <>
            <div className="grid-2">
                <div className="card">
                    <h2>NGO Profile</h2>
                    <form className="form-grid" onSubmit={handleSave}>
                        <label className="full-width">
                            Mission Statement
                            <textarea
                                name="mission_statement"
                                value={profile.mission_statement}
                                onChange={handleChange}
                            />
                        </label>
                        <label>
                            Sector
                            <input
                                name="sector"
                                value={profile.sector}
                                onChange={handleChange}
                            />
                        </label>
                        <label>
                            Geographic Focus
                            <input
                                name="geographic_focus"
                                value={profile.geographic_focus}
                                onChange={handleChange}
                            />
                        </label>
                        <div className="pill-row">
                            <span className={`pill status-${profile.verification_status.toLowerCase()}`}>
                                {profile.verification_status}
                            </span>
                            <span className="pill">
                                Credibility: {profile.credibility_score.toFixed(1)} / 100
                            </span>
                        </div>
                        <button type="submit" className="primary-btn" disabled={saving}>
                            {saving ? "Saving..." : "Save Profile"}
                        </button>
                        {message && <div className="info-banner">{message}</div>}
                    </form>
                </div>
                <NGOPosts token={token} />
            </div>
            <NgoDirectoryInsights token={token} />
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
                postType === "GRANT_REQUEST"
                    ? "Grant Request"
                    : postType === "FUNDING_REQUIREMENT"
                    ? "Funding Requirement"
                    : "Update";
            const payloadContent = `[${friendlyLabel}] ${content.trim()}`;

            await apiRequest(
                "/posts",
                "POST",
                {
                    content: payloadContent,
                    media_url: mediaUrl || undefined,
                    visibility: "PUBLIC",
                },
                token
            );
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
                Publish specific funding requirements, grant asks, or general impact updates so donors can
                quickly understand how to support your work.
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
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Example: We are seeking a PKR 500,000 grant to expand our after‑school program to 3 more districts over the next 12 months..."
                        required
                    />
                </label>
                <label className="full-width">
                    Media URL (optional)
                    <input
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="Link to images, videos, or reports"
                    />
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

    // Build state → count and sector → count from live data
    const stateCounts = {};
    const sectorCounts = {};
    ngos.forEach(ngo => {
        // geographic_focus is seeded as "State, Country" or "Global"
        const geo = (ngo.geographic_focus || "Global");
        const statePart = geo.split(",")[0].trim();
        const stateKey = (statePart === "Global" || statePart === "") ? "Global" : statePart;
        stateCounts[stateKey] = (stateCounts[stateKey] || 0) + 1;

        // sector is pipe-separated tags e.g. "Education|Healthcare|Community Development"
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

    // Region color coding
    const regionColors = {
        "Karnataka": "#00c896",  "Tamil Nadu": "#00c896",  "Andhra Pradesh": "#00b894",
        "Telangana": "#00b894",  "Kerala": "#10b981",
        "Delhi": "#0ea5e9",      "Rajasthan": "#38bdf8",   "Uttar Pradesh": "#38bdf8",
        "Haryana": "#7dd3fc",    "Punjab": "#7dd3fc",
        "Maharashtra": "#a78bfa", "Gujarat": "#c084fc",
        "West Bengal": "#fb923c", "Odisha": "#f97316",
        "Madhya Pradesh": "#fbbf24",
        "Global": "#64748b",
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
                    borderRadius: "999px",
                    transition: "width 0.7s ease",
                }} />
            </div>
        </div>
    );

    return (
        <div className="card" style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "1.25rem" }}>NGO Directory Insights</h2>
                    <p className="muted" style={{ margin: "0.2rem 0 0" }}>Live distribution from the verified NGO catalog</p>
                </div>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    {[
                        { label: "Total NGOs",   value: totalNGOs,    color: "#00c896" },
                        { label: "States / Regions", value: totalStates,  color: "#38bdf8" },
                        { label: "Sectors",       value: totalSectors, color: "#a78bfa" },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: `${s.color}18`,
                            border: `1px solid ${s.color}38`,
                            borderRadius: "12px",
                            padding: "0.45rem 1rem",
                            textAlign: "center",
                            minWidth: "80px",
                        }}>
                            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "0.2rem" }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2.5rem" }}>
                {/* Geographic distribution */}
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
                            { label: "South India",  color: "#00c896" },
                            { label: "North India",  color: "#38bdf8" },
                            { label: "West India",   color: "#a78bfa" },
                            { label: "East India",   color: "#fb923c" },
                            { label: "Global",       color: "#64748b" },
                        ].map((r, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.7rem", color: "#94a3b8" }}>
                                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                                {r.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sector breakdown */}
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
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [token]);

    const allSectors = Array.from(
        new Set(
            ngos.flatMap((ngo) =>
                (ngo.sector || "")
                    .split("|")
                    .map((s) => s.trim())
                    .filter(Boolean)
            )
        )
    ).sort();

    const allCountries = Array.from(
        new Set(
            ngos
                .map((ngo) => {
                    const geo = ngo.geographic_focus || "";
                    const parts = geo.split(",");
                    const country = parts.length > 1 ? parts[parts.length - 1] : parts[0];
                    return (country || "").trim();
                })
                .filter(Boolean)
        )
    ).sort();

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filteredNgos = ngos.filter((ngo) => {
        if (sectorFilter !== "ALL") {
            const tags = (ngo.sector || "")
                .split("|")
                .map((s) => s.trim())
                .filter(Boolean);
            if (!tags.includes(sectorFilter)) {
                return false;
            }
        }

        if (countryFilter !== "ALL") {
            const geo = ngo.geographic_focus || "";
            const parts = geo.split(",");
            const country = (parts.length > 1 ? parts[parts.length - 1] : parts[0] || "").trim();
            if (country !== countryFilter) {
                return false;
            }
        }

        if (!normalizedSearch) {
            return true;
        }

        const haystack = `${ngo.name} ${ngo.sector} ${ngo.geographic_focus} ${
            ngo.description || ""
        }`.toLowerCase();
        return haystack.includes(normalizedSearch);
    });

    return (
        <div className="card">
            <h2>NGO Landscape Dashboard</h2>
            <p className="muted">
                Explore the NGO catalog used by the AI matching engine, with sector tags and
                geographic coverage.
            </p>
            <div className="row-actions" style={{ margin: "0.75rem 0" }}>
                <input
                    style={{ flex: 1, minWidth: "180px" }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by NGO name, sector tag, or location..."
                />
                {allSectors.length > 0 && (
                    <select
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                    >
                        <option value="ALL">All sectors</option>
                        {allSectors.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                )}
                {allCountries.length > 0 && (
                    <select
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                    >
                        <option value="ALL">All countries</option>
                        {allCountries.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <p className="muted" style={{ fontSize: "0.78rem" }}>
                Showing {filteredNgos.length} of {ngos.length} NGOs
            </p>
            {loading ? (
                <p>Loading NGO catalog...</p>
            ) : (
                <div className="results-grid">
                    {filteredNgos.map((ngo) => {
                        const geo = ngo.geographic_focus || "";
                        const parts = geo.split(",");
                        const state = (parts[0] || "").trim();
                        const country =
                            (parts.length > 1 ? parts[parts.length - 1] : parts[0] || "").trim();
                        const tags = (ngo.sector || "")
                            .split("|")
                            .map((s) => s.trim())
                            .filter(Boolean);

                        return (
                            <div key={ngo.id} className="card subtle">
                                <h3>{ngo.name}</h3>
                                {ngo.description && (
                                    <p className="muted" style={{ marginBottom: "0.5rem" }}>
                                        {ngo.description}
                                    </p>
                                )}
                                <div className="pill-row">
                                    {tags.map((tag) => (
                                        <span key={tag} className="pill">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <p style={{ marginTop: "0.5rem" }}>
                                    <strong>Location:</strong>{" "}
                                    {state && country ? `${state}, ${country}` : geo || "N/A"}
                                </p>
                                <div className="pill-row" style={{ marginTop: "0.5rem" }}>
                                    <span
                                        className={`pill status-${ngo.verification_status.toLowerCase()}`}
                                    >
                                        {ngo.verification_status}
                                    </span>
                                    <span className="pill">
                                        Credibility: {Number(ngo.credibility_score).toFixed(1)} / 100
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {!loading && ngos.length === 0 && (
                        <p className="muted">No NGOs are registered in the catalog yet.</p>
                    )}
                    {!loading && ngos.length > 0 && filteredNgos.length === 0 && (
                        <p className="muted">
                            No NGOs match your current search or filters. Try broadening them.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function DonorPortal({ user, token }) {
    const [prefs, setPrefs] = useState({
        cause: "",
        location: "",
        min_budget: "",
        max_budget: "",
    });
    const [results, setResults] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [donatingNgo, setDonatingNgo] = useState(null);
    const [donationForm, setDonationForm] = useState({
        amount: "",
        currency: "USD",
        description: "",
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("final_score");
    const [usedFallback, setUsedFallback] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPrefs((prev) => ({ ...prev, [name]: value }));
    };

    const handleMatch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setUsedFallback(false);
        try {
            const res = await apiRequest("/recommendations", "POST", prefs, token);
            const recs = res.recommendations || [];
            if (recs.length > 0) {
                setResults(recs);
            } else {
                // If the AI engine has no data to work with yet (e.g. no NGOs
                // or no training history), gracefully fall back to all
                // registered NGOs so users still see useful options.
                const ngoRes = await apiRequest("/ngos", "GET", undefined, token);
                const raw = ngoRes.ngos || [];
                const mapped = raw.map((n, idx) => ({
                    ngo_id: n.id,
                    name: n.name,
                    sector: n.sector,
                    geographic_focus: n.geographic_focus,
                    description: n.description,
                    // Neutral-but-consistent placeholder scores so that
                    // sorting and UI elements continue to work.
                    base_similarity: 0.5,
                    fairness_multiplier: 1.0,
                    final_score: 0.5 - idx * 0.01,
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

    const openDonate = (ngo) => {
        setDonatingNgo(ngo);
        setDonationForm({ amount: "", currency: "USD", description: "" });
    };

    const submitDonation = async (e) => {
        e.preventDefault();
        if (!donatingNgo) return;
        const amount = Number(donationForm.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        try {
            await apiRequest(
                "/transactions",
                "POST",
                {
                    ngo_id: donatingNgo.ngo_id,
                    amount,
                    currency: donationForm.currency,
                    description: donationForm.description || undefined,
                },
                token
            );
            setDonatingNgo(null);
            const res = await apiRequest("/transactions/mine", "GET", undefined, token);
            setHistory(res.transactions || []);
            alert("Donation recorded successfully.");
        } catch (e2) {
            alert(e2.message);
        }
    };

    const [sectorChipFilter, setSectorChipFilter] = useState("");

    const normalizedSearch = searchTerm.trim().toLowerCase();
    let visibleResults = results;
    if (normalizedSearch) {
        visibleResults = visibleResults.filter((ngo) => {
            const haystack = `${ngo.name} ${ngo.sector} ${ngo.geographic_focus} ${
                ngo.description || ""
            }`.toLowerCase();
            return haystack.includes(normalizedSearch);
        });
    }
    if (sectorChipFilter) {
        visibleResults = visibleResults.filter((ngo) => {
            const tags = (ngo.sector || "")
                .split("|")
                .map((s) => s.trim())
                .filter(Boolean);
            return tags.includes(sectorChipFilter);
        });
    }
    visibleResults = [...visibleResults].sort((a, b) => {
        const aFinal = Number(a.final_score || 0);
        const bFinal = Number(b.final_score || 0);
        const aFair = Number(a.fairness_multiplier || 1);
        const bFair = Number(b.fairness_multiplier || 1);
        const aBase = Number(a.base_similarity || 0);
        const bBase = Number(b.base_similarity || 0);

        if (sortBy === "fairness") {
            return bFair - aFair || bFinal - aFinal;
        }
        if (sortBy === "similarity") {
            return bBase - aBase || bFinal - aFinal;
        }
        // default: final score
        return bFinal - aFinal;
    });

    const sectorTagsAvailable = Array.from(
        new Set(
            results.flatMap((ngo) =>
                (ngo.sector || "")
                    .split("|")
                    .map((s) => s.trim())
                    .filter(Boolean)
            )
        )
    ).sort();

    return (
        <div className="grid-2">
            <div className="card donor-card">
                <h2>AI-Matched NGO Recommendations</h2>
                <form className="form-grid" onSubmit={handleMatch}>
                    <label>
                        Preferred Cause / Sector
                        <input
                            name="cause"
                            value={prefs.cause}
                            onChange={handleChange}
                            placeholder="Education, Health, Environment..."
                            required
                        />
                    </label>
                    <label>
                        Geography
                        <input
                            name="location"
                            value={prefs.location}
                            onChange={handleChange}
                            placeholder="Country / Region / City"
                        />
                    </label>
                    <label>
                        Min Budget (optional)
                        <input
                            type="number"
                            name="min_budget"
                            value={prefs.min_budget}
                            onChange={handleChange}
                        />
                    </label>
                    <label>
                        Max Budget
                        <input
                            type="number"
                            name="max_budget"
                            value={prefs.max_budget}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <button type="submit" className="primary-btn" disabled={loading}>
                        {loading ? "Matching..." : "Find NGOs"}
                    </button>
                </form>
                {results.length > 0 && (
                    <p className="muted" style={{ marginTop: "0.6rem" }}>
                        Matching for: <strong>{prefs.cause || "Any cause"}</strong>{" "}
                        · <strong>{prefs.location || "Any location"}</strong>{" "}
                        · Budget{" "}
                        <strong>
                            {prefs.min_budget || "0"} – {prefs.max_budget || "∞"}
                        </strong>
                    </p>
                )}
                {results.length > 0 && (
                    <div className="row-actions" style={{ marginTop: "0.75rem" }}>
                        <label style={{ flex: 1, minWidth: "180px" }}>
                            <span style={{ display: "block", fontSize: "0.78rem", color: "#64748b" }}>
                                Search within recommended NGOs
                            </span>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filter by name, sector, or geography..."
                            />
                        </label>
                        <label>
                            <span style={{ display: "block", fontSize: "0.78rem", color: "#64748b" }}>
                                Sort by
                            </span>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="final_score">Overall score (AI + fairness)</option>
                                <option value="fairness">Fairness boost (supports lesser‑known)</option>
                                <option value="similarity">Match to your preferences</option>
                            </select>
                        </label>
                    </div>
                )}
                {results.length > 0 && sectorTagsAvailable.length > 0 && (
                    <div className="filter-chips">
                        <span className="filter-label">Filter by sector:</span>
                        <button
                            type="button"
                            className={
                                !sectorChipFilter ? "chip chip-active" : "chip"
                            }
                            onClick={() => setSectorChipFilter("")}
                        >
                            All
                        </button>
                        {sectorTagsAvailable.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                className={
                                    sectorChipFilter === tag ? "chip chip-active" : "chip"
                                }
                                onClick={() => setSectorChipFilter(tag)}
                            >
                                {getSectorIcon(tag)} {tag}
                            </button>
                        ))}
                    </div>
                )}
                <div className="results-grid">
                    {visibleResults.map((ngo) => (
                        <div key={ngo.ngo_id} className="card subtle ngo-card">
                            <div className="ngo-card-header">
                                <div className="avatar-circle">
                                    {getInitials(ngo.name)}
                                </div>
                                <div className="ngo-card-title">
                                    <h3>{ngo.name}</h3>
                                    <div className="pill-row">
                                        {renderSectorTags(ngo.sector)}
                                    </div>
                                </div>
                            </div>
                            {ngo.description && (
                                <p className="ngo-card-description">
                                    {ngo.description.length > 140
                                        ? `${ngo.description.slice(0, 137)}...`
                                        : ngo.description}
                                </p>
                            )}
                            <div className="ngo-card-meta">
                                <span className="location-pill">
                                    <span className="pill-icon" aria-hidden="true">
                                        📍
                                    </span>
                                    {ngo.geographic_focus || "N/A"}
                                </span>
                                <span className="score-pill">
                                    Match score: {ngo.final_score.toFixed(2)}
                                </span>
                            </div>
                            <div className="ngo-card-metrics">
                                <span>
                                    Similarity: {ngo.base_similarity.toFixed(2)}
                                </span>
                                <span>
                                    Fairness boost: {ngo.fairness_multiplier.toFixed(2)}x
                                </span>
                            </div>
                            <div className="row-actions ngo-card-actions">
                                <button className="secondary-btn" onClick={() => openDonate(ngo)}>
                                    Donate
                                </button>
                            </div>
                        </div>
                    ))}
                    {results.length === 0 && (
                        <p className="muted">
                            Submit your preferences to see AI-ranked NGO recommendations that
                            balance relevance with fairness.
                        </p>
                    )}
                    {results.length > 0 && visibleResults.length === 0 && (
                        <p className="muted">
                            No NGOs match your current search. Try clearing or relaxing your filters.
                        </p>
                    )}
                    {usedFallback && results.length > 0 && (
                        <p className="muted">
                            Showing all registered NGOs because the AI engine does not yet have
                            enough data to prioritize them. As profiles and transactions grow,
                            this view will become smarter.
                        </p>
                    )}
                </div>
            </div>
            <div className="card">
                <h2>Your Donation History</h2>
                {history.length === 0 ? (
                    <p className="muted">
                        Once you record transactions via the CSR team or integrated payment
                        rails, they will appear here for impact tracking.
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
                                        setDonationForm((p) => ({ ...p, amount: e.target.value }))
                                    }
                                    required
                                />
                            </label>
                            <label>
                                Currency
                                <select
                                    value={donationForm.currency}
                                    onChange={(e) =>
                                        setDonationForm((p) => ({ ...p, currency: e.target.value }))
                                    }
                                >
                                    <option value="USD">USD</option>
                                    <option value="PKR">PKR</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </label>
                            <label className="full-width">
                                Description (optional)
                                <input
                                    value={donationForm.description}
                                    onChange={(e) =>
                                        setDonationForm((p) => ({
                                            ...p,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g., Education supplies for Q2"
                                />
                            </label>
                            <div className="row-actions full-width">
                                <button type="button" className="ghost-btn" onClick={() => setDonatingNgo(null)}>
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
                token ? apiRequest("/relationships/mine", "GET", undefined, token) : Promise.resolve({ followee_ids: [] }),
            ]);
            setNgos(ngoRes.ngos || []);
            setFolloweeIds(relRes.followee_ids || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [token]);

    const follow = async (userId) => {
        if (!requireAuth()) return;
        await apiRequest("/relationships/follow", "POST", { followee_id: userId }, token);
        load();
    };

    const unfollow = async (userId) => {
        if (!requireAuth()) return;
        await apiRequest("/relationships/unfollow", "POST", { followee_id: userId }, token);
        load();
    };

    const openDetails = async (ngo) => {
        setSelectedNgo(ngo);
        setSelectedDetails(null);
        setDetailsLoading(true);
        try {
            const res = await apiRequest(`/ngos/${ngo.id}`, "GET", undefined, token);
            setSelectedDetails(res);
        } catch (e) {
            console.error(e);
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetails = () => {
        setSelectedNgo(null);
        setSelectedDetails(null);
    };

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const sectors = Array.from(new Set(ngos.map((n) => n.sector).filter(Boolean))).sort();
    const filteredNgos = ngos.filter((ngo) => {
        if (sectorFilter !== "ALL" && ngo.sector !== sectorFilter) return false;
        if (!normalizedSearch) return true;
        const haystack = `${ngo.name} ${ngo.sector} ${ngo.geographic_focus}`.toLowerCase();
        return haystack.includes(normalizedSearch);
    });

    return (
        <div className="grid-2">
            <div className="card">
                <h2>Networking Directory</h2>
                <p className="muted">
                    Follow NGOs to personalize your feed and strengthen real-time collaboration.
                </p>
                <div className="row-actions" style={{ margin: "0.75rem 0" }}>
                    <input
                        style={{ flex: 1, minWidth: "180px" }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by NGO name, sector, or geography..."
                    />
                    {sectors.length > 0 && (
                        <select
                            value={sectorFilter}
                            onChange={(e) => setSectorFilter(e.target.value)}
                        >
                            <option value="ALL">All sectors</option>
                            {sectors.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <p className="muted" style={{ fontSize: "0.78rem" }}>
                    Showing {filteredNgos.length} of {ngos.length} registered NGOs
                </p>
                {loading ? (
                    <p>Loading NGOs...</p>
                ) : (
                    <div className="results-grid">
                        {filteredNgos.map((ngo) => {
                            const isFollowing = followeeIds.includes(ngo.user_id);
                            return (
                                <div key={ngo.id} className="card subtle profile-card">
                                    <div className="profile-header">
                                        <div className="avatar-circle">
                                            {getInitials(ngo.name)}
                                        </div>
                                        <div>
                                            <h3>{ngo.name}</h3>
                                            <div className="pill-row">
                                                {renderSectorTags(ngo.sector)}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="profile-location">
                                        <span className="pill-icon" aria-hidden="true">
                                            📍
                                        </span>
                                        {ngo.geographic_focus}
                                    </p>
                                    <div className="pill-row">
                                        <span className={`pill status-${ngo.verification_status.toLowerCase()}`}>
                                            {ngo.verification_status}
                                        </span>
                                        <span className="pill">Credibility: {Number(ngo.credibility_score).toFixed(1)}</span>
                                    </div>
                                    <div className="row-actions profile-actions">
                                        {isFollowing ? (
                                            <button className="secondary-btn" onClick={() => unfollow(ngo.user_id)}>
                                                Unfollow
                                            </button>
                                        ) : (
                                            <button className="secondary-btn" onClick={() => follow(ngo.user_id)}>
                                                Follow
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="ghost-btn"
                                            onClick={() => openDetails(ngo)}
                                        >
                                            View profile
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {ngos.length === 0 && <p className="muted">No NGOs registered yet.</p>}
                        {ngos.length > 0 && filteredNgos.length === 0 && (
                            <p className="muted">No NGOs match your current search or filters.</p>
                        )}
                    </div>
                )}
            </div>
            <div className="card">
                <h2>How Following Works</h2>
                <ul className="bullet-list">
                    <li>Follow an NGO to prioritize their posts in your feed.</li>
                    <li>Unfollow any time; it only affects your personal view.</li>
                    <li>Use the Social Feed page to like, comment, and share updates.</li>
                </ul>
            </div>
            {selectedNgo && (
                <div className="modal-backdrop" onClick={closeDetails}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedNgo.name}</h2>
                        {detailsLoading || !selectedDetails ? (
                            <p className="muted">Loading NGO profile...</p>
                        ) : (
                            <>
                                <p className="muted" style={{ marginBottom: "0.75rem" }}>
                                    {selectedDetails.mission_statement}
                                </p>
                                <div className="pill-row" style={{ marginBottom: "0.75rem" }}>
                                    <span className="pill">
                                        Sector: {selectedDetails.sector}
                                    </span>
                                    <span className="pill">
                                        Geography: {selectedDetails.geographic_focus}
                                    </span>
                                </div>
                            </>
                        )}
                        <div className="row-actions" style={{ marginTop: "0.5rem" }}>
                            {selectedNgo && (
                                followeeIds.includes(selectedNgo.user_id) ? (
                                    <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={() => {
                                            if (!requireAuth()) return;
                                            unfollow(selectedNgo.user_id);
                                        }}
                                    >
                                        Unfollow
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={() => {
                                            if (!requireAuth()) return;
                                            follow(selectedNgo.user_id);
                                        }}
                                    >
                                        Follow
                                    </button>
                                )
                            )}
                            <button type="button" className="ghost-btn" onClick={closeDetails}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SocialNetworking({ token, requireAuth }) {
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");

    const loadFeed = async () => {
        setLoading(true);
        try {
            const res = await apiRequest("/feed", "GET", undefined, token);
            setFeed(res.feed || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeed();
    }, [token]);

    const submitPost = async (e) => {
        e.preventDefault();
        try {
            await apiRequest(
                "/posts",
                "POST",
                { content: newPost, media_url: mediaUrl || undefined, visibility: "PUBLIC" },
                token
            );
            setNewPost("");
            setMediaUrl("");
            loadFeed();
        } catch (e) {
            alert(e.message);
        }
    };

    const likePost = async (id) => {
        try {
            if (!requireAuth()) return;
            await apiRequest(`/posts/${id}/like`, "POST", {}, token);
            loadFeed();
        } catch (e) {
            alert(e.message);
        }
    };

    const commentPost = async (id, text, reset) => {
        try {
            if (!requireAuth()) return;
            await apiRequest(
                `/posts/${id}/comments`,
                "POST",
                { comment_text: text },
                token
            );
            reset();
            loadFeed();
        } catch (e) {
            alert(e.message);
        }
    };

    const sharePost = async (id) => {
        try {
            if (!requireAuth()) return;
            await apiRequest(`/posts/${id}/share`, "POST", {}, token);
            loadFeed();
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div className="grid-2">
            <div className="card">
                <h2>Create a Post</h2>
                <form className="form-grid" onSubmit={submitPost}>
                    <label className="full-width">
                        Update
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="Share stories, impact updates, or calls for support..."
                            required
                        />
                    </label>
                    <label className="full-width">
                        Media URL (optional)
                        <input
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                            placeholder="Link to images or videos"
                        />
                    </label>
                    <button type="submit" className="primary-btn" onClick={(e) => { if (!requireAuth()) e.preventDefault(); }}>
                        Post
                    </button>
                </form>
            </div>
            <div className="card">
                <h2>Network Feed</h2>
                {loading ? (
                    <p>Loading feed...</p>
                ) : feed.length === 0 ? (
                    <p className="muted">No posts yet. Be the first to share.</p>
                ) : (
                    <div className="feed-list">
                        {feed.map((post) => (
                            <FeedItem
                                key={post.id}
                                post={post}
                                onLike={likePost}
                                onComment={commentPost}
                                onShare={sharePost}
                                token={token}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function FeedItem({ post, onLike, onComment, onShare, token }) {
    const [comment, setComment] = useState("");
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);

    const loadComments = async () => {
        setLoadingComments(true);
        try {
            const res = await apiRequest(`/posts/${post.id}/comments`, "GET", undefined, token);
            setComments(res.comments || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingComments(false);
        }
    };

    const displayName = post.ngo_name || post.author_name || "Community Member";

    return (
        <article className="feed-item">
            <header className="feed-header">
                <div className="feed-header-main">
                    <div className="avatar-circle avatar-small">
                        {getInitials(displayName)}
                    </div>
                    <div>
                        <div className="feed-title">{displayName}</div>
                        <div className="feed-meta">
                            {new Date(post.created_at).toLocaleString()}
                        </div>
                    </div>
                </div>
            </header>
            <p>{post.content}</p>
            {post.media_url && (
                <a href={post.media_url} target="_blank" rel="noreferrer" className="media-link">
                    View attached media
                </a>
            )}
            <div className="feed-actions">
                <button onClick={() => onLike(post.id)}>
                    Like ({post.like_count})
                </button>
                <button
                    className="link-btn"
                    onClick={async () => {
                        const next = !showComments;
                        setShowComments(next);
                        if (next) await loadComments();
                    }}
                >
                    Comments ({post.comment_count})
                </button>
                <button onClick={() => onShare(post.id)}>
                    Share ({post.share_count})
                </button>
            </div>
            {showComments && (
                <div className="comments-panel">
                    {loadingComments ? (
                        <p className="muted">Loading comments...</p>
                    ) : comments.length === 0 ? (
                        <p className="muted">No comments yet.</p>
                    ) : (
                        <ul className="comments-list">
                            {comments.map((c) => (
                                <li key={c.id}>
                                    <div className="comment-head">
                                        <strong>{c.user_name || "User"}</strong>
                                        <span className="comment-time">
                                            {new Date(c.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="comment-body">{c.comment_text}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            <form
                className="comment-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!comment.trim()) return;
                    onComment(post.id, comment, () => setComment(""));
                }}
            >
                <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                />
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
            } catch (e) {
                console.error(e);
            }
        }
        load();
    }, [token]);

    const badges = [];
    if (overview && overview.total_amount > 0) {
        badges.push("Impact Investor");
    }
    if (overview && Object.keys(overview.per_sector || {}).length >= 3) {
        badges.push("Portfolio Diversifier");
    }
    if (user.role === "NGO") {
        badges.push("Change Maker");
    }

    const progressValue = overview ? Math.min(100, (overview.total_amount || 0) / 1000) : 0;

    return (
        <div className="grid-2">
            <div className="card">
                <h2>Your Impact Badges</h2>
                {badges.length === 0 ? (
                    <p className="muted">
                        As you donate, collaborate, and share updates, you will unlock impact
                        badges and climb the leaderboard.
                    </p>
                ) : (
                    <div className="badge-grid">
                        {badges.map((b) => (
                            <div key={b} className="badge">
                                <span>{b}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="progress-card">
                    <div className="progress-header">
                        <span className="muted">Engagement level</span>
                        <span className="progress-label">
                            Level {progressValue >= 80 ? "Impact Champion" : progressValue >= 40 ? "Rising Ally" : "Starter"}
                        </span>
                    </div>
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${progressValue}%` }}
                        />
                    </div>
                </div>
            </div>
            <div className="card">
                <h2>Leaderboard (Sample)</h2>
                <ul className="leaderboard">
                    <li>
                        <span>Top Corporate Donor</span>
                        <strong>FutureTech Inc.</strong>
                    </li>
                    <li>
                        <span>Top NGO (Education)</span>
                        <strong>Rural EduCare</strong>
                    </li>
                    <li>
                        <span>Top Individual Ally</span>
                        <strong>Anonymous</strong>
                    </li>
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
            } catch (e) {
                console.error(e);
            }
        }
        load();
    }, [token]);

    if (!data) {
        return <div className="card">Loading analytics...</div>;
    }

    const maxSector = Math.max(
        1,
        ...Object.values(data.per_sector || {}).map((v) => v || 0)
    );

    const totalNgos = Object.keys(data.per_ngo || {}).length;
    const totalSectors = Object.keys(data.per_sector || {}).length;

    return (
        <div className="grid-2">
            <div className="card">
                <h2>Funding Overview</h2>
                <div className="summary-grid">
                    <div className="summary-card">
                        <span className="summary-label">Total tracked funding</span>
                        <span className="summary-value">
                            {data.total_amount.toFixed(2)} USD
                        </span>
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
                    {Object.entries(data.per_sector || {}).map(([sector, amount]) => {
                        const width = `${(amount / maxSector) * 100 || 5}%`;
                        return (
                            <div key={sector} className="bar-row">
                                <span className="bar-label">{sector}</span>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{ width }} />
                                </div>
                                <span className="bar-value">{amount.toFixed(2)}</span>
                            </div>
                        );
                    })}
                    {Object.keys(data.per_sector || {}).length === 0 && (
                        <p className="muted">
                            Once transactions are recorded, sector-wise funding will appear
                            here.
                        </p>
                    )}
                </div>
            </div>
            <div className="card">
                <h2>Top Supported NGOs</h2>
                <ul className="simple-list">
                    {Object.entries(data.per_ngo || {}).map(([ngo, amount]) => (
                        <li key={ngo}>
                            <span>{ngo}</span>
                            <strong>{amount.toFixed(2)} USD</strong>
                        </li>
                    ))}
                    {Object.keys(data.per_ngo || {}).length === 0 && (
                        <p className="muted">
                            No NGO-level analytics yet. As contributions flow, this panel will
                            highlight key partners.
                        </p>
                    )}
                </ul>
            </div>
        </div>
    );
}

const QUICK_REPLIES = ["Tell me about NGOs", "How do I donate?", "What is AI matching?", "Show me analytics"];

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "👋 Hi! I'm ImpactBot, your AI assistant for the Unified Impact Platform. Ask me anything about NGOs, donations, or platform features!" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = React.useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    const sendMessage = async (text) => {
        const content = (text || input).trim();
        if (!content || loading) return;
        const userMessage = { role: 'user', content };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        try {
            const response = await apiRequest('/chat', 'POST', { message: content });
            setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    className="chatbot-fab"
                    onClick={() => setIsOpen(true)}
                    title="Chat with ImpactBot"
                >
                    💬
                    <span className="chatbot-fab-dot" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    {/* Header */}
                    <div className="chatbot-window-header">
                        <div className="chatbot-header-left">
                            <div className="chatbot-avatar-wrap">🤖</div>
                            <div>
                                <div className="chatbot-bot-name">ImpactBot</div>
                                <div className="chatbot-status">
                                    <span className="chatbot-online-dot" />
                                    <span>AI Assistant · Online</span>
                                </div>
                            </div>
                        </div>
                        <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>✕</button>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages-area">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chatbot-msg-row ${msg.role}`}>
                                <div className={`chatbot-msg-avatar ${msg.role}`}>
                                    {msg.role === 'user' ? '👤' : '🤖'}
                                </div>
                                <div className={`chatbot-bubble ${msg.role}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="chatbot-msg-row assistant">
                                <div className="chatbot-msg-avatar assistant">🤖</div>
                                <div className="chatbot-bubble assistant chatbot-typing">
                                    <span className="chatbot-dot" />
                                    <span className="chatbot-dot" />
                                    <span className="chatbot-dot" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies */}
                    <div className="chatbot-quick-replies">
                        {QUICK_REPLIES.map(r => (
                            <button key={r} className="chatbot-quick-btn" onClick={() => sendMessage(r)}>
                                {r}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="chatbot-input-area">
                        <input
                            className="chatbot-text-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder="Ask me anything..."
                            disabled={loading}
                        />
                        <button
                            className="chatbot-send-btn"
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

const ALL_TESTIMONIALS = [
    { name: "Priya Sharma",       role: "Corporate CSR Head",    org: "TechBridge Corp",         text: "The AI matching saved us weeks of research. We found three perfect NGO partners aligned with our environmental goals within hours.",                                              initials: "PS", color: "#00c896" },
    { name: "Dr. Arjun Mehta",    role: "NGO Founder",           org: "EduReach Foundation",     text: "As a small NGO, visibility was our biggest challenge. This platform gave us credibility scoring and connected us with donors we never would have found.",                        initials: "AM", color: "#10b981" },
    { name: "Sunita Rao",         role: "Individual Contributor", org: "Impact Champion",         text: "The gamification and social feed make giving feel meaningful. I can follow my favorite NGOs and track exactly how my donations are used.",                                       initials: "SR", color: "#00b894" },
    { name: "Karthik Nair",       role: "CSR Manager",           org: "Infosys Foundation",      text: "We used to spend months vetting NGOs manually. The credibility score and sector filters let us shortlist quality partners in minutes.",                                         initials: "KN", color: "#38bdf8" },
    { name: "Meena Iyer",         role: "Executive Director",    org: "GreenShores Trust",       text: "After joining this platform our donation inflow grew by 60% in six months. The exposure to corporate donors changed everything for our small coastal NGO.",                     initials: "MI", color: "#a78bfa" },
    { name: "Rahul Verma",        role: "Social Impact Lead",    org: "Paytm Foundation",        text: "The networking directory helped us find three complementary NGOs for a joint project. The collaboration feature is something no other platform offers.",                         initials: "RV", color: "#fb923c" },
    { name: "Anjali Desai",       role: "Volunteer Coordinator", org: "Teach For India",         text: "Managing volunteer sign-ups and tracking hours used to be chaos. The portal streamlined everything and our volunteer retention improved dramatically.",                          initials: "AD", color: "#00c896" },
    { name: "Vikram Singh",       role: "Philanthropist",        org: "Singh Family Foundation", text: "I donate to eight different NGOs and this is the first platform that lets me track all of them from a single dashboard with real impact metrics.",                               initials: "VS", color: "#10b981" },
    { name: "Dr. Lakshmi Reddy",  role: "Programme Officer",     org: "CARE India",              text: "The grant request feature let us publish our funding needs publicly. We received expressions of interest from four corporate donors within two weeks.",                           initials: "LR", color: "#00b894" },
    { name: "Nikhil Bose",        role: "Co-founder",            org: "RuralTech Initiative",    text: "As a rural-focused NGO with limited digital presence, the AI matching algorithm actually brought us to donors who cared about our specific geography.",                         initials: "NB", color: "#38bdf8" },
    { name: "Farah Khan",         role: "Head of Partnerships",  org: "Reliance Foundation",     text: "We have partnered with eleven NGOs through this platform. The transparency in credibility scoring makes decision-making straightforward.",                                       initials: "FK", color: "#a78bfa" },
    { name: "Shanthi Pillai",     role: "Beneficiary Advocate",  org: "Akshaya Patra",           text: "The social feed keeps our supporters updated on real ground work. Engagement from our network has more than doubled since we started posting here.",                             initials: "SP", color: "#fb923c" },
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
    const [shuffled]  = React.useState(() => shuffleArray(ALL_TESTIMONIALS));
    const shown = shuffled.slice(0, 3); // pick 3 random on mount

    React.useEffect(() => {
        // Auto-cycle the active highlighted card every 4 s
        const id = setInterval(() => setVisibleIdx(v => (v + 1) % shown.length), 4000);
        return () => clearInterval(id);
    }, [shown.length]);

    return (
        <div className="home-container">
            {/* Hero */}
            <section className="hero-section">
                <div className="hero-content-modern">
                    <div className="hero-badge-chip">✨ AI-Powered NGO Platform</div>
                    <h2 className="hero-title">Empower Change,<br/>Together</h2>
                    <p className="hero-tagline">
                        A modern, unified platform bridging the gap between NGOs, corporate donors, and individual contributors. Let's make a real difference.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-modern btn-primary" onClick={() => goto("/login")}>
                            Get Started / Log In
                        </button>
                        <button className="btn-modern btn-secondary" onClick={() => goto("/networking", { requireLogin: true })}>
                            Explore NGOs →
                        </button>
                    </div>
                </div>
                <div className="hero-illustration-modern">
                    <div className="glass-shape shape-1"></div>
                    <div className="glass-shape shape-2"></div>
                    <div className="glass-shape shape-3"></div>
                </div>
            </section>

            {/* Stats */}
            <section className="impact-counters">
                <div className="counter-card glass-card">
                    <h3>50+</h3>
                    <p>NGOs in Network</p>
                </div>
                <div className="counter-card glass-card">
                    <h3>15+</h3>
                    <p>Impact Sectors</p>
                </div>
                <div className="counter-card glass-card">
                    <h3>AI Powered</h3>
                    <p>Matching Algorithm</p>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works-modern">
                <h2 className="section-title">How It Works</h2>
                <p className="section-subtitle">Three simple steps to amplify your social impact</p>
                <div className="steps-grid">
                    <div className="step-card glass-card">
                        <div className="step-icon">🎯</div>
                        <div className="step-number">Step 1</div>
                        <h3>Set your intent</h3>
                        <p>Specify causes, geographies, and budgets to shape your targeted impact.</p>
                    </div>
                    <div className="step-card glass-card">
                        <div className="step-icon">🤝</div>
                        <div className="step-number">Step 2</div>
                        <h3>Match with Needs</h3>
                        <p>Our AI engine surfaces opportunities that align with your focus seamlessly.</p>
                    </div>
                    <div className="step-card glass-card">
                        <div className="step-icon">📈</div>
                        <div className="step-number">Step 3</div>
                        <h3>Track Real Impact</h3>
                        <p>Integrated analytics and stories help you evidence outcomes clearly.</p>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features-section">
                <div className="features-header">
                    <h2 className="section-title">Everything You Need</h2>
                    <p className="section-subtitle">A comprehensive platform built for NGOs, donors, and contributors</p>
                </div>
                <div className="features-grid">
                    {[
                        { icon: "⚡", title: "AI-Powered Matching", desc: "Our intelligent algorithm connects donors with the right NGOs using fairness multipliers to support lesser-known organizations.", color: "#00c896" },
                        { icon: "🛡️", title: "Verified NGOs", desc: "Every organization on our platform goes through a rigorous verification process with credibility scoring.", color: "#10b981" },
                        { icon: "🌍", title: "Global Reach", desc: "Connect with NGOs across 50+ countries working in education, health, environment, and more.", color: "#00b894" },
                        { icon: "👥", title: "Community Driven", desc: "A thriving social feed, networking directory, and gamification system keeps contributors engaged.", color: "#00c896" },
                        { icon: "📊", title: "Real-time Analytics", desc: "Track your donations, measure impact, and see where every rupee goes with detailed dashboards.", color: "#059669" },
                        { icon: "❤️", title: "Multiple Giving Modes", desc: "One-time donations, recurring giving, grant applications — flexible options for all contributor types.", color: "#00b894" },
                    ].map((f, i) => (
                        <div key={i} className="feature-card glass-card">
                            <div className="feature-icon-wrap" style={{ background: f.color + '18', color: f.color }}>
                                <span style={{ fontSize: '1.3rem' }}>{f.icon}</span>
                            </div>
                            <h3 className="feature-title">{f.title}</h3>
                            <p className="feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials-section">
                <h2 className="section-title">Voices of Impact</h2>
                <p className="section-subtitle">Real stories from our community</p>
                <div className="testimonials-grid">
                    {shown.map((t, i) => (
                        <div
                            key={i}
                            className="testimonial-card glass-card"
                            style={{
                                transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
                                transform: visibleIdx === i ? "translateY(-6px)" : "translateY(0)",
                                borderColor: visibleIdx === i ? `${t.color}55` : undefined,
                                boxShadow: visibleIdx === i ? `0 20px 40px ${t.color}22` : undefined,
                            }}
                        >
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
                {/* Dot indicators */}
                <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
                    {shown.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setVisibleIdx(i)}
                            style={{
                                width: visibleIdx === i ? "20px" : "8px",
                                height: "8px",
                                borderRadius: "999px",
                                border: "none",
                                background: visibleIdx === i ? "#00c896" : "rgba(255,255,255,0.2)",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                padding: 0,
                            }}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

function AppShell() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [route, setRoute] = useState(getHashRoute());
    const [toast, setToast] = useState(null);

    const handleAuthenticated = (u, t) => {
        setUser(u);
        setToken(t);
        setToast({ type: "success", message: `Welcome, ${u.name}.` });
        navigate("/home");
    };

    const logout = () => {
        setUser(null);
        setToken(null);
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
                    <p>
                        Bridging NGOs, corporate donors, and individual allies through{" "}
                        <strong>real-time collaboration</strong>.
                    </p>
                </div>
                <nav className="main-nav">
                    <button
                        className={route === "/home" ? "nav-btn active" : "nav-btn"}
                        onClick={() => goto("/home")}
                    >
                        Home
                    </button>
                    <button
                        className={route === "/login" ? "nav-btn active" : "nav-btn"}
                        onClick={() => goto("/login")}
                    >
                        Login
                    </button>
                    <button
                        className={route === "/ngo-portal" ? "nav-btn active" : "nav-btn"}
                        onClick={() => {
                            if (!requireAuth()) return;
                            if (user?.role !== "NGO") {
                                setToast({ type: "warning", message: "NGO Portal is only for NGO accounts." });
                                return;
                            }
                            goto("/ngo-portal", { requireLogin: true });
                        }}
                    >
                        NGO Portal
                    </button>
                    <button
                        className={route === "/donor-portal" ? "nav-btn active" : "nav-btn"}
                        onClick={() => {
                            if (!requireAuth()) return;
                            if (user?.role === "NGO") {
                                setToast({ type: "warning", message: "Donor Portal is for Corporate/Individual accounts." });
                                return;
                            }
                            goto("/donor-portal", { requireLogin: true });
                        }}
                    >
                        Donor Portal
                    </button>
                    <button
                        className={route === "/networking" ? "nav-btn active" : "nav-btn"}
                        onClick={() => goto("/networking", { requireLogin: true })}
                    >
                        Networking
                    </button>
                    <button
                        className={route === "/social-feed" ? "nav-btn active" : "nav-btn"}
                        onClick={() => goto("/social-feed", { requireLogin: true })}
                    >
                        Social Feed
                    </button>
                    <button
                        className={route === "/gamification" ? "nav-btn active" : "nav-btn"}
                        onClick={() => goto("/gamification", { requireLogin: true })}
                    >
                        Gamification
                    </button>
                    <button
                        className={route === "/analytics" ? "nav-btn active" : "nav-btn"}
                        onClick={() => goto("/analytics", { requireLogin: true })}
                    >
                        Analytics
                    </button>
                </nav>
                {user ? (
                    <div className="user-pill">
                        <span>{user.name}</span>
                        <span className="role">{user.role}</span>
                        <button onClick={logout}>Logout</button>
                    </div>
                ) : null}
            </header>
            <main className="page">
                {route === "/home" && (
                    <Home goto={goto} token={token} />
                )}
                {route === "/login" && (
                    <div className="login-page">
                        {/* Left branded panel */}
                        <div className="login-page-left">
                            <div className="login-left-inner">
                                <div className="login-left-logo">
                                    <span className="login-left-logo-icon">🌐</span>
                                    <span className="login-left-logo-name">Unified Impact Platform</span>
                                </div>
                                <h2 className="login-left-headline">
                                    Bridge the gap.<br/>
                                    <span className="login-left-headline-accent">Amplify impact.</span>
                                </h2>
                                <p className="login-left-desc">
                                    Connect NGOs, corporate donors, and individual contributors through
                                    AI-powered matching and real-time collaboration.
                                </p>
                                <ul className="login-left-features">
                                    <li>
                                        <span className="login-feat-icon">⚡</span>
                                        <div>
                                            <strong>AI Matching Engine</strong>
                                            <span>Fairness-aware algorithm connects you with the right partners</span>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="login-feat-icon">🛡️</span>
                                        <div>
                                            <strong>Verified NGOs</strong>
                                            <span>Credibility-scored organizations you can trust</span>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="login-feat-icon">📊</span>
                                        <div>
                                            <strong>Real-time Impact</strong>
                                            <span>Track exactly where your contributions go</span>
                                        </div>
                                    </li>
                                </ul>
                                {/* Decorative shapes */}
                                <div className="login-deco-circle login-deco-1" />
                                <div className="login-deco-circle login-deco-2" />
                                <div className="login-deco-circle login-deco-3" />
                            </div>
                        </div>
                        {/* Right form panel */}
                        <div className="login-page-right">
                            <AuthPanel onAuthenticated={handleAuthenticated} defaultMode="login" />
                        </div>
                    </div>
                )}
                {route === "/ngo-portal" && user && user.role === "NGO" && (
                    <NGOPortal user={user} token={token} />
                )}
                {route === "/donor-portal" && user && user.role !== "NGO" && (
                    <DonorPortal user={user} token={token} />
                )}
                {route === "/networking" && (
                    <NetworkingDirectory token={token} requireAuth={requireAuth} />
                )}
                {route === "/social-feed" && (
                    <SocialNetworking token={token} requireAuth={requireAuth} />
                )}
                {route === "/gamification" && user && (
                    <GamificationPanel user={user} token={token} />
                )}
                {route === "/analytics" && user && (
                    <AnalyticsDashboard token={token} />
                )}
            </main>
            <Chatbot />
            <footer className="footer">
                <span>© {new Date().getFullYear()} Unified Digital Impact Platform</span>
            </footer>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppShell />);
