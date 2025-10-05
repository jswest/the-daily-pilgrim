import { sqliteTable, integer, text, index, primaryKey, check } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

/* =========================
   Core Tables
   ========================= */

export const authors = sqliteTable('authors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  bio: text('bio'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  nameIdx: index('idx_authors_name').on(table.name),
}));

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  originalPath: text('original_path').notNull(),
  processedPath: text('processed_path'),
  caption: text('caption'),
  imageType: text('image_type', { enum: ['background', 'title', 'inline'] }).notNull(),
  width: integer('width'),
  height: integer('height'),
  isProcessed: integer('is_processed', { mode: 'boolean' }).default(false),
  processingStatus: text('processing_status', { enum: ['pending', 'processing', 'completed', 'failed'] }).default('pending'),
  processingStartedAt: text('processing_started_at'),
  processingCompletedAt: text('processing_completed_at'),
  processingError: text('processing_error'),
  processingAttempts: integer('processing_attempts').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  typeIdx: index('idx_images_type').on(table.imageType),
  processedIdx: index('idx_images_processed').on(table.isProcessed),
  statusIdx: index('idx_images_processing_status').on(table.processingStatus),
  queueIdx: index('idx_images_processing_queue').on(table.processingStatus, table.processingAttempts, table.createdAt),
  attemptsNonNeg: check('chk_images_processing_attempts_nonneg', sql`${table.processingAttempts} >= 0`),
}));

export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hed: text('hed').notNull(),
  dek: text('dek'),
  body: text('body').notNull(),
  titleImageId: integer('title_image_id').references(() => images.id),
  orderInEdition: integer('order_in_edition'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  orderIdx: index('idx_articles_order').on(table.orderInEdition),
}));

export const poems = sqliteTable('poems', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  orderInEdition: integer('order_in_edition'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  orderIdx: index('idx_poems_order').on(table.orderInEdition),
}));

export const editions = sqliteTable('editions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  issueNumber: integer('issue_number').notNull().unique(),
  publishedAt: text('published_at').notNull(),
  coverImageId: integer('cover_image_id').references(() => images.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // NOTE: unique() already creates an index for issue_number; no separate idx needed.
  publishedAtIdx: index('idx_editions_published_at').on(table.publishedAt),
}));

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  titleIdx: index('idx_notes_title').on(table.title),
}));

/* =========================
   Junction (Many-to-Many)
   ========================= */

export const articleAuthors = sqliteTable('article_authors', {
  articleId: integer('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => authors.id, { onDelete: 'cascade' }),
  orderPosition: integer('order_position').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.articleId, table.authorId] }),
  orderIdx: index('idx_article_authors_order').on(table.articleId, table.orderPosition),
}));

export const poemAuthors = sqliteTable('poem_authors', {
  poemId: integer('poem_id').notNull().references(() => poems.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => authors.id, { onDelete: 'cascade' }),
  orderPosition: integer('order_position').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.poemId, table.authorId] }),
  orderIdx: index('idx_poem_authors_order').on(table.poemId, table.orderPosition),
}));

export const imageAuthors = sqliteTable('image_authors', {
  imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => authors.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['photographer', 'artist', 'creator'] }).default('photographer'),
}, (table) => ({
  pk: primaryKey({ columns: [table.imageId, table.authorId] }),
  roleIdx: index('idx_image_authors_role').on(table.imageId, table.role),
}));

export const noteArticles = sqliteTable('note_articles', {
  noteId: integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  articleId: integer('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.noteId, table.articleId] }),
}));

export const notePoems = sqliteTable('note_poems', {
  noteId: integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  poemId: integer('poem_id').notNull().references(() => poems.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.noteId, table.poemId] }),
}));

export const noteImages = sqliteTable('note_images', {
  noteId: integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.noteId, table.imageId] }),
}));

export const editionArticles = sqliteTable('edition_articles', {
  editionId: integer('edition_id').notNull().references(() => editions.id, { onDelete: 'cascade' }),
  articleId: integer('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  orderPosition: integer('order_position').notNull(),
  noteId: integer('note_id').references(() => notes.id, { onDelete: 'set null' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.editionId, table.articleId] }),
  orderIdx: index('idx_edition_articles_order').on(table.editionId, table.orderPosition),
}));

export const editionPoems = sqliteTable('edition_poems', {
  editionId: integer('edition_id').notNull().references(() => editions.id, { onDelete: 'cascade' }),
  poemId: integer('poem_id').notNull().references(() => poems.id, { onDelete: 'cascade' }),
  orderPosition: integer('order_position').notNull(),
  noteId: integer('note_id').references(() => notes.id, { onDelete: 'set null' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.editionId, table.poemId] }),
  orderIdx: index('idx_edition_poems_order').on(table.editionId, table.orderPosition),
}));

export const editionImages = sqliteTable('edition_images', {
  editionId: integer('edition_id').notNull().references(() => editions.id, { onDelete: 'cascade' }),
  imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
  usageType: text('usage_type', { enum: ['cover', 'content', 'background'] }).notNull(),
  orderPosition: integer('order_position'),
  noteId: integer('note_id').references(() => notes.id, { onDelete: 'set null' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.editionId, table.imageId] }),
  orderIdx: index('idx_edition_images_order').on(table.editionId, table.orderPosition),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  articles: many(articleAuthors),
  poems: many(poemAuthors),
  images: many(imageAuthors),
}));

export const articlesRelations = relations(articles, ({ many, one }) => ({
  authors: many(articleAuthors),
  titleImage: one(images, {
    fields: [articles.titleImageId],
    references: [images.id],
  }),
  editions: many(editionArticles),
  notes: many(noteArticles),
}));

export const poemsRelations = relations(poems, ({ many }) => ({
  authors: many(poemAuthors),
  editions: many(editionPoems),
  notes: many(notePoems),
}));

export const imagesRelations = relations(images, ({ many }) => ({
  authors: many(imageAuthors),
  // Articles that reference this image as title_image_id
  articles: many(articles),
  // Usage in editions via junction
  editions: many(editionImages),
  // Editions that use this as the cover (editions.cover_image_id)
  coverEditions: many(editions),
  notes: many(noteImages),
}));

export const editionsRelations = relations(editions, ({ many, one }) => ({
  articles: many(editionArticles),
  poems: many(editionPoems),
  images: many(editionImages),
  coverImage: one(images, {
    fields: [editions.coverImageId],
    references: [images.id],
  }),
}));

export const articleAuthorsRelations = relations(articleAuthors, ({ one }) => ({
  article: one(articles, { fields: [articleAuthors.articleId], references: [articles.id] }),
  author:  one(authors,  { fields: [articleAuthors.authorId],  references: [authors.id] }),
}));

export const poemAuthorsRelations = relations(poemAuthors, ({ one }) => ({
  poem:   one(poems,   { fields: [poemAuthors.poemId],   references: [poems.id] }),
  author: one(authors, { fields: [poemAuthors.authorId], references: [authors.id] }),
}));

export const imageAuthorsRelations = relations(imageAuthors, ({ one }) => ({
  image:  one(images,  { fields: [imageAuthors.imageId],  references: [images.id] }),
  author: one(authors, { fields: [imageAuthors.authorId], references: [authors.id] }),
}));

export const editionArticlesRelations = relations(editionArticles, ({ one }) => ({
  edition: one(editions, { fields: [editionArticles.editionId], references: [editions.id] }),
  article: one(articles, { fields: [editionArticles.articleId], references: [articles.id] }),
  note: one(notes, { fields: [editionArticles.noteId], references: [notes.id] }),
}));

export const editionPoemsRelations = relations(editionPoems, ({ one }) => ({
  edition: one(editions, { fields: [editionPoems.editionId], references: [editions.id] }),
  poem:    one(poems,    { fields: [editionPoems.poemId],   references: [poems.id] }),
  note: one(notes, { fields: [editionPoems.noteId], references: [notes.id] }),
}));

export const editionImagesRelations = relations(editionImages, ({ one }) => ({
  edition: one(editions, { fields: [editionImages.editionId], references: [editions.id] }),
  image:   one(images,   { fields: [editionImages.imageId],   references: [images.id] }),
  note: one(notes, { fields: [editionImages.noteId], references: [notes.id] }),
}));

export const notesRelations = relations(notes, ({ many }) => ({
  articles: many(noteArticles),
  poems: many(notePoems),
  images: many(noteImages),
}));

export const noteArticlesRelations = relations(noteArticles, ({ one }) => ({
  note: one(notes, { fields: [noteArticles.noteId], references: [notes.id] }),
  article: one(articles, { fields: [noteArticles.articleId], references: [articles.id] }),
}));

export const notePoemsRelations = relations(notePoems, ({ one }) => ({
  note: one(notes, { fields: [notePoems.noteId], references: [notes.id] }),
  poem: one(poems, { fields: [notePoems.poemId], references: [poems.id] }),
}));

export const noteImagesRelations = relations(noteImages, ({ one }) => ({
  note: one(notes, { fields: [noteImages.noteId], references: [notes.id] }),
  image: one(images, { fields: [noteImages.imageId], references: [images.id] }),
}));