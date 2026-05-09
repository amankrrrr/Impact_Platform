# from datetime import datetime, timedelta
# import re
# import os
# import secrets

# from flask import Flask, jsonify, request, send_from_directory
# from flask_cors import CORS
# from werkzeug.utils import secure_filename
# from werkzeug.security import check_password_hash, generate_password_hash

# # Load environment variables from .env file
# from dotenv import load_dotenv
# load_dotenv()

# from pathlib import Path

# # Support running both as a package module (preferred: `python -m backend.app`)
# # and as a standalone script from the `backend` directory (`python app.py`).
# try:  # package import
#     from .models import (
#         NGOProfile,
#         Interaction,
#         Post,
#         Transaction,
#         User,
#         UserRelationship,
#         db,
#     )
#     from .ml_engine.fairness_matching import get_ngo_recommendations
#     from .ngo_catalog import NGO_CATALOG
# except ImportError:  # script import fallback
#     from backend.models import (  # type: ignore
#         NGOProfile,
#         Interaction,
#         Post,
#         Transaction,
#         User,
#         UserRelationship,
#         db,
#     )
#     from backend.ml_engine.fairness_matching import get_ngo_recommendations  # type: ignore
#     from backend.ngo_catalog import NGO_CATALOG  # type: ignore


# BASE_DIR = Path(__file__).resolve().parent.parent
# FRONTEND_DIR = BASE_DIR / "frontend"
# UPLOAD_DIR = FRONTEND_DIR / "uploads"


# def create_app():
#     """
#     API Gateway / application factory.

#     This function wires together:
#     - Database models
#     - Social networking engine
#     - AI matching & fairness engine
#     """
#     # Single Flask app serves both the JSON API and the React SPA.
#     # Configure the frontend "build" directory as the static folder so that
#     # paths like /css/styles.css and /js/app.js resolve correctly.
#     app = Flask(
#         __name__,
#         static_folder=str(FRONTEND_DIR),
#         static_url_path="",  # serve static files from the root path
#     )
#     app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///platform.db"
#     app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
#     app.config["UPLOAD_FOLDER"] = str(UPLOAD_DIR)
#     app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8MB

#     UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

#     CORS(app)
#     db.init_app(app)

#     with app.app_context():
#         db.create_all()
#         seed_ngo_catalog()

#     register_routes(app)
#     return app


# PROFANITY_LIST = ["badword", "dummy", "spam"]  # placeholder moderation list


# def clean_content(text: str) -> str:
#     """Simple content moderation: mask flagged keywords before insertion."""
#     if not text:
#         return text
#     cleaned = text
#     for word in PROFANITY_LIST:
#         pattern = re.compile(re.escape(word), re.IGNORECASE)
#         cleaned = pattern.sub("*" * len(word), cleaned)
#     return cleaned


# def update_ngo_credibility(ngo: NGOProfile):
#     """
#     Compute a dynamic credibility score based on:
#     - Verification status
#     - Historical funding volume
#     - Social activity (posts, interactions)
#     """
#     base = 40.0

#     if ngo.verification_status == "VERIFIED":
#         base += 30.0
#     elif ngo.verification_status == "PENDING":
#         base += 10.0

#     total_funding = sum(float(tx.amount) for tx in ngo.transactions)
#     funding_score = min(total_funding / 10_000.0 * 20.0, 20.0)

#     activity_score = min(len(ngo.posts) * 2.0, 10.0)

#     ngo.credibility_score = min(base + funding_score + activity_score, 100.0)


# def _slugify_for_email(name: str) -> str:
#     slug = re.sub(r"[^a-z0-9]+", "-", str(name).lower()).strip("-")
#     return slug or "ngo"


# def seed_ngo_catalog():
#     """
#     Idempotently seed the NGO database with a curated catalog so that:
#     - The AI matching engine has rich NGO options from day one.
#     - Dashboards and directories can surface sector tags and locations.
#     """
#     # Minimal guard: if there are already more NGO profiles than the catalog,
#     # assume seeding has occurred and skip heavy work.
#     existing_count = NGOProfile.query.count()
#     if existing_count >= len(NGO_CATALOG):
#         return

#     for row in NGO_CATALOG:
#         name = (row.get("name") or "").strip()
#         if not name:
#             continue

#         synthetic_email = f"{_slugify_for_email(name)}@catalog.local"

#         existing_user = User.query.filter(
#             (User.organization_name == name) | (User.email == synthetic_email)
#         ).first()

#         if existing_user and existing_user.ngo_profile:
#             # Already seeded.
#             continue

#         if not existing_user:
#             user = User(
#                 name=name,
#                 email=synthetic_email,
#                 password_hash=generate_password_hash("catalog-seeded-ngo"),
#                 role="NGO",
#                 organization_name=name,
#             )
#             db.session.add(user)
#             db.session.flush()
#         else:
#             user = existing_user

#         if not user.ngo_profile:
#             state = (row.get("state") or "").strip()
#             country = (row.get("country") or "").strip()
#             geo_parts = [part for part in (state, country) if part]
#             geographic_focus = ", ".join(geo_parts) if geo_parts else "Global"

#             description = (row.get("description") or "To create impact.").strip()
#             sector_tags = (row.get("sector_tags") or "General").strip()

#             ngo = NGOProfile(
#                 user_id=user.id,
#                 mission_statement=description,
#                 sector=sector_tags,
#                 geographic_focus=geographic_focus,
#                 verification_status="VERIFIED" if country in {"India", "Global"} else "PENDING",
#             )
#             update_ngo_credibility(ngo)
#             db.session.add(ngo)

#     db.session.commit()


# def get_current_user():
#     """
#     Lightweight auth helper.
#     In a production system you would use JWT or OAuth.
#     Here we accept a simple X-User-Id header for demonstration.
#     """
#     user_id = request.headers.get("X-User-Id")
#     if not user_id:
#         auth_header = request.headers.get("Authorization", "")
#         if auth_header.startswith("Bearer "):
#             user_id = auth_header.split(" ", 1)[1].strip()
#     if not user_id:
#         return None
#     try:
#         return User.query.get(int(user_id))
#     except ValueError:
#         return None


# def register_routes(app: Flask):
#     # ---------- Authentication & Registration ----------
#     @app.route("/api/auth/register", methods=["POST"])
#     def register_user():
#         data = request.json or {}
#         required_fields = ["name", "email", "password", "role"]
#         if not all(data.get(f) for f in required_fields):
#             return (
#                 jsonify(
#                     {
#                         "status": "error",
#                         "message": "Missing required registration fields",
#                     }
#                 ),
#                 400,
#             )

#         if User.query.filter_by(email=data["email"]).first():
#             return jsonify({"status": "error", "message": "Email already in use"}), 409

#         user = User(
#             name=data["name"],
#             email=data["email"],
#             password_hash=generate_password_hash(data["password"]),
#             role=data["role"],
#             phone=data.get("phone"),
#             organization_name=data.get("organization_name"),
#         )
#         db.session.add(user)
#         db.session.flush()

#         # If NGO, create associated profile
#         if user.role.upper() == "NGO":
#             ngo = NGOProfile(
#                 user_id=user.id,
#                 mission_statement=data.get("mission_statement", "To create impact."),
#                 sector=data.get("sector", "General"),
#                 geographic_focus=data.get("geographic_focus", "Global"),
#                 verification_status="PENDING",
#             )
#             update_ngo_credibility(ngo)
#             db.session.add(ngo)

#         db.session.commit()

#         return (
#             jsonify(
#                 {
#                     "status": "success",
#                     "user": {
#                         "id": user.id,
#                         "name": user.name,
#                         "email": user.email,
#                         "role": user.role,
#                     },
#                 }
#             ),
#             201,
#         )

#     @app.route("/api/auth/login", methods=["POST"])
#     def login():
#         data = request.json or {}
#         email = data.get("email")
#         password = data.get("password")
#         if not email or not password:
#             return (
#                 jsonify(
#                     {"status": "error", "message": "Email and password are required"}
#                 ),
#                 400,
#             )

#         user = User.query.filter_by(email=email).first()
#         if not user or not check_password_hash(user.password_hash, password):
#             return jsonify({"status": "error", "message": "Invalid credentials"}), 401

#         # For demo purposes, return the user id as a pseudo-token
#         return (
#             jsonify(
#                 {
#                     "status": "success",
#                     "token": str(user.id),
#                     "user": {
#                         "id": user.id,
#                         "name": user.name,
#                         "email": user.email,
#                         "role": user.role,
#                     },
#                 }
#             ),
#             200,
#         )

#     @app.route("/api/users/me", methods=["GET"])
#     def me():
#         user = get_current_user()
#         if not user:
#             return jsonify({"status": "error", "message": "Unauthorized"}), 401

#         profile = None
#         if user.role.upper() == "NGO" and user.ngo_profile:
#             profile = {
#                 "id": user.ngo_profile.id,
#                 "mission_statement": user.ngo_profile.mission_statement,
#                 "sector": user.ngo_profile.sector,
#                 "geographic_focus": user.ngo_profile.geographic_focus,
#                 "verification_status": user.ngo_profile.verification_status,
#                 "credibility_score": user.ngo_profile.credibility_score,
#             }

#         return (
#             jsonify(
#                 {
#                     "status": "success",
#                     "user": {
#                         "id": user.id,
#                         "name": user.name,
#                         "email": user.email,
#                         "role": user.role,
#                         "organization_name": user.organization_name,
#                     },
#                     "ngo_profile": profile,
#                 }
#             ),
#             200,
#         )

#     # ---------- NGO Profile & Verification ----------
#     @app.route("/api/ngos/<int:ngo_id>", methods=["GET"])
#     def get_ngo(ngo_id: int):
#         ngo = NGOProfile.query.get_or_404(ngo_id)
#         return (
#             jsonify(
#                 {
#                     "id": ngo.id,
#                     "user_id": ngo.user_id,
#                     "mission_statement": ngo.mission_statement,
#                     "sector": ngo.sector,
#                     "geographic_focus": ngo.geographic_focus,
#                     "verification_status": ngo.verification_status,
#                     "credibility_score": ngo.credibility_score,
#                 }
#             ),
#             200,
#         )

#     @app.route("/api/ngos/<int:ngo_id>", methods=["PUT"])
#     def update_ngo(ngo_id: int):
#         user = get_current_user()
#         if not user:
#             return jsonify({"status": "error", "message": "Unauthorized"}), 401

#         ngo = NGOProfile.query.get_or_404(ngo_id)
#         if ngo.user_id != user.id:
#             return jsonify({"status": "error", "message": "Forbidden"}), 403

#         data = request.json or {}
#         for field in ["mission_statement", "sector", "geographic_focus"]:
#             if field in data:
#                 setattr(ngo, field, data[field])

#         db.session.commit()
#         update_ngo_credibility(ngo)
#         db.session.commit()

#         return jsonify({"status": "success"}), 200

#     @app.route("/api/ngos/<int:ngo_id>/verify", methods=["POST"])
#     def verify_ngo(ngo_id: int):
#         # In a real system this would be restricted to platform admins or auditors.
#         data = request.json or {}
#         status = data.get("verification_status", "VERIFIED")

#         ngo = NGOProfile.query.get_or_404(ngo_id)
#         ngo.verification_status = status
#         update_ngo_credibility(ngo)
#         db.session.commit()

#         return (
#             jsonify(
#                 {
#                     "status": "success",
#                     "ngo": {
#                         "id": ngo.id,
#                         "verification_status": ngo.verification_status,
#                         "credibility_score": ngo.credibility_score,
#                     },
#                 }
#             ),
#             200,
#         )

#     @app.route("/api/ngos", methods=["GET"])
#     def list_ngos():
#         ngos = NGOProfile.query.all()
#         payload = [
#             {
#                 "id": ngo.id,
#                 "user_id": ngo.user_id,
#                 "name": ngo.user.organization_name or ngo.user.name,
#                 "sector": ngo.sector,
#                 "geographic_focus": ngo.geographic_focus,
#                 "verification_status": ngo.verification_status,
#                 "credibility_score": ngo.credibility_score,
#                 "description": ngo.mission_statement,
#             }
#             for ngo in ngos
#         ]
#         return jsonify({"status": "success", "ngos": payload}), 200

#     # ---------- Social Networking Engine ----------
#     @app.route("/api/relationships/mine", methods=["GET"])
#     def my_relationships():
#         user = get_current_user()
#         if not user:
#             return jsonify({"status": "error", "message": "Unauthorized"}), 401

#         rels = UserRelationship.query.filter_by(follower_id=user.id).all()
#         followee_ids = [r.followee_id for r in rels]
#         return jsonify({"status": "success", "followee_ids": followee_ids}), 200

#     @app.route("/api/relationships/follow", methods=["POST"])
#     def follow_user():
#         user = get_current_user()
#         if not user:
#             return jsonify({"status": "error", "message": "Unauthorized"}), 401

#         data = request.json or {}
#         followee_id = data.get("followee_id")
#         if not followee_id:
#             return jsonify({"status": "error", "message": "followee_id required"}), 400

#         if int(followee_id) == user.id:
#             return (
#                 jsonify({"status": "error", "message": "Cannot follow yourself"}),
#                 400,
#             )

#         existing = UserRelationship.query.filter_by(
#             follower_id=user.id, followee_id=followee_id
#         ).first()
#         if existing:
#             return jsonify({"status": "success", "message": "Already following"}), 200

#         rel = UserRelationship(follower_id=user.id, followee_id=followee_id)
#         db.session.add(rel)
#         db.session.commit()
#         return jsonify({"status": "success"}), 201

#     @app.route("/api/relationships/unfollow", methods=["POST"])
#     def unfollow_user():
#         user = get_current_user()
#         if not user:
#             return jsonify({"status": "error", "message": "Unauthorized"}), 401

#         data = request.json or {}
#         followee_id = data.get("followee_id")
#         if not followee_id:
#             return jsonify({"status": "error", "message": "followee_id required"}), 400

#         rel = UserRelationship.query.filter_by(
#             follower_id=user.id, followee_id=followee_id
#         ).first()
#         if not rel:
#             return jsonify({"status": "success", "message": "Not following"}), 200

#         db.session.delete(rel)
#         db.session.commit()
#         return jsonify({"status": "success"}), 200

#     @app.route("/api/posts", methods=["POST"])
#     def create_post():
#         user = get_current_user()
#         if not user:
#             return jsonify({"status": "error", "message": "Unauthorized"}), 401

#         data = request.json or {}
#         content = clean_content((data.get("content") or "").strip())
#         media_url = (data.get("media_url") or "").strip() or None
#         if not content and not media_url:
#             return (
#                 jsonify({"status": "error", "message": "Add text or attach media"}),
#                 400,
#             )

#         if not content and media_url:
#             content = "Shared a photo update"

#         post = Post(
#             content=content,
#             media_url=media_url,
#             visibility=data.get("visibility", "PUBLIC"),
#             author_id=user.id,
#             ngo_id=user.ngo_profile.id if user.role.upper() == "NGO" else None,
#         )
#         db.session.add(post)
#         db.session.commit()

#         return (
#             jsonify(
#                 {
#                     "status": "success",
#                     "post": {
#                         "id": post.id,
#                         "content": post.content,
#                         "created_at": post.created_at.isoformat(),
#                     },
#                 }
#             ),
#             201,
#         )

#     @app.route("/api/uploads/media", methods=["POST"])
#     def upload_media():
#         user = get_current_user()
#         if not user:
#             return jsonify({"status": "error", "message": "Unauthorized"}), 401

#         file = request.files.get("file")
#         if not file or not file.filename:
#             return jsonify({"status": "error", "message": "Image file is required"}), 400

#         if not (file.mimetype or "").startswith("image/"):
#             return jsonify({"status": "error", "message": "Only image uploads are allowed"}), 400

#         allowed_ext = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
#         safe_name = secure_filename(file.filename)
#         ext = Path(safe_name).suffix.lower()
#         if ext not in allowed_ext:
#             return jsonify({"status": "error", "message": "Unsupported image format"}), 400

#         stem = Path(safe_name).stem or "image"
#         unique_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{secrets.token_hex(4)}_{stem}{ext}"
#         destination = Path(app.config["UPLOAD_FOLDER"]) / unique_name
#         file.save(destination)

#         return jsonify({"status": "success", "media_url": f"/uploads/{unique_name}"}), 201

#     @app.route("/api/feed", methods=["GET"])
#     def get_feed():
#         user = get_current_user()

#         # Basic feed: posts ordered by recency, with optional follow-based filtering
#         query = Post.query
#         if user:
#             followee_ids = [
#                 r.followee_id
#                 for r in UserRelationship.query.filter_by(follower_id=user.id).all()
#             ]
#             if followee_ids:
#                 query = query.filter(Post.author_id.in_(followee_ids))

#         posts = (
#             query.order_by(Post.created_at.desc()).limit(50).all()
#         )  # recency-based

#         payload = []
#         for p in posts:
#             payload.append(
#                 {
#                     "id": p.id,
#                     "content": p.content,
#                     "media_url": p.media_url,
#                     "created_at": p.created_at.isoformat(),
#                     "author_name": p.author.name if p.author else None,
#                     "ngo_name": p.ngo.user.organization_name if p.ngo else None,
#                     "like_count": p.like_count,
#                     "comment_count": p.comment_count,
#                     "share_count": p.share_count,
#                 }
#             )

#         return jsonify({"status": "success", "feed": payload}), 200

#     @app.route("/api/posts/<int:post_id>/like", methods=["POST"])
#     def like_post(post_id: int):
#         user = get_current_user()
#         if not user:
#             return jsonify({"status": "error", "message": "Unauthorized"}), 401

#         post = Post.query.get_or_404(post_id)
#         existing = Interaction.query.filter_by(
#             post_id=post.id, user_id=user.id, type="LIKE"
#         ).first()
#         if existing:
#             return jsonify({"status": "success", "message": "Already liked"}), 200

#         interaction = Interaction(post_id=post.id, user_id=user.id, type="LIKE")
#         post.like_count += 1
#         db.session.add(interaction)
#         db.session.commit()

#         return jsonify({"status": "success", "like_count": post.like_count}), 201

#     @app.route("/api/posts/<int:post_id>/comments", methods=["POST"])
#     def comment_post(post_id: int):
#         user = get_current_user()
#         if not user:
#             return jsonify({"status": "error", "message": "Unauthorized"}), 401

#         post = Post.query.get_or_404(post_id)
#         data = request.json or {}
#         text = clean_content(data.get("comment_text", ""))
#         if not text:
#             return jsonify({"status": "error", "message": "comment_text required"}), 400

#         interaction = Interaction(
#             post_id=post.id, user_id=user.id, type="COMMENT", comment_text=text
#         )
#         post.comment_count += 1
#         db.session.add(interaction)
#         db.session.commit()

#         return jsonify({"status": "success", "comment_count": post.comment_count}), 201

#     @app.route("/api/posts/<int:post_id>/comments", methods=["GET"])
#     def list_comments(post_id: int):
#         post = Post.query.get_or_404(post_id)

#         comments = (
#             Interaction.query.filter_by(post_id=post.id, type="COMMENT")
#             .order_by(Interaction.created_at.asc())
#             .limit(100)
#             .all()
#         )
#         payload = []
#         for c in comments:
#             payload.append(
#                 {
#                     "id": c.id,
#                     "user_id": c.user_id,
#                     "user_name": c.user.name if c.user else None,
#                     "comment_text": c.comment_text,
#                     "created_at": c.created_at.isoformat(),
#                 }
#             )
#         return jsonify({"status": "success", "comments": payload}), 200

#     @app.route("/api/posts/<int:post_id>/share", methods=["POST"])
#     def share_post(post_id: int):
#         user = get_current_user()
#         if not user:
#             return jsonify({"status": "error", "message": "Unauthorized"}), 401

#         post = Post.query.get_or_404(post_id)
#         interaction = Interaction(post_id=post.id, user_id=user.id, type="SHARE")
#         post.share_count += 1
#         db.session.add(interaction)
#         db.session.commit()

#         return jsonify({"status": "success", "share_count": post.share_count}), 201

#     # ---------- Transactions & Analytics ----------
#     @app.route("/api/transactions", methods=["POST"])
#     def create_transaction():
#         user = get_current_user()
#         if not user:
#             return jsonify({"status": "error", "message": "Unauthorized"}), 401

#         data = request.json or {}
#         ngo_id = data.get("ngo_id")
#         amount = data.get("amount")
#         if not ngo_id or amount is None:
#             return (
#                 jsonify(
#                     {"status": "error", "message": "ngo_id and amount are required"}
#                 ),
#                 400,
#             )

#         ngo = NGOProfile.query.get_or_404(ngo_id)
#         tx = Transaction(
#             ngo_id=ngo.id,
#             donor_id=user.id,
#             amount=amount,
#             currency=data.get("currency", "USD"),
#             description=data.get("description"),
#         )
#         db.session.add(tx)
#         db.session.commit()

#         update_ngo_credibility(ngo)
#         db.session.commit()

#         return (
#             jsonify(
#                 {
#                     "status": "success",
#                     "transaction": {
#                         "id": tx.id,
#                         "ngo_id": tx.ngo_id,
#                         "amount": float(tx.amount),
#                         "currency": tx.currency,
#                         "transacted_at": tx.transacted_at.isoformat(),
#                     },
#                 }
#             ),
#             201,
#         )

#     @app.route("/api/transactions/mine", methods=["GET"])
#     def list_my_transactions():
#         user = get_current_user()
#         if not user:
#             return jsonify({"status": "error", "message": "Unauthorized"}), 401

#         txs = (
#             Transaction.query.filter_by(donor_id=user.id)
#             .order_by(Transaction.transacted_at.desc())
#             .all()
#         )
#         payload = [
#             {
#                 "id": tx.id,
#                 "ngo_id": tx.ngo_id,
#                 "ngo_name": tx.ngo.user.organization_name or tx.ngo.user.name,
#                 "amount": float(tx.amount),
#                 "currency": tx.currency,
#                 "transacted_at": tx.transacted_at.isoformat(),
#                 "description": tx.description,
#             }
#             for tx in txs
#         ]
#         return jsonify({"status": "success", "transactions": payload}), 200

#     @app.route("/api/analytics/overview", methods=["GET"])
#     def analytics_overview():
#         """
#         Simple analytics for dashboards:
#         - Total amount donated
#         - Total per sector
#         - Total per NGO
#         """
#         txs = Transaction.query.all()
#         total_amount = sum(float(tx.amount) for tx in txs)

#         per_sector = {}
#         per_ngo = {}
#         for tx in txs:
#             ngo = tx.ngo
#             sector = ngo.sector
#             per_sector[sector] = per_sector.get(sector, 0.0) + float(tx.amount)

#             ngo_name = ngo.user.organization_name or ngo.user.name
#             per_ngo[ngo_name] = per_ngo.get(ngo_name, 0.0) + float(tx.amount)

#         return (
#             jsonify(
#                 {
#                     "status": "success",
#                     "total_amount": total_amount,
#                     "per_sector": per_sector,
#                     "per_ngo": per_ngo,
#                 }
#             ),
#             200,
#         )

#     # ---------- AI Matching & Fairness Engine ----------
#     @app.route("/api/recommendations", methods=["POST"])
#     def recommendations():
#         """
#         API gateway entry point for the AI Matching & Fairness Engine.
#         Receives donor preferences and returns a fairness-adjusted ranking
#         of NGOs in JSON format.
#         """
#         prefs = request.json or {}
#         ranked = get_ngo_recommendations(prefs)
#         return jsonify({"status": "success", "recommendations": ranked}), 200

#     # Backwards-compatibility for the earlier /api/match prototype
#     @app.route("/api/match", methods=["POST"])
#     def legacy_match():
#         prefs = request.json or {}
#         ranked = get_ngo_recommendations(prefs)
#         return jsonify({"status": "success", "matches": ranked}), 200

#     # ---------- Chatbot API ----------
#     @app.route("/api/chat", methods=["POST"])
#     def chat():
#         data = request.json or {}
#         user_message = data.get("message", "")
#         if not user_message:
#             return jsonify({"status": "error", "message": "Message is required"}), 400

#         # Prepare context with NGO catalog data (shortened for LLM)
#         ngo_list = [f"- {ngo['name']}: {ngo['sector_tags']} ({ngo['state']})" for ngo in NGO_CATALOG[:20]]  # Limit to first 20 for token efficiency
#         ngo_context = "\n".join(ngo_list) + "\n(And many more NGOs in education, healthcare, environment, etc.)"

#         system_prompt = f"""You are an AI assistant for a unified digital platform that connects NGOs, corporate donors, and individual contributors. 

# You have access to information about the following NGOs in our catalog:

# {ngo_context}

# Your role is to:
# 1. Answer questions about NGOs in our catalog
# 2. Help users find NGOs that match their interests (education, healthcare, environment, etc.)
# 3. Provide information about our platform and how it works
# 4. Be helpful, friendly, and informative

# If a user asks about NGOs not in our catalog, politely explain that we focus on the organizations in our network and suggest similar ones if applicable.

# Keep responses concise but informative."""

#         try:
#             # First check if the question can be answered from our catalog
#             user_lower = user_message.lower()
#             catalog_answer = None

#             # Check if asking about a specific NGO
#             for ngo in NGO_CATALOG:
#                 if ngo['name'].lower() in user_lower:
#                     if 'sector' in user_lower:
#                         catalog_answer = f"The sector of {ngo['name']} is: {ngo['sector_tags']}"
#                     else:
#                         catalog_answer = f"{ngo['name']}: {ngo['description']} (Sector: {ngo['sector_tags']}, Location: {ngo['state']}, {ngo['country']})"
#                     break

#             # Check for country/location queries
#             if not catalog_answer and ("vs" in user_lower or "versus" in user_lower):
#                 # Handle comparison queries like "ind vs nwz"
#                 parts = [p.strip() for p in user_lower.replace("versus", "vs").split("vs")]
#                 if len(parts) == 2:
#                     country1, country2 = parts[0], parts[1]
#                     reply = ""
#                     if "ind" in country1 or "india" in country1:
#                         india_ngos = [ngo for ngo in NGO_CATALOG if ngo['country'].lower() == 'india']
#                         reply += f"India: We have {len(india_ngos)} NGOs including {india_ngos[0]['name']}. "
#                     if "nwz" in country2 or "nz" in country2 or "new zealand" in country2:
#                         reply += "New Zealand: We don't have local NGOs but have global organizations like UNICEF."
#                     if reply:
#                         catalog_answer = reply

#             # Check for general country queries
#             if not catalog_answer:
#                 if "india" in user_lower or "indian" in user_lower or "ind" in user_lower:
#                     india_ngos = [ngo for ngo in NGO_CATALOG if ngo['country'].lower() == 'india']
#                     catalog_answer = f"We have {len(india_ngos)} NGOs from India, including {india_ngos[0]['name']} and {india_ngos[1]['name']}."
#                 elif "new zealand" in user_lower or "nz" in user_lower or "nzw" in user_lower or "nwz" in user_lower:
#                     catalog_answer = "We currently don't have NGOs from New Zealand in our catalog, but we have global organizations like UNICEF and Red Cross that work worldwide."
#                 elif "global" in user_lower or "international" in user_lower:
#                     global_ngos = [ngo for ngo in NGO_CATALOG if ngo['country'].lower() == 'global']
#                     catalog_answer = f"We have global NGOs like {', '.join([ngo['name'] for ngo in global_ngos])}."

#             # If we found a catalog answer, return it
#             if catalog_answer:
#                 print(f"Using catalog answer: {catalog_answer[:100]}...")
#                 return jsonify({"status": "success", "reply": catalog_answer}), 200

#             # If no catalog answer, try Groq API
#             groq_key = os.getenv("GROQ_API_KEY")
#             print(f"DEBUG: GROQ_API_KEY present: {groq_key is not None}")
#             if groq_key:
#                 print(f"Using Groq with key: {groq_key[:10]}...")
#                 from groq import Groq
#                 client = Groq(api_key=groq_key)
#                 response = client.chat.completions.create(
#                     model="meta-llama/llama-4-scout-17b-16e-instruct",
#                     messages=[
#                         {"role": "system", "content": system_prompt},
#                         {"role": "user", "content": user_message}
#                     ],
#                     max_tokens=500,
#                     temperature=0.7
#                 )
#                 reply = response.choices[0].message.content.strip()
#                 print(f"Groq response: {reply[:100]}...")
#                 return jsonify({"status": "success", "reply": reply}), 200
#             else:
#                 print("DEBUG: No GROQ_API_KEY found")
#                 return jsonify({"status": "error", "message": "No AI API key configured", "reply": "Please set your GROQ_API_KEY environment variable to enable AI responses."}), 500
#         except Exception as e:
#             print(f"Error in chat endpoint: {e}")  # Debug logging
#             # Fallback to catalog search if API fails
#             user_lower = user_message.lower()
            
#             # Check if asking about a specific NGO
#             for ngo in NGO_CATALOG:
#                 if ngo['name'].lower() in user_lower:
#                     if 'sector' in user_lower:
#                         reply = f"The sector of {ngo['name']} is: {ngo['sector_tags']}"
#                     else:
#                         reply = f"{ngo['name']}: {ngo['description']} (Sector: {ngo['sector_tags']}, Location: {ngo['state']}, {ngo['country']})"
#                     return jsonify({"status": "success", "reply": reply}), 200
            
#             return jsonify({"status": "error", "message": "Failed to get AI response", "reply": "Sorry, I'm having trouble connecting to my AI service right now. Please try again."}), 500

#     # ---------- Frontend SPA (React) ----------
#     @app.route("/", strict_slashes=False)
#     def index():
#         """
#         Serve the React single-page application shell.

#         All static assets (css, js, images) are served by Flask from the
#         configured static folder (the /frontend directory).
#         """
#         return app.send_static_file("index.html")


# app = create_app()


# if __name__ == "__main__":
#     app.run(debug=True, port=5000)

# app.py  – complete file


from datetime import datetime
import re
import os
import secrets
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
from dotenv import load_dotenv
load_dotenv()
from pathlib import Path
from .crisis_scraper import fetch_crisis_alerts
import logging

logger = logging.getLogger(__name__)

try:
    from .models import (
        NGOProfile, Interaction, Post, Transaction, User, UserRelationship, db,
    )
    from .ml_engine.fairness_matching import (
        get_ngo_recommendations,
        get_donor_matches_for_ngo,
        get_corporate_ngo_matches,
    )
    from .ngo_catalog import NGO_CATALOG
except ImportError:
    from backend.models import (  # type: ignore
        NGOProfile, Interaction, Post, Transaction, User, UserRelationship, db,
    )
    from backend.ml_engine.fairness_matching import (  # type: ignore
        get_ngo_recommendations,
        get_donor_matches_for_ngo,
        get_corporate_ngo_matches,
    )
    from backend.ngo_catalog import NGO_CATALOG  # type: ignore

BASE_DIR     = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
UPLOAD_DIR   = FRONTEND_DIR / "uploads"


def create_app():
    app = Flask(
        __name__,
        static_folder=str(FRONTEND_DIR),
        static_url_path="",
    )
    app.config["SQLALCHEMY_DATABASE_URI"]  = "sqlite:///platform.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_FOLDER"]            = str(UPLOAD_DIR)
    app.config["MAX_CONTENT_LENGTH"]       = 8 * 1024 * 1024
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    CORS(app)
    db.init_app(app)
    with app.app_context():
        db.create_all()
        seed_ngo_catalog()
    register_routes(app)
    return app


PROFANITY_LIST = ["badword", "dummy", "spam"]


def clean_content(text: str) -> str:
    if not text:
        return text
    cleaned = text
    for word in PROFANITY_LIST:
        pattern = re.compile(re.escape(word), re.IGNORECASE)
        cleaned = pattern.sub("*" * len(word), cleaned)
    return cleaned


def update_ngo_credibility(ngo: NGOProfile):
    base = 40.0
    if ngo.verification_status == "VERIFIED":
        base += 30.0
    elif ngo.verification_status == "PENDING":
        base += 10.0
    total_funding  = sum(float(tx.amount) for tx in ngo.transactions)
    funding_score  = min(total_funding / 10_000.0 * 20.0, 20.0)
    activity_score = min(len(ngo.posts) * 2.0, 10.0)
    ngo.credibility_score = min(base + funding_score + activity_score, 100.0)


def _slugify_for_email(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", str(name).lower()).strip("-")
    return slug or "ngo"


def seed_ngo_catalog():
    existing_count = NGOProfile.query.count()
    if existing_count >= len(NGO_CATALOG):
        return
    for row in NGO_CATALOG:
        name = (row.get("name") or "").strip()
        if not name:
            continue
        synthetic_email = f"{_slugify_for_email(name)}@catalog.local"
        existing_user = User.query.filter(
            (User.organization_name == name) | (User.email == synthetic_email)
        ).first()
        if existing_user and existing_user.ngo_profile:
            continue
        if not existing_user:
            user = User(
                name=name,
                email=synthetic_email,
                password_hash=generate_password_hash("catalog-seeded-ngo"),
                role="NGO",
                organization_name=name,
            )
            db.session.add(user)
            db.session.flush()
        else:
            user = existing_user
        if not user.ngo_profile:
            state   = (row.get("state")   or "").strip()
            country = (row.get("country") or "").strip()
            geo_parts        = [p for p in (state, country) if p]
            geographic_focus = ", ".join(geo_parts) if geo_parts else "Global"
            description      = (row.get("description") or "To create impact.").strip()
            sector_tags      = (row.get("sector_tags")  or "General").strip()
            ngo = NGOProfile(
                user_id=user.id,
                mission_statement=description,
                sector=sector_tags,
                geographic_focus=geographic_focus,
                verification_status="VERIFIED" if country in {"India", "Global"} else "PENDING",
            )
            update_ngo_credibility(ngo)
            db.session.add(ngo)
    db.session.commit()


def get_current_user():
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            user_id = auth_header.split(" ", 1)[1].strip()
    if not user_id:
        return None
    try:
        return User.query.get(int(user_id))
    except ValueError:
        return None


def register_routes(app: Flask):

    # Add this route
    @app.route("/api/crisis/alerts", methods=["GET"])
    def get_crisis_alerts():
        """
        Scrape live crisis data and match with platform NGOs.
        Public endpoint — no auth required (read-only).
        """
        try:
            # Fetch registered NGOs from DB
            db_ngos = []
            try:
                from backend.models import NGOProfile, User
                for profile in NGOProfile.query.all():
                    name = (
                        profile.user.organization_name
                        if profile.user and profile.user.organization_name
                        else (profile.user.name if profile.user else "Unknown")
                    )
                    db_ngos.append({
                        "id":                  profile.id,
                        "name":                name,
                        "sector":              profile.sector or "",
                        "geographic_focus":    profile.geographic_focus or "",
                        "description":         profile.mission_statement or "",
                        "verification_status": profile.verification_status or "PENDING",
                        "credibility_score":   float(profile.credibility_score or 40),
                    })
            except Exception as e:
                logger.warning(f"Could not load DB NGOs for crisis: {e}")

            # Fetch catalog NGOs
            catalog_ngos = []
            try:
                from ngo_catalog import NGO_CATALOG
                catalog_ngos = NGO_CATALOG
            except Exception as e:
                logger.warning(f"Could not load catalog for crisis: {e}")

            result = fetch_crisis_alerts(db_ngos, catalog_ngos)
            return jsonify(result), 200

        except Exception as e:
            logger.error(f"Crisis alerts error: {e}")
            return jsonify({
                "crises": [],
                "total": 0,
                "error": str(e),
                "source_statuses": {},
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }), 500

    # ------------------------------------------------------------------ #
    #  Auth & Registration                                                 #
    # ------------------------------------------------------------------ #

    @app.route("/api/auth/register", methods=["POST"])
    def register_user():
        data = request.json or {}
        if not all(data.get(f) for f in ["name", "email", "password", "role"]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"status": "error", "message": "Email already in use"}), 409
        user = User(
            name=data["name"], email=data["email"],
            password_hash=generate_password_hash(data["password"]),
            role=data["role"], phone=data.get("phone"),
            organization_name=data.get("organization_name"),
        )
        db.session.add(user)
        db.session.flush()
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
        return jsonify({
            "status": "success",
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
        }), 201

    @app.route("/api/auth/login", methods=["POST"])
    def login():
        data = request.json or {}
        email, password = data.get("email"), data.get("password")
        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password required"}), 400
        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401
        return jsonify({
            "status": "success", "token": str(user.id),
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
        }), 200

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
        return jsonify({
            "status": "success",
            "user": {
                "id": user.id, "name": user.name, "email": user.email,
                "role": user.role, "organization_name": user.organization_name,
            },
            "ngo_profile": profile,
        }), 200

    # ------------------------------------------------------------------ #
    #  NGO Profile & Verification                                          #
    # ------------------------------------------------------------------ #

    @app.route("/api/ngos/<int:ngo_id>", methods=["GET"])
    def get_ngo(ngo_id: int):
        ngo = NGOProfile.query.get_or_404(ngo_id)
        return jsonify({
            "id": ngo.id, "user_id": ngo.user_id,
            "mission_statement": ngo.mission_statement,
            "sector": ngo.sector, "geographic_focus": ngo.geographic_focus,
            "verification_status": ngo.verification_status,
            "credibility_score": ngo.credibility_score,
        }), 200

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
        update_ngo_credibility(ngo)
        db.session.commit()
        return jsonify({"status": "success"}), 200

    @app.route("/api/ngos/<int:ngo_id>/verify", methods=["POST"])
    def verify_ngo(ngo_id: int):
        data   = request.json or {}
        status = data.get("verification_status", "VERIFIED")
        ngo    = NGOProfile.query.get_or_404(ngo_id)
        ngo.verification_status = status
        update_ngo_credibility(ngo)
        db.session.commit()
        return jsonify({
            "status": "success",
            "ngo": {"id": ngo.id, "verification_status": ngo.verification_status,
                    "credibility_score": ngo.credibility_score},
        }), 200

    @app.route("/api/ngos", methods=["GET"])
    def list_ngos():
        ngos = NGOProfile.query.all()
        return jsonify({
            "status": "success",
            "ngos": [
                {
                    "id": ngo.id, "user_id": ngo.user_id,
                    "name": ngo.user.organization_name or ngo.user.name,
                    "sector": ngo.sector, "geographic_focus": ngo.geographic_focus,
                    "verification_status": ngo.verification_status,
                    "credibility_score": ngo.credibility_score,
                    "description": ngo.mission_statement,
                }
                for ngo in ngos
            ],
        }), 200

    # ------------------------------------------------------------------ #
    #  Social Networking                                                   #
    # ------------------------------------------------------------------ #

    @app.route("/api/relationships/mine", methods=["GET"])
    def my_relationships():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        rels = UserRelationship.query.filter_by(follower_id=user.id).all()
        return jsonify({"status": "success", "followee_ids": [r.followee_id for r in rels]}), 200

    @app.route("/api/relationships/follow", methods=["POST"])
    def follow_user():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        data        = request.json or {}
        followee_id = data.get("followee_id")
        if not followee_id:
            return jsonify({"status": "error", "message": "followee_id required"}), 400
        if int(followee_id) == user.id:
            return jsonify({"status": "error", "message": "Cannot follow yourself"}), 400
        if UserRelationship.query.filter_by(follower_id=user.id, followee_id=followee_id).first():
            return jsonify({"status": "success", "message": "Already following"}), 200
        db.session.add(UserRelationship(follower_id=user.id, followee_id=followee_id))
        db.session.commit()
        return jsonify({"status": "success"}), 201

    @app.route("/api/relationships/unfollow", methods=["POST"])
    def unfollow_user():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        data        = request.json or {}
        followee_id = data.get("followee_id")
        if not followee_id:
            return jsonify({"status": "error", "message": "followee_id required"}), 400
        rel = UserRelationship.query.filter_by(follower_id=user.id, followee_id=followee_id).first()
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
        data      = request.json or {}
        content   = clean_content((data.get("content") or "").strip())
        media_url = (data.get("media_url") or "").strip() or None
        if not content and not media_url:
            return jsonify({"status": "error", "message": "Add text or attach media"}), 400
        if not content:
            content = "Shared a photo update"
        post = Post(
            content=content, media_url=media_url,
            visibility=data.get("visibility", "PUBLIC"),
            author_id=user.id,
            ngo_id=user.ngo_profile.id if user.role.upper() == "NGO" else None,
        )
        db.session.add(post)
        db.session.commit()
        return jsonify({
            "status": "success",
            "post": {"id": post.id, "content": post.content,
                     "created_at": post.created_at.isoformat()},
        }), 201

    @app.route("/api/uploads/media", methods=["POST"])
    def upload_media():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        file = request.files.get("file")
        if not file or not file.filename:
            return jsonify({"status": "error", "message": "Image file required"}), 400
        if not (file.mimetype or "").startswith("image/"):
            return jsonify({"status": "error", "message": "Only images allowed"}), 400
        allowed_ext = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
        safe_name   = secure_filename(file.filename)
        ext         = Path(safe_name).suffix.lower()
        if ext not in allowed_ext:
            return jsonify({"status": "error", "message": "Unsupported format"}), 400
        stem        = Path(safe_name).stem or "image"
        unique_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{secrets.token_hex(4)}_{stem}{ext}"
        file.save(Path(app.config["UPLOAD_FOLDER"]) / unique_name)
        return jsonify({"status": "success", "media_url": f"/uploads/{unique_name}"}), 201

    @app.route("/api/feed", methods=["GET"])
    def get_feed():
        user  = get_current_user()
        query = Post.query
        if user:
            followee_ids = [r.followee_id for r in UserRelationship.query.filter_by(follower_id=user.id).all()]
            if followee_ids:
                query = query.filter(Post.author_id.in_(followee_ids))
        posts = query.order_by(Post.created_at.desc()).limit(50).all()
        return jsonify({
            "status": "success",
            "feed": [
                {
                    "id": p.id, "content": p.content, "media_url": p.media_url,
                    "created_at": p.created_at.isoformat(),
                    "author_name": p.author.name if p.author else None,
                    "ngo_name": p.ngo.user.organization_name if p.ngo else None,
                    "like_count": p.like_count, "comment_count": p.comment_count,
                    "share_count": p.share_count,
                }
                for p in posts
            ],
        }), 200

    @app.route("/api/posts/<int:post_id>/like", methods=["POST"])
    def like_post(post_id: int):
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        post = Post.query.get_or_404(post_id)
        if Interaction.query.filter_by(post_id=post.id, user_id=user.id, type="LIKE").first():
            return jsonify({"status": "success", "message": "Already liked"}), 200
        post.like_count += 1
        db.session.add(Interaction(post_id=post.id, user_id=user.id, type="LIKE"))
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
        post.comment_count += 1
        db.session.add(Interaction(post_id=post.id, user_id=user.id, type="COMMENT", comment_text=text))
        db.session.commit()
        return jsonify({"status": "success", "comment_count": post.comment_count}), 201

    @app.route("/api/posts/<int:post_id>/comments", methods=["GET"])
    def list_comments(post_id: int):
        post     = Post.query.get_or_404(post_id)
        comments = (
            Interaction.query.filter_by(post_id=post.id, type="COMMENT")
            .order_by(Interaction.created_at.asc()).limit(100).all()
        )
        return jsonify({
            "status": "success",
            "comments": [
                {
                    "id": c.id, "user_id": c.user_id,
                    "user_name": c.user.name if c.user else None,
                    "comment_text": c.comment_text,
                    "created_at": c.created_at.isoformat(),
                }
                for c in comments
            ],
        }), 200

    @app.route("/api/posts/<int:post_id>/share", methods=["POST"])
    def share_post(post_id: int):
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        post = Post.query.get_or_404(post_id)
        post.share_count += 1
        db.session.add(Interaction(post_id=post.id, user_id=user.id, type="SHARE"))
        db.session.commit()
        return jsonify({"status": "success", "share_count": post.share_count}), 201

    # ------------------------------------------------------------------ #
    #  Transactions & Analytics                                            #
    # ------------------------------------------------------------------ #

    @app.route("/api/transactions", methods=["POST"])
    def create_transaction():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        data   = request.json or {}
        ngo_id = data.get("ngo_id")
        amount = data.get("amount")
        if not ngo_id or amount is None:
            return jsonify({"status": "error", "message": "ngo_id and amount required"}), 400
        ngo = NGOProfile.query.get_or_404(ngo_id)
        tx  = Transaction(
            ngo_id=ngo.id, donor_id=user.id, amount=amount,
            currency=data.get("currency", "USD"),
            description=data.get("description"),
        )
        db.session.add(tx)
        db.session.commit()
        update_ngo_credibility(ngo)
        db.session.commit()
        return jsonify({
            "status": "success",
            "transaction": {
                "id": tx.id, "ngo_id": tx.ngo_id,
                "amount": float(tx.amount), "currency": tx.currency,
                "transacted_at": tx.transacted_at.isoformat(),
            },
        }), 201

    @app.route("/api/transactions/mine", methods=["GET"])
    def list_my_transactions():
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        txs = Transaction.query.filter_by(donor_id=user.id).order_by(Transaction.transacted_at.desc()).all()
        return jsonify({
            "status": "success",
            "transactions": [
                {
                    "id": tx.id, "ngo_id": tx.ngo_id,
                    "ngo_name": tx.ngo.user.organization_name or tx.ngo.user.name,
                    "amount": float(tx.amount), "currency": tx.currency,
                    "transacted_at": tx.transacted_at.isoformat(),
                    "description": tx.description,
                }
                for tx in txs
            ],
        }), 200

    @app.route("/api/analytics/overview", methods=["GET"])
    def analytics_overview():
        txs          = Transaction.query.all()
        total_amount = sum(float(tx.amount) for tx in txs)
        per_sector: dict = {}
        per_ngo:    dict = {}
        for tx in txs:
            ngo  = tx.ngo
            name = ngo.user.organization_name or ngo.user.name
            per_sector[ngo.sector] = per_sector.get(ngo.sector, 0.0) + float(tx.amount)
            per_ngo[name]          = per_ngo.get(name, 0.0)          + float(tx.amount)
        return jsonify({
            "status": "success",
            "total_amount": total_amount,
            "per_sector": per_sector,
            "per_ngo": per_ngo,
        }), 200

    # ================================================================== #
    #  AI Matching & Fairness Engine                                       #
    # ================================================================== #

    @app.route("/api/recommendations", methods=["POST"])
    def recommendations():
        prefs = request.json or {}
        top_n = int(prefs.pop("top_n", 10))
        ranked = get_ngo_recommendations(prefs, top_n=top_n)
        try:
            from backend.ngo_catalog import NGO_CATALOG as _cat
        except ImportError:
            from ngo_catalog import NGO_CATALOG as _cat  # type: ignore
        location_hint = (
            prefs.get("location", "") + prefs.get("region", "") + prefs.get("city", "")
        ).lower()
        return jsonify({
            "status": "success",
            "recommendations": ranked,
            "meta": {
                "total_ngos_evaluated": len(_cat),
                "grassroots_in_results": sum(1 for r in ranked if r.get("recognition_tier") == "grassroots"),
                "location_boost_applied": any(
                    a in location_hint for a in {"mysore", "mysuru", "karnataka", "india"}
                ),
            },
        }), 200

    @app.route("/api/ngo/<int:ngo_id>/donor-matches", methods=["POST"])
    def ngo_to_donor_matches(ngo_id: int):
        ngo   = NGOProfile.query.get_or_404(ngo_id)
        data  = request.json or {}
        top_n = int(data.get("top_n", 10))
        platform_donors = _build_platform_donor_pool()
        extra = data.get("extra_donors", [])
        if isinstance(extra, list):
            platform_donors.extend(extra)
        ngo_prefs = {
            "name": ngo.user.organization_name or ngo.user.name,
            "sector": ngo.sector,
            "description": ngo.mission_statement,
            "geographic_focus": ngo.geographic_focus,
            "mission_statement": ngo.mission_statement,
        }
        if not platform_donors:
            return jsonify({
                "status": "success", "matches": [],
                "meta": {"message": "No donor profiles yet."},
            }), 200
        matches = get_donor_matches_for_ngo(ngo_prefs, platform_donors, top_n=top_n)
        return jsonify({
            "status": "success", "ngo": ngo_prefs["name"], "matches": matches,
            "meta": {"donors_evaluated": len(platform_donors), "top_n": top_n},
        }), 200

    # REPLACE the entire ngo_to_corporate_matches route in app.py

    @app.route("/api/ngo/<int:ngo_id>/corporate-matches", methods=["POST"])
    def ngo_to_corporate_matches(ngo_id: int):
        ngo   = NGOProfile.query.get_or_404(ngo_id)
        data  = request.json or {}
        top_n = int(data.get("top_n", 8))

        ngo_name    = ngo.user.organization_name or ngo.user.name
        ngo_sector  = ngo.sector             or "General"
        ngo_geo     = ngo.geographic_focus   or "India"
        ngo_mission = ngo.mission_statement  or ""

        # Use custom pool if frontend sent one, else use default
        corporate_pool = data.get("corporate_pool") or _default_corporate_pool()

        results = []
        for corp in corporate_pool:
            # Build synthetic donor-style prefs that represent THIS corporate
            corp_as_donor_prefs = {
                "sector":    "|".join(corp.get("csr_focus", [])),
                "sectors":   corp.get("csr_focus", []),
                "location":  corp.get("location", ""),
                "keywords":  corp.get("description", "") + " " + corp.get("keywords", ""),
                "interests": " ".join(corp.get("csr_focus", [])),
            }

            # Build synthetic NGO prefs to score this corporate against
            # We use get_donor_matches_for_ngo: pass the NGO as the "ngo"
            # and the corporate as a single-item donor pool
            corp_as_donor = {
                "name":           corp.get("name", ""),
                "type":           corp.get("type", "corporate"),
                "interests":      " ".join(corp.get("csr_focus", [])),
                "sector_focus":   "|".join(corp.get("csr_focus", [])),
                "location":       corp.get("location", ""),
                "giving_capacity": corp.get("budget_tier", "medium"),
                "description":    corp.get("description", ""),
            }

            ngo_prefs = {
                "name":               ngo_name,
                "sector":             ngo_sector,
                "description":        ngo_mission,
                "mission_statement":  ngo_mission,
                "geographic_focus":   ngo_geo,
            }

            # Score: NGO → single corporate (reuse donor matching engine)
            matches = get_donor_matches_for_ngo(ngo_prefs, [corp_as_donor], top_n=1)

            if matches:
                m = matches[0]
                # Compute sector overlap
                ngo_sectors_set  = {s.strip().lower() for s in ngo_sector.split("|")}
                corp_sectors_set = {s.strip().lower() for s in corp.get("csr_focus", [])}
                overlap = list(ngo_sectors_set & corp_sectors_set)

                # Scale boost for local/regional corporates near NGO geography
                scale_pref  = corp.get("preferred_scale", "")
                score       = m["alignment_score"]
                ngo_geo_low = ngo_geo.lower()
                corp_loc_low = corp.get("location", "").lower()
                if scale_pref in {"local", "regional"}:
                    if any(w in corp_loc_low for w in ngo_geo_low.split()):
                        score = min(score * 1.15, 1.0)

                results.append({
                    "corporate_name":      corp.get("name"),
                    "corporate_type":      corp.get("type", "corporate"),
                    "location":            corp.get("location"),
                    "csr_focus":           corp.get("csr_focus", []),
                    "budget_tier":         corp.get("budget_tier"),
                    "alignment_score":     round(score, 4),
                    "score_breakdown":     m["score_breakdown"],
                    "csr_sector_overlap":  overlap,
                    "preferred_scale":     corp.get("preferred_scale"),
                })

        results.sort(key=lambda x: x["alignment_score"], reverse=True)

        return jsonify({
            "status":            "success",
            "ngo":               ngo_name,
            "sector":            ngo_sector,
            "geographic_focus":  ngo_geo,
            "corporate_matches": results[:top_n],
            "meta": {
                "corporates_evaluated": len(corporate_pool),
                "top_n":                top_n,
            },
        }), 200

    @app.route("/api/match/corporate-to-ngo", methods=["POST"])
    def corporate_to_ngo():
        data  = request.json or {}
        top_n = int(data.pop("top_n", 10))
        ranked = get_corporate_ngo_matches(data, top_n=top_n)
        try:
            from backend.ngo_catalog import NGO_CATALOG as _cat
        except ImportError:
            from ngo_catalog import NGO_CATALOG as _cat  # type: ignore
        return jsonify({
            "status": "success",
            "corporate": data.get("name", "Anonymous Corporate"),
            "matches": ranked,
            "meta": {
                "total_ngos_evaluated": len(_cat),
                "grassroots_in_results": sum(1 for r in ranked if r.get("recognition_tier") == "grassroots"),
                "csr_focus_expanded": data.get("csr_focus", []),
            },
        }), 200

    @app.route("/api/match", methods=["POST"])
    def legacy_match():
        prefs = request.json or {}
        if prefs.get("csr_focus") or prefs.get("budget_tier") or prefs.get("corporate"):
            ranked = get_corporate_ngo_matches(prefs)
        else:
            ranked = get_ngo_recommendations(prefs)
        return jsonify({"status": "success", "matches": ranked}), 200

    @app.route("/api/ngos/explore", methods=["GET"])
    def explore_ngos():
        sector_q      = (request.args.get("sector")   or "").strip().lower()
        state_q       = (request.args.get("state")    or "").strip().lower()
        country_q     = (request.args.get("country")  or "").strip().lower()
        verified_only = request.args.get("verified", "").lower() == "true"
        sort_by       = request.args.get("sort_by", "credibility").lower()
        free_text     = (request.args.get("q") or "").strip().lower()
        page          = max(int(request.args.get("page",     1)),  1)
        per_page      = min(int(request.args.get("per_page", 20)), 50)
        try:
            from backend.ngo_catalog import NGO_CATALOG as _cat
        except ImportError:
            from ngo_catalog import NGO_CATALOG as _cat  # type: ignore
        db_map   = _build_db_ngo_map()
        filtered = []
        for ngo in _cat:
            if sector_q  and sector_q  not in ngo.get("sector_tags", "").lower(): continue
            if state_q   and state_q   not in ngo.get("state",       "").lower(): continue
            if country_q and country_q not in ngo.get("country",     "").lower(): continue
            ngo_name = ngo.get("name", "")
            if verified_only:
                if db_map.get(ngo_name, {}).get("verification_status") != "VERIFIED":
                    continue
            if free_text:
                haystack = (ngo_name + " " + ngo.get("description", "") + " " + ngo.get("sector_tags", "")).lower()
                if free_text not in haystack:
                    continue
            db_rec = db_map.get(ngo_name, {})
            filtered.append({
                "name": ngo_name, "sector_tags": ngo.get("sector_tags"),
                "state": ngo.get("state"), "country": ngo.get("country"),
                "description": ngo.get("description"),
                "verification_status": db_rec.get("verification_status", "VERIFIED"),
                "credibility_score":   db_rec.get("credibility_score",   70.0),
                "recognition_tier":    _get_recognition_tier(ngo_name),
            })
        if sort_by == "name":
            filtered.sort(key=lambda x: x["name"].lower())
        elif sort_by == "sector":
            filtered.sort(key=lambda x: (x["sector_tags"] or "").lower())
        else:
            filtered.sort(key=lambda x: float(x["credibility_score"] or 0), reverse=True)
        total      = len(filtered)
        start      = (page - 1) * per_page
        return jsonify({
            "status": "success", "total": total, "page": page,
            "per_page": per_page, "ngos": filtered[start: start + per_page],
        }), 200

    # ------------------------------------------------------------------ #
    #  NLP Routes  (one definition each)                                  #
    # ------------------------------------------------------------------ #

    @app.route("/api/nlp/query", methods=["POST"])
    def nlp_query():
        try:
            from backend.ml_engine.nlp_query_engine import run_nlp_query
        except ImportError:
            from ml_engine.nlp_query_engine import run_nlp_query  # type: ignore
        data  = request.json or {}
        query = (data.get("query") or "").strip()
        top_n = int(data.get("top_n", 10))
        if not query:
            return jsonify({"status": "error", "message": "query is required"}), 400
        result = run_nlp_query(query, top_n=top_n)
        return jsonify({"status": "success", **result}), 200

    @app.route("/api/nlp/chat", methods=["POST"])
    def nlp_chat():
        try:
            from backend.ml_engine.nlp_query_engine import conversational_query
        except ImportError:
            from ml_engine.nlp_query_engine import conversational_query  # type: ignore
        data       = request.json or {}
        message    = (data.get("message") or "").strip()
        session_id = data.get("session_id") or "default"
        top_n      = int(data.get("top_n", 8))
        if not message:
            return jsonify({"status": "error", "message": "message is required"}), 400
        result = conversational_query(message, session_id=session_id, top_n=top_n)
        return jsonify({"status": "success", **result}), 200

    @app.route("/api/nlp/parse", methods=["POST"])
    def nlp_parse():
        try:
            from backend.ml_engine.nlp_query_engine import parse_query
        except ImportError:
            from ml_engine.nlp_query_engine import parse_query  # type: ignore
        data  = request.json or {}
        query = (data.get("query") or "").strip()
        if not query:
            return jsonify({"status": "error", "message": "query is required"}), 400
        intent = parse_query(query)
        return jsonify({"status": "success", "intent": intent.to_dict()}), 200

    # ------------------------------------------------------------------ #
    #  Chat  –  single unified endpoint                                   #
    # ------------------------------------------------------------------ #

    @app.route("/api/chat", methods=["POST"])
    def chat():
        data       = request.json or {}
        message    = (data.get("message") or "").strip()
        session_id = data.get("session_id") or "default"
        if not message:
            return jsonify({"status": "error", "message": "Message is required"}), 400

        # 1. NLP engine
        try:
            try:
                from backend.ml_engine.nlp_query_engine import conversational_query
            except ImportError:
                from ml_engine.nlp_query_engine import conversational_query  # type: ignore
            nlp_result = conversational_query(message, session_id=session_id, top_n=6)
            if nlp_result.get("results") or nlp_result.get("reply"):
                return jsonify({
                    "status":      "success",
                    "reply":       nlp_result.get("reply", ""),
                    "results":     nlp_result.get("results", []),
                    "intent":      nlp_result.get("intent", {}),
                    "summary":     nlp_result.get("summary", ""),
                    "suggestions": nlp_result.get("suggestions", []),
                }), 200
        except Exception as nlp_err:
            print(f"[NLP] {nlp_err}")

        # 2. Catalog keyword search
        user_lower = message.lower()
        for ngo in NGO_CATALOG:
            if ngo["name"].lower() in user_lower:
                reply = (
                    f"The sector of {ngo['name']} is: {ngo['sector_tags']}"
                    if "sector" in user_lower else
                    f"{ngo['name']}: {ngo['description']} "
                    f"(Sector: {ngo['sector_tags']}, Location: {ngo['state']}, {ngo['country']})"
                )
                return jsonify({"status": "success", "reply": reply, "results": []}), 200

        if "india" in user_lower:
            india_ngos = [n for n in NGO_CATALOG if n["country"].lower() == "india"]
            return jsonify({
                "status": "success",
                "reply": f"We have {len(india_ngos)} NGOs from India, including {india_ngos[0]['name']} and {india_ngos[1]['name']}.",
                "results": [],
            }), 200

        # 3. Groq LLM fallback
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            try:
                from groq import Groq
                ngo_context   = "\n".join(f"- {n['name']}: {n['sector_tags']} ({n['state']})" for n in NGO_CATALOG[:20])
                system_prompt = (
                    "You are ImpactBot, an AI assistant for an NGO platform.\n"
                    f"NGO catalog:\n{ngo_context}\n"
                    "Help users find NGOs and navigate the platform. Be concise."
                )
                response = Groq(api_key=groq_key).chat.completions.create(
                    model="meta-llama/llama-4-scout-17b-16e-instruct",
                    messages=[{"role": "system", "content": system_prompt},
                              {"role": "user",   "content": message}],
                    max_tokens=500, temperature=0.7,
                )
                return jsonify({"status": "success", "reply": response.choices[0].message.content.strip(), "results": []}), 200
            except Exception as e:
                print(f"[Groq] {e}")

        return jsonify({
            "status": "error", "message": "Could not process query",
            "reply": "Try: \"Find education NGOs near Mysuru\"", "results": [],
        }), 500

    # ------------------------------------------------------------------ #
    #  Static file serving  –  LAST so API routes are never swallowed     #
    # ------------------------------------------------------------------ #

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.route("/", strict_slashes=False)
    def index():
        return app.send_static_file("index.html")

# ── Module-level helpers ──────────────────────────────────────────────────────

def _get_recognition_tier(ngo_name: str) -> str:
    try:
        from backend.ml_engine.fairness_matching import _recognition_tier
    except ImportError:
        from ml_engine.fairness_matching import _recognition_tier  # type: ignore
    return _recognition_tier(ngo_name)


def _build_db_ngo_map() -> dict:
    try:
        try:
            from backend.models import NGOProfile as _NGO
        except ImportError:
            from models import NGOProfile as _NGO  # type: ignore
        result = {}
        for rec in _NGO.query.all():
            name = (rec.user.organization_name if rec.user and rec.user.organization_name
                    else (rec.user.name if rec.user else ""))
            result[name] = {
                "credibility_score":   rec.credibility_score,
                "verification_status": rec.verification_status,
            }
        return result
    except Exception:
        return {}


def _build_platform_donor_pool() -> list[dict]:
    try:
        donors = User.query.filter(User.role.in_(["DONOR", "CORPORATE", "donor", "corporate"])).all()
        pool   = []
        for d in donors:
            txs           = Transaction.query.filter_by(donor_id=d.id).all()
            sector_counts: dict[str, int] = {}
            for tx in txs:
                for tag in (tx.ngo.sector if tx.ngo else "General").split("|"):
                    tag = tag.strip()
                    sector_counts[tag] = sector_counts.get(tag, 0) + 1
            top_sectors = sorted(sector_counts, key=sector_counts.get, reverse=True)[:3]  # type: ignore
            pool.append({
                "name": d.organization_name or d.name,
                "type": d.role.lower(),
                "interests":    " ".join(top_sectors),
                "sector_focus": "|".join(top_sectors) if top_sectors else "General",
                "location":     "",
                "giving_capacity": _estimate_capacity(txs),
            })
        return pool
    except Exception:
        return []


def _estimate_capacity(transactions: list) -> str:
    total = sum(float(tx.amount) for tx in transactions)
    if total >= 100_000: return "enterprise"
    if total >= 10_000:  return "high"
    if total >= 1_000:   return "medium"
    return "low"


def _default_corporate_pool() -> list[dict]:
    return [
        {"name": "Infosys Foundation",    "type": "corporate", "csr_focus": ["Education", "Rural Development", "Healthcare"],    "location": "Bengaluru Karnataka India", "budget_tier": "enterprise", "preferred_scale": "regional",  "description": "Education, healthcare, rural upliftment across India."},
        {"name": "Wipro Foundation",       "type": "corporate", "csr_focus": ["Education", "Environment", "Technology"],          "location": "Bengaluru Karnataka India", "budget_tier": "enterprise", "preferred_scale": "national",  "description": "Primary education, ecology, sustainable development."},
        {"name": "Biocon Foundation",      "type": "corporate", "csr_focus": ["Healthcare", "Women Empowerment", "Education"],    "location": "Bengaluru Karnataka India", "budget_tier": "high",       "preferred_scale": "regional",  "description": "Healthcare access, women health, education."},
        {"name": "Tata Trusts",            "type": "corporate", "csr_focus": ["Education", "Healthcare", "Rural Development"],    "location": "Mumbai Maharashtra India",  "budget_tier": "enterprise", "preferred_scale": "national",  "description": "Health, education, water, cultural preservation."},
        {"name": "Azim Premji Philanthropic Initiatives", "type": "corporate", "csr_focus": ["Education", "Social Justice"],      "location": "Bengaluru Karnataka India", "budget_tier": "enterprise", "preferred_scale": "national",  "description": "Systemic education reform and social equity."},
        {"name": "Manipal Foundation",     "type": "corporate", "csr_focus": ["Education", "Healthcare", "Research"],             "location": "Manipal Karnataka India",   "budget_tier": "high",       "preferred_scale": "regional",  "description": "Academic excellence, healthcare, community welfare in Karnataka."},
        {"name": "TVS Motor Foundation",   "type": "corporate", "csr_focus": ["Education", "Skills Development", "Community Development"], "location": "Mysuru Karnataka India", "budget_tier": "high", "preferred_scale": "local",   "description": "Skill development and education around Mysuru."},
        {"name": "Titan Company CSR",      "type": "corporate", "csr_focus": ["Women Empowerment", "Education", "Community Development"], "location": "Bengaluru Karnataka India", "budget_tier": "high", "preferred_scale": "regional", "description": "Women empowerment and education for underprivileged."},
        {"name": "Google.org India",       "type": "corporate", "csr_focus": ["Technology", "Education", "Social Justice"],       "location": "Bengaluru Karnataka India", "budget_tier": "enterprise", "preferred_scale": "national",  "description": "Tech-driven education and economic opportunity."},
        {"name": "Microsoft Philanthropies India", "type": "corporate", "csr_focus": ["Technology", "Skills Development", "Education"], "location": "Hyderabad Telangana India", "budget_tier": "enterprise", "preferred_scale": "national", "description": "Digital skills and cloud-powered social impact."},
    ]


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
