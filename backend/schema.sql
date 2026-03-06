-- Logical database schema for
-- "A Unified Digital Platform for Bridging the Gap between NGOs,
--  Corporate Donors, and Individual Contributors"

CREATE TABLE users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(32)  NOT NULL, -- 'NGO', 'CORPORATE', 'INDIVIDUAL'
    phone           VARCHAR(50),
    organization_name VARCHAR(255),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ngo_profiles (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL,
    mission_statement   TEXT NOT NULL,
    sector              VARCHAR(120) NOT NULL, -- e.g. 'Education', 'Health'
    geographic_focus    VARCHAR(255) NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
    credibility_score   REAL NOT NULL DEFAULT 0.0,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    ngo_id        INTEGER NOT NULL,
    donor_id      INTEGER,
    amount        NUMERIC(12,2) NOT NULL,
    currency      VARCHAR(8) NOT NULL DEFAULT 'USD',
    transacted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description   VARCHAR(255),
    FOREIGN KEY (ngo_id) REFERENCES ngo_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE posts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    ngo_id         INTEGER,
    author_id      INTEGER,
    content        TEXT NOT NULL,
    media_url      VARCHAR(512),
    visibility     VARCHAR(32) NOT NULL DEFAULT 'PUBLIC',
    like_count     INTEGER NOT NULL DEFAULT 0,
    comment_count  INTEGER NOT NULL DEFAULT 0,
    share_count    INTEGER NOT NULL DEFAULT 0,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ngo_id) REFERENCES ngo_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE interactions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id      INTEGER NOT NULL,
    user_id      INTEGER NOT NULL,
    type         VARCHAR(32) NOT NULL, -- 'LIKE', 'COMMENT', 'SHARE'
    comment_text TEXT,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_relationships (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    followee_id INTEGER NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_follow UNIQUE (follower_id, followee_id)
);

