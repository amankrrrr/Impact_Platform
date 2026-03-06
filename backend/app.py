from datetime import datetime, timedelta
import re

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

from models import (
    NGOProfile,
    Interaction,
    Post,
    Transaction,
    User,
    UserRelationship,
    db,
)
from ml_engine.fairness_matching import get_ngo_recommendations


def create_app():
    """
    API Gateway / application factory.

    This function wires together:
    - Database models
    - Social networking engine
    - AI matching & fairness engine
    """
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///platform.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app)
    db.init_app(app)

    with app.app_context():
        db.create_all()

    register_routes(app)
    return app


PROFANITY_LIST = ["badword", "dummy", "spam"]  # placeholder moderation list


def clean_content(text: str) -> str:
    """Simple content moderation: mask flagged keywords before insertion."""
    if not text:
        return text
    cleaned = text
    for word in PROFANITY_LIST:
        pattern = re.compile(re.escape(word), re.IGNORECASE)
        cleaned = pattern.sub("*" * len(word), cleaned)
    return cleaned


def update_ngo_credibility(ngo: NGOProfile):
    """
    Compute a dynamic credibility score based on:
    - Verification status
    - Historical funding volume
    - Social activity (posts, interactions)
    """
    base = 40.0

    if ngo.verification_status == "VERIFIED":
        base += 30.0
    elif ngo.verification_status == "PENDING":
        base += 10.0

    total_funding = sum(float(tx.amount) for tx in ngo.transactions)
    funding_score = min(total_funding / 10_000.0 * 20.0, 20.0)

    activity_score = min(len(ngo.posts) * 2.0, 10.0)

    ngo.credibility_score = min(base + funding_score + activity_score, 100.0)


def get_current_user():
    """
    Lightweight auth helper.
    In a production system you would use JWT or OAuth.
    Here we accept a simple X-User-Id header for demonstration.
    """
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        return None
    try:
        return User.query.get(int(user_id))
    except ValueError:
        return None


def register_routes(app: Flask):
    # ---------- Authentication & Registration ----------
    @app.route("/api/auth/register", methods=["POST"])
    def register_user():
        data = request.json or {}
        required_fields = ["name", "email", "password", "role"]
        if not all(data.get(f) for f in required_fields):
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Missing required registration fields",
                    }
                ),
                400,
            )

        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"status": "error", "message": "Email already in use"}), 409

        user = User(
            name=data["name"],
            email=data["email"],
            password_hash=generate_password_hash(data["password"]),
            role=data["role"],
            phone=data.get("phone"),
            organization_name=data.get("organization_name"),
        )
        db.session.add(user)
        db.session.flush()

        # If NGO, create associated profile
        if user.role.upper() == "NGO":
            ngo = NGOProfile(
                user_id=user.id,
                mission_statement=data.get("mission_statement", "To create impact."),
                sector=data.get("sector", "General"),
                geographic_focus=data.get("geographic_focus", "Global"),
                verification_status="PENDING",
            )
            update_ngo_credibility(ngo)
            db.session.add(ngo)

        db.session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "user": {
                        "id": user.id,
                        "name": user.name,
                        "email": user.email,
                        "role": user.role,
                    },
                }
            ),
            201,
        )

    @app.route("/api/auth/login", methods=["POST"])
    def login():
        data = request.json or {}
        email = data.get("email")
        password = data.get("password")
        if not email or not password:
            return (
                jsonify(
                    {"status": "error", "message": "Email and password are required"}
                ),
                400,
            )

        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401

        # For demo purposes, return the user id as a pseudo-token
        return (
            jsonify(
                {
                    "status": "success",
                    "token": str(user.id),
                    "user": {
                        "id": user.id,
                        "name": user.name,
                        "email": user.email,
                        "role": user.role,
                    },
                }
            ),
            200,
        )

    @app.route("/api/users/me", methods=["GET"])
    def me():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        profile = None
        if user.role.upper() == "NGO" and user.ngo_profile:
            profile = {
                "id": user.ngo_profile.id,
                "mission_statement": user.ngo_profile.mission_statement,
                "sector": user.ngo_profile.sector,
                "geographic_focus": user.ngo_profile.geographic_focus,
                "verification_status": user.ngo_profile.verification_status,
                "credibility_score": user.ngo_profile.credibility_score,
            }

        return (
            jsonify(
                {
                    "status": "success",
                    "user": {
                        "id": user.id,
                        "name": user.name,
                        "email": user.email,
                        "role": user.role,
                        "organization_name": user.organization_name,
                    },
                    "ngo_profile": profile,
                }
            ),
            200,
        )

    # ---------- NGO Profile & Verification ----------
    @app.route("/api/ngos/<int:ngo_id>", methods=["GET"])
    def get_ngo(ngo_id: int):
        ngo = NGOProfile.query.get_or_404(ngo_id)
        return (
            jsonify(
                {
                    "id": ngo.id,
                    "user_id": ngo.user_id,
                    "mission_statement": ngo.mission_statement,
                    "sector": ngo.sector,
                    "geographic_focus": ngo.geographic_focus,
                    "verification_status": ngo.verification_status,
                    "credibility_score": ngo.credibility_score,
                }
            ),
            200,
        )

    @app.route("/api/ngos/<int:ngo_id>", methods=["PUT"])
    def update_ngo(ngo_id: int):
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        ngo = NGOProfile.query.get_or_404(ngo_id)
        if ngo.user_id != user.id:
            return jsonify({"status": "error", "message": "Forbidden"}), 403

        data = request.json or {}
        for field in ["mission_statement", "sector", "geographic_focus"]:
            if field in data:
                setattr(ngo, field, data[field])

        db.session.commit()
        update_ngo_credibility(ngo)
        db.session.commit()

        return jsonify({"status": "success"}), 200

    @app.route("/api/ngos/<int:ngo_id>/verify", methods=["POST"])
    def verify_ngo(ngo_id: int):
        # In a real system this would be restricted to platform admins or auditors.
        data = request.json or {}
        status = data.get("verification_status", "VERIFIED")

        ngo = NGOProfile.query.get_or_404(ngo_id)
        ngo.verification_status = status
        update_ngo_credibility(ngo)
        db.session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "ngo": {
                        "id": ngo.id,
                        "verification_status": ngo.verification_status,
                        "credibility_score": ngo.credibility_score,
                    },
                }
            ),
            200,
        )

    @app.route("/api/ngos", methods=["GET"])
    def list_ngos():
        ngos = NGOProfile.query.all()
        payload = [
            {
                "id": ngo.id,
                "user_id": ngo.user_id,
                "name": ngo.user.organization_name or ngo.user.name,
                "sector": ngo.sector,
                "geographic_focus": ngo.geographic_focus,
                "verification_status": ngo.verification_status,
                "credibility_score": ngo.credibility_score,
            }
            for ngo in ngos
        ]
        return jsonify({"status": "success", "ngos": payload}), 200

    # ---------- Social Networking Engine ----------
    @app.route("/api/relationships/mine", methods=["GET"])
    def my_relationships():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        rels = UserRelationship.query.filter_by(follower_id=user.id).all()
        followee_ids = [r.followee_id for r in rels]
        return jsonify({"status": "success", "followee_ids": followee_ids}), 200

    @app.route("/api/relationships/follow", methods=["POST"])
    def follow_user():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        data = request.json or {}
        followee_id = data.get("followee_id")
        if not followee_id:
            return jsonify({"status": "error", "message": "followee_id required"}), 400

        if int(followee_id) == user.id:
            return (
                jsonify({"status": "error", "message": "Cannot follow yourself"}),
                400,
            )

        existing = UserRelationship.query.filter_by(
            follower_id=user.id, followee_id=followee_id
        ).first()
        if existing:
            return jsonify({"status": "success", "message": "Already following"}), 200

        rel = UserRelationship(follower_id=user.id, followee_id=followee_id)
        db.session.add(rel)
        db.session.commit()
        return jsonify({"status": "success"}), 201

    @app.route("/api/relationships/unfollow", methods=["POST"])
    def unfollow_user():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        data = request.json or {}
        followee_id = data.get("followee_id")
        if not followee_id:
            return jsonify({"status": "error", "message": "followee_id required"}), 400

        rel = UserRelationship.query.filter_by(
            follower_id=user.id, followee_id=followee_id
        ).first()
        if not rel:
            return jsonify({"status": "success", "message": "Not following"}), 200

        db.session.delete(rel)
        db.session.commit()
        return jsonify({"status": "success"}), 200

    @app.route("/api/posts", methods=["POST"])
    def create_post():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        data = request.json or {}
        content = clean_content(data.get("content", ""))
        if not content:
            return jsonify({"status": "error", "message": "Content is required"}), 400

        post = Post(
            content=content,
            media_url=data.get("media_url"),
            visibility=data.get("visibility", "PUBLIC"),
            author_id=user.id,
            ngo_id=user.ngo_profile.id if user.role.upper() == "NGO" else None,
        )
        db.session.add(post)
        db.session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "post": {
                        "id": post.id,
                        "content": post.content,
                        "created_at": post.created_at.isoformat(),
                    },
                }
            ),
            201,
        )

    @app.route("/api/feed", methods=["GET"])
    def get_feed():
        user = get_current_user()

        # Basic feed: posts ordered by recency, with optional follow-based filtering
        query = Post.query
        if user:
            followee_ids = [
                r.followee_id
                for r in UserRelationship.query.filter_by(follower_id=user.id).all()
            ]
            if followee_ids:
                query = query.filter(Post.author_id.in_(followee_ids))

        posts = (
            query.order_by(Post.created_at.desc()).limit(50).all()
        )  # recency-based

        payload = []
        for p in posts:
            payload.append(
                {
                    "id": p.id,
                    "content": p.content,
                    "media_url": p.media_url,
                    "created_at": p.created_at.isoformat(),
                    "author_name": p.author.name if p.author else None,
                    "ngo_name": p.ngo.user.organization_name if p.ngo else None,
                    "like_count": p.like_count,
                    "comment_count": p.comment_count,
                    "share_count": p.share_count,
                }
            )

        return jsonify({"status": "success", "feed": payload}), 200

    @app.route("/api/posts/<int:post_id>/like", methods=["POST"])
    def like_post(post_id: int):
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        post = Post.query.get_or_404(post_id)
        existing = Interaction.query.filter_by(
            post_id=post.id, user_id=user.id, type="LIKE"
        ).first()
        if existing:
            return jsonify({"status": "success", "message": "Already liked"}), 200

        interaction = Interaction(post_id=post.id, user_id=user.id, type="LIKE")
        post.like_count += 1
        db.session.add(interaction)
        db.session.commit()

        return jsonify({"status": "success", "like_count": post.like_count}), 201

    @app.route("/api/posts/<int:post_id>/comments", methods=["POST"])
    def comment_post(post_id: int):
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        post = Post.query.get_or_404(post_id)
        data = request.json or {}
        text = clean_content(data.get("comment_text", ""))
        if not text:
            return jsonify({"status": "error", "message": "comment_text required"}), 400

        interaction = Interaction(
            post_id=post.id, user_id=user.id, type="COMMENT", comment_text=text
        )
        post.comment_count += 1
        db.session.add(interaction)
        db.session.commit()

        return jsonify({"status": "success", "comment_count": post.comment_count}), 201

    @app.route("/api/posts/<int:post_id>/comments", methods=["GET"])
    def list_comments(post_id: int):
        post = Post.query.get_or_404(post_id)

        comments = (
            Interaction.query.filter_by(post_id=post.id, type="COMMENT")
            .order_by(Interaction.created_at.asc())
            .limit(100)
            .all()
        )
        payload = []
        for c in comments:
            payload.append(
                {
                    "id": c.id,
                    "user_id": c.user_id,
                    "user_name": c.user.name if c.user else None,
                    "comment_text": c.comment_text,
                    "created_at": c.created_at.isoformat(),
                }
            )
        return jsonify({"status": "success", "comments": payload}), 200

    @app.route("/api/posts/<int:post_id>/share", methods=["POST"])
    def share_post(post_id: int):
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        post = Post.query.get_or_404(post_id)
        interaction = Interaction(post_id=post.id, user_id=user.id, type="SHARE")
        post.share_count += 1
        db.session.add(interaction)
        db.session.commit()

        return jsonify({"status": "success", "share_count": post.share_count}), 201

    # ---------- Transactions & Analytics ----------
    @app.route("/api/transactions", methods=["POST"])
    def create_transaction():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        data = request.json or {}
        ngo_id = data.get("ngo_id")
        amount = data.get("amount")
        if not ngo_id or amount is None:
            return (
                jsonify(
                    {"status": "error", "message": "ngo_id and amount are required"}
                ),
                400,
            )

        ngo = NGOProfile.query.get_or_404(ngo_id)
        tx = Transaction(
            ngo_id=ngo.id,
            donor_id=user.id,
            amount=amount,
            currency=data.get("currency", "USD"),
            description=data.get("description"),
        )
        db.session.add(tx)
        db.session.commit()

        update_ngo_credibility(ngo)
        db.session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "transaction": {
                        "id": tx.id,
                        "ngo_id": tx.ngo_id,
                        "amount": float(tx.amount),
                        "currency": tx.currency,
                        "transacted_at": tx.transacted_at.isoformat(),
                    },
                }
            ),
            201,
        )

    @app.route("/api/transactions/mine", methods=["GET"])
    def list_my_transactions():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        txs = (
            Transaction.query.filter_by(donor_id=user.id)
            .order_by(Transaction.transacted_at.desc())
            .all()
        )
        payload = [
            {
                "id": tx.id,
                "ngo_id": tx.ngo_id,
                "ngo_name": tx.ngo.user.organization_name or tx.ngo.user.name,
                "amount": float(tx.amount),
                "currency": tx.currency,
                "transacted_at": tx.transacted_at.isoformat(),
                "description": tx.description,
            }
            for tx in txs
        ]
        return jsonify({"status": "success", "transactions": payload}), 200

    @app.route("/api/analytics/overview", methods=["GET"])
    def analytics_overview():
        """
        Simple analytics for dashboards:
        - Total amount donated
        - Total per sector
        - Total per NGO
        """
        txs = Transaction.query.all()
        total_amount = sum(float(tx.amount) for tx in txs)

        per_sector = {}
        per_ngo = {}
        for tx in txs:
            ngo = tx.ngo
            sector = ngo.sector
            per_sector[sector] = per_sector.get(sector, 0.0) + float(tx.amount)

            ngo_name = ngo.user.organization_name or ngo.user.name
            per_ngo[ngo_name] = per_ngo.get(ngo_name, 0.0) + float(tx.amount)

        return (
            jsonify(
                {
                    "status": "success",
                    "total_amount": total_amount,
                    "per_sector": per_sector,
                    "per_ngo": per_ngo,
                }
            ),
            200,
        )

    # ---------- AI Matching & Fairness Engine ----------
    @app.route("/api/recommendations", methods=["POST"])
    def recommendations():
        """
        API gateway entry point for the AI Matching & Fairness Engine.
        Receives donor preferences and returns a fairness-adjusted ranking
        of NGOs in JSON format.
        """
        prefs = request.json or {}
        ranked = get_ngo_recommendations(prefs)
        return jsonify({"status": "success", "recommendations": ranked}), 200

    # Backwards-compatibility for the earlier /api/match prototype
    @app.route("/api/match", methods=["POST"])
    def legacy_match():
        prefs = request.json or {}
        ranked = get_ngo_recommendations(prefs)
        return jsonify({"status": "success", "matches": ranked}), 200


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
