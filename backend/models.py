from datetime import datetime

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class User(db.Model, TimestampMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.String(32), nullable=False
    )  # "NGO", "CORPORATE", "INDIVIDUAL"
    phone = db.Column(db.String(50))
    organization_name = db.Column(db.String(255))

    ngo_profile = db.relationship(
        "NGOProfile", uselist=False, back_populates="user", cascade="all, delete-orphan"
    )
    donations = db.relationship(
        "Transaction",
        foreign_keys="Transaction.donor_id",
        back_populates="donor",
        cascade="all, delete-orphan",
    )


class NGOProfile(db.Model, TimestampMixin):
    __tablename__ = "ngo_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    mission_statement = db.Column(db.Text, nullable=False)
    sector = db.Column(db.String(120), nullable=False)  # e.g. "Education", "Health"
    geographic_focus = db.Column(db.String(255), nullable=False)
    verification_status = db.Column(
        db.String(32), nullable=False, default="PENDING"
    )  # "PENDING", "VERIFIED", "REJECTED"
    credibility_score = db.Column(db.Float, nullable=False, default=0.0)

    user = db.relationship("User", back_populates="ngo_profile")
    transactions = db.relationship(
        "Transaction",
        back_populates="ngo",
        cascade="all, delete-orphan",
    )
    posts = db.relationship(
        "Post",
        back_populates="ngo",
        cascade="all, delete-orphan",
    )


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    ngo_id = db.Column(
        db.Integer, db.ForeignKey("ngo_profiles.id", ondelete="CASCADE"), nullable=False
    )
    donor_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(8), nullable=False, default="USD")
    transacted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    description = db.Column(db.String(255))

    ngo = db.relationship("NGOProfile", back_populates="transactions")
    donor = db.relationship("User", back_populates="donations")


class Post(db.Model, TimestampMixin):
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    ngo_id = db.Column(
        db.Integer, db.ForeignKey("ngo_profiles.id", ondelete="CASCADE"), nullable=True
    )
    author_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    content = db.Column(db.Text, nullable=False)
    media_url = db.Column(db.String(512))
    visibility = db.Column(db.String(32), nullable=False, default="PUBLIC")
    like_count = db.Column(db.Integer, nullable=False, default=0)
    comment_count = db.Column(db.Integer, nullable=False, default=0)
    share_count = db.Column(db.Integer, nullable=False, default=0)

    ngo = db.relationship("NGOProfile", back_populates="posts")
    author = db.relationship("User")
    interactions = db.relationship(
        "Interaction",
        back_populates="post",
        cascade="all, delete-orphan",
    )


class Interaction(db.Model, TimestampMixin):
    __tablename__ = "interactions"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(
        db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type = db.Column(
        db.String(32), nullable=False
    )  # "LIKE", "COMMENT", "SHARE"
    comment_text = db.Column(db.Text)

    post = db.relationship("Post", back_populates="interactions")
    user = db.relationship("User")


class UserRelationship(db.Model):
    __tablename__ = "user_relationships"

    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    followee_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    follower = db.relationship("User", foreign_keys=[follower_id])
    followee = db.relationship("User", foreign_keys=[followee_id])

    __table_args__ = (
        db.UniqueConstraint("follower_id", "followee_id", name="uq_user_follow"),
    )

