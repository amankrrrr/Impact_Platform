const { useState, useEffect } = React;

const API_BASE = "http://127.0.0.1:5000/api";

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
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label>
                    Password
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
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
    );
}

function NGOPosts({ token }) {
    const [content, setContent] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiRequest(
                "/posts",
                "POST",
                {
                    content,
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
            <h2>Share Funding Needs & Milestones</h2>
            <form className="form-grid" onSubmit={handleSubmit}>
                <label className="full-width">
                    Update
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Describe current funding requirements or project milestones..."
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPrefs((prev) => ({ ...prev, [name]: value }));
    };

    const handleMatch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await apiRequest("/recommendations", "POST", prefs, token);
            setResults(res.recommendations || []);
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

    return (
        <div className="grid-2">
            <div className="card">
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
                <div className="results-grid">
                    {results.map((ngo) => (
                        <div key={ngo.ngo_id} className="card subtle">
                            <h3>{ngo.name}</h3>
                            <p>
                                <strong>Sector:</strong> {ngo.sector}
                            </p>
                            <p>
                                <strong>Location:</strong> {ngo.geographic_focus}
                            </p>
                            <p>
                                <strong>Base Similarity:</strong>{" "}
                                {ngo.base_similarity.toFixed(2)}
                            </p>
                            <p>
                                <strong>Fairness Multiplier:</strong>{" "}
                                {ngo.fairness_multiplier.toFixed(2)}
                            </p>
                            <p>
                                <strong>Final Score:</strong>{" "}
                                {ngo.final_score.toFixed(2)}
                            </p>
                            <div className="row-actions">
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

    return (
        <div className="grid-2">
            <div className="card">
                <h2>Networking Directory</h2>
                <p className="muted">
                    Follow NGOs to personalize your feed and strengthen real-time collaboration.
                </p>
                {loading ? (
                    <p>Loading NGOs...</p>
                ) : (
                    <div className="results-grid">
                        {ngos.map((ngo) => {
                            const isFollowing = followeeIds.includes(ngo.user_id);
                            return (
                                <div key={ngo.id} className="card subtle">
                                    <h3>{ngo.name}</h3>
                                    <p>
                                        <strong>Sector:</strong> {ngo.sector}
                                    </p>
                                    <p>
                                        <strong>Geography:</strong> {ngo.geographic_focus}
                                    </p>
                                    <div className="pill-row">
                                        <span className={`pill status-${ngo.verification_status.toLowerCase()}`}>
                                            {ngo.verification_status}
                                        </span>
                                        <span className="pill">Credibility: {Number(ngo.credibility_score).toFixed(1)}</span>
                                    </div>
                                    <div className="row-actions">
                                        {isFollowing ? (
                                            <button className="secondary-btn" onClick={() => unfollow(ngo.user_id)}>
                                                Unfollow
                                            </button>
                                        ) : (
                                            <button className="secondary-btn" onClick={() => follow(ngo.user_id)}>
                                                Follow
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {ngos.length === 0 && <p className="muted">No NGOs registered yet.</p>}
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

    return (
        <article className="feed-item">
            <header>
                <div className="feed-title">
                    {post.ngo_name || post.author_name || "Community Member"}
                </div>
                <div className="feed-meta">
                    {new Date(post.created_at).toLocaleString()}
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

    return (
        <div className="grid-2">
            <div className="card">
                <h2>Funding Overview</h2>
                <p className="metric">
                    Total Tracked Funding:{" "}
                    <strong>{data.total_amount.toFixed(2)} USD</strong>
                </p>
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
                        className={route === "/ai-matching" ? "nav-btn active" : "nav-btn"}
                        onClick={() => goto("/ai-matching", { requireLogin: true })}
                    >
                        AI Matching
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
                    <div className="grid-2">
                        <div className="card">
                            <h2>Welcome</h2>
                            <p>
                                This unified digital platform aligns NGO needs with donor intent
                                using an{" "}
                                <strong>AI-powered matching and fairness engine</strong>. All
                                activity flows into transparent analytics so CSR and ESG
                                commitments are easy to evidence.
                            </p>
                            <ul className="bullet-list">
                                <li>
                                    Real-time collaboration between NGOs, corporates, and
                                    individual contributors.
                                </li>
                                <li>
                                    Fairness-aware allocation that uplifts historically
                                    underfunded organizations.
                                </li>
                                <li>Social impact storytelling through an integrated feed.</li>
                            </ul>
                        </div>
                        <div className="card">
                            <h2>Get Started</h2>
                            <p className="muted">
                                Use the Login page to sign in or create an account. After login,
                                explore AI Matching, Networking, Social Feed, and Analytics.
                            </p>
                            <div className="row-actions">
                                <button className="primary-btn" onClick={() => goto("/login")}>
                                    Go to Login
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {route === "/login" && (
                    <div className="grid-2">
                        <div className="card">
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
                {route === "/ai-matching" && user && user.role !== "NGO" && (
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
