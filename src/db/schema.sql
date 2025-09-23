CREATE TABLE editions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_number INTEGER NOT NULL UNIQUE,
    published_at DATE NOT NULL,
    cover_image_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cover_image_id) REFERENCES images(id)
);

CREATE TABLE authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hed TEXT NOT NULL,
    dek TEXT,
    body TEXT NOT NULL,
    title_image_id INTEGER,
    order_in_edition INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (title_image_id) REFERENCES images(id)
);

CREATE TABLE images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_path TEXT NOT NULL,
    processed_path TEXT,
    caption TEXT,
    image_type TEXT CHECK(image_type IN ('background', 'title', 'inline')) NOT NULL,
    width INTEGER,
    height INTEGER,
    is_processed BOOLEAN DEFAULT FALSE,
    processing_status TEXT CHECK(processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    processing_started_at DATETIME,
    processing_completed_at DATETIME,
    processing_error TEXT,
    processing_attempts INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE poems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    order_in_edition INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE edition_articles (
    edition_id INTEGER NOT NULL,
    article_id INTEGER NOT NULL,
    order_position INTEGER NOT NULL,
    PRIMARY KEY (edition_id, article_id),
    FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE edition_poems (
    edition_id INTEGER NOT NULL,
    poem_id INTEGER NOT NULL,
    order_position INTEGER NOT NULL,
    PRIMARY KEY (edition_id, poem_id),
    FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE
);

CREATE TABLE edition_images (
    edition_id INTEGER NOT NULL,
    image_id INTEGER NOT NULL,
    usage_type TEXT CHECK(usage_type IN ('cover', 'content', 'background')) NOT NULL,
    order_position INTEGER,
    PRIMARY KEY (edition_id, image_id),
    FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
);

CREATE TABLE article_authors (
    article_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    order_position INTEGER NOT NULL,
    PRIMARY KEY (article_id, author_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

CREATE TABLE poem_authors (
    poem_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    order_position INTEGER NOT NULL,
    PRIMARY KEY (poem_id, author_id),
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

CREATE TABLE image_authors (
    image_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    role TEXT CHECK(role IN ('photographer', 'artist', 'creator')) DEFAULT 'photographer',
    PRIMARY KEY (image_id, author_id),
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

CREATE INDEX idx_editions_issue_number ON editions(issue_number);
CREATE INDEX idx_editions_published_at ON editions(published_at);
CREATE INDEX idx_articles_order ON articles(order_in_edition);
CREATE INDEX idx_poems_order ON poems(order_in_edition);
CREATE INDEX idx_images_type ON images(image_type);
CREATE INDEX idx_images_processed ON images(is_processed);
CREATE INDEX idx_images_processing_status ON images(processing_status);
CREATE INDEX idx_images_processing_queue ON images(processing_status, processing_attempts, created_at);
CREATE INDEX idx_edition_articles_order ON edition_articles(edition_id, order_position);
CREATE INDEX idx_edition_poems_order ON edition_poems(edition_id, order_position);
CREATE INDEX idx_edition_images_order ON edition_images(edition_id, order_position);
CREATE INDEX idx_authors_name ON authors(name);
CREATE INDEX idx_article_authors_order ON article_authors(article_id, order_position);
CREATE INDEX idx_poem_authors_order ON poem_authors(poem_id, order_position);
CREATE INDEX idx_image_authors_role ON image_authors(image_id, role);