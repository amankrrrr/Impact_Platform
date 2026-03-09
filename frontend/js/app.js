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
    const [mode, setMode] = useState("login"); // 'login' | 'register'
    const [role, setRole] = useState("INDIVIDUAL");
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

    useEffect(() => {
        setMode(defaultMode);
    }, [defaultMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (mode === "login") {
                const res = await apiRequest(
                    "/auth/login",
                    "POST",
                    {
                        email: form.email,
                        password: form.password,
                    }
                );
                onAuthenticated(res.user, res.token);
            } else {
                const payload = {
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    role,
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

    return (
        <div className="card auth-card">
            <div className="auth-header">
                <button
                    className={mode === "login" ? "tab active" : "tab"}
                    onClick={() => setMode("login")}
                >
                    Login
                </button>
                <button
                    className={mode === "register" ? "tab active" : "tab"}
                    onClick={() => setMode("register")}
                >
                    Register
                </button>
            </div>
            <form className="form-grid" onSubmit={handleSubmit}>
                {mode === "register" && (
                    <>
                        <label>
                            Full Name
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </label>
                        <label>
                            Role
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="NGO">NGO</option>
                                <option value="CORPORATE">Corporate Donor</option>
                                <option value="INDIVIDUAL">Individual Contributor</option>
                            </select>
                        </label>
                        <label>
                            Organization
                            <input
                                name="organization_name"
                                value={form.organization_name}
                                onChange={handleChange}
                            />
                        </label>
                    </>
                )}
                <label>
                    Email
                    <div className="input-with-icon">
                        <span className="input-icon" aria-hidden="true">
                            ✉
                        </span>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </label>
                <label>
                    Password
                    <div className="input-with-icon">
                        <span className="input-icon" aria-hidden="true">
                            🔒
                        </span>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </label>

                {mode === "register" && role === "NGO" && (
                    <>
                        <label className="full-width">
                            Mission Statement
                            <textarea
                                name="mission_statement"
                                value={form.mission_statement}
                                onChange={handleChange}
                                required
                            />
                        </label>
                        <label>
                            Sector
                            <input
                                name="sector"
                                value={form.sector}
                                onChange={handleChange}
                                placeholder="Education, Health, Environment..."
                                required
                            />
                        </label>
                        <label>
                            Geographic Focus
                            <input
                                name="geographic_focus"
                                value={form.geographic_focus}
                                onChange={handleChange}
                                placeholder="Country / Region / City"
                                required
                            />
                        </label>
                    </>
                )}

                {error && <div className="error-banner">{error}</div>}

                <button type="submit" className="primary-btn" disabled={loading}>
                    {loading ? "Submitting..." : mode === "login" ? "Login" : "Create Account"}
                </button>
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
            <NgoImpactGraph />
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

function NgoImpactGraph() {
    const data = [
        { month: "Jan", donations: 4000, volunteers: 2400 },
        { month: "Feb", donations: 3000, volunteers: 1398 },
        { month: "Mar", donations: 2000, volunteers: 9800 },
        { month: "Apr", donations: 2780, volunteers: 3908 },
        { month: "May", donations: 1890, volunteers: 4800 },
        { month: "Jun", donations: 2390, volunteers: 3800 },
        { month: "Jul", donations: 3490, volunteers: 4300 },
    ];

    const maxVal = Math.max(...data.map(d => Math.max(d.donations, d.volunteers)));

    return (
        <div className="card" style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
            <h2>Impact Overview (Mock)</h2>
            <p className="muted" style={{ marginBottom: "1rem" }}>
                Monthly interactions and funding progress over time.
            </p>
            <div className="bar-chart" style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", height: "200px", gap: "0.5rem", padding: "1rem 0", borderBottom: "1px solid #e2e8f0" }}>
                {data.map((item, idx) => (
                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%", gap: "4px" }}>
                        <div style={{ display: "flex", gap: "4px", width: "100%", justifyContent: "center", height: "100%", alignItems: "flex-end" }}>
                            <div 
                                style={{ 
                                    width: "30%", 
                                    height: `${(item.donations / maxVal) * 100}%`, 
                                    background: "linear-gradient(to top, #ea580c, #f97316)", 
                                    borderRadius: "4px 4px 0 0",
                                    transition: "height 0.5s ease" 
                                }} 
                                title={`Donations: ${item.donations}`}
                            />
                            <div 
                                style={{ 
                                    width: "30%", 
                                    height: `${(item.volunteers / maxVal) * 100}%`, 
                                    background: "linear-gradient(to top, #10b981, #34d399)", 
                                    borderRadius: "4px 4px 0 0",
                                    transition: "height 0.5s ease" 
                                }} 
                                title={`Volunteers: ${item.volunteers}`}
                            />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>{item.month}</span>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "center", fontSize: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <div style={{ width: "12px", height: "12px", background: "#ea580c", borderRadius: "2px" }}></div>
                    <span>Donations</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <div style={{ width: "12px", height: "12px", background: "#10b981", borderRadius: "2px" }}></div>
                    <span>Volunteers</span>
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

function Chatbot({ onClose }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you learn about NGOs in our catalog, recommend organizations based on your interests, or answer questions about our platform. What would you like to know?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await apiRequest('/chat', 'POST', { message: input });
            const assistantMessage = { role: 'assistant', content: response.reply };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className="chatbot-modal">
            <div className="chatbot-header">
                <h3>AI Assistant</h3>
                <button onClick={onClose} className="close-btn">×</button>
            </div>
            <div className="chatbot-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <div className="message-content">{msg.content}</div>
                    </div>
                ))}
                {loading && (
                    <div className="message assistant">
                        <div className="message-content typing">...</div>
                    </div>
                )}
            </div>
            <div className="chatbot-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about NGOs..."
                    disabled={loading}
                />
                <button onClick={sendMessage} disabled={loading || !input.trim()}>
                    Send
                </button>
            </div>
        </div>
    );
}

function Home({ goto, token }) {
    const [showChatbot, setShowChatbot] = useState(false);
    // Keep topNgos state if used elsewhere, but remove from render
    return (
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-content-modern">
                    <h2 className="hero-title">Empower Change, Together</h2>
                    <p className="hero-tagline">
                        A modern, unified platform bridging the gap between NGOs, corporate donors, and individual contributors. Let's make a real difference.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-modern btn-primary" onClick={() => goto("/login")}>
                            Get Started / Log In
                        </button>
                    </div>
                </div>
                <div className="hero-illustration-modern">
                    <div className="glass-shape shape-1"></div>
                    <div className="glass-shape shape-2"></div>
                    <div className="glass-shape shape-3"></div>
                </div>
            </section>

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

            <section className="how-it-works-modern">
                <h2 className="section-title">How It Works</h2>
                <div className="steps-grid">
                    <div className="step-card glass-card">
                        <div className="step-icon">🎯</div>
                        <h3>Set your intent</h3>
                        <p>Specify causes, geographies, and budgets to shape your targeted impact.</p>
                    </div>
                    <div className="step-card glass-card">
                        <div className="step-icon">🤝</div>
                        <h3>Match with Needs</h3>
                        <p>Our AI engine surfaces opportunities that align with your focus seamlessly.</p>
                    </div>
                    <div className="step-card glass-card">
                        <div className="step-icon">📈</div>
                        <h3>Track Real Impact</h3>
                        <p>Integrated analytics and stories help you evidence outcomes clearly.</p>
                    </div>
                </div>
            </section>

            {/* Chatbot Icon */}
            <button 
                className="chatbot-icon" 
                onClick={() => setShowChatbot(true)}
                title="Chat with our AI assistant"
            >
                💬
            </button>

            {/* Chatbot Modal */}
            {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
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
                        <strong>real-time collaboration</strong> and{" "}
                        <strong>equitable resource distribution</strong>.
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
                    <div className="grid-2 login-layout">
                        <div className="card login-info-card">
                            <h2>Login & Registration</h2>
                            <p className="muted">
                                Role-based onboarding: NGOs create profiles; donors set funding
                                preferences and track impact.
                            </p>
                            <ul className="bullet-list">
                                <li>NGO: publish requirements, milestones, and update profile.</li>
                                <li>Corporate/Individual: get fairness-aware AI matches and donate.</li>
                                <li>All users: network, follow, like, comment, and share updates.</li>
                            </ul>
                        </div>
                        <AuthPanel onAuthenticated={handleAuthenticated} defaultMode="login" />
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
            <footer className="footer">
                <span>© {new Date().getFullYear()} Unified Digital Impact Platform</span>
            </footer>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppShell />);
