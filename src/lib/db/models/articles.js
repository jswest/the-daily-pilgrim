import { getDatabase, getRawDatabase } from '../connection.js';
import { articles, authors, articleAuthors, images, imageAuthors } from '../schema.js';
import { eq, desc, sql } from 'drizzle-orm';

export class ArticleModel {
    constructor() {
        this.db = getDatabase();
        this.rawDb = getRawDatabase();
    }

    async getAll() {
        // Get articles with concatenated author names
        const query = `
            SELECT a.*, GROUP_CONCAT(au.name, ', ') as authors
            FROM articles a
            LEFT JOIN article_authors aa ON a.id = aa.article_id
            LEFT JOIN authors au ON aa.author_id = au.id
            GROUP BY a.id
            ORDER BY a.created_at DESC
        `;

        return this.rawDb.prepare(query).all();
    }

    async getById(id) {
        // Get the article
        const article = await this.db
            .select()
            .from(articles)
            .where(eq(articles.id, id))
            .get();

        if (!article) {
            return null;
        }

        // Get article authors
        const articleAuthorsList = await this.db
            .select({
                id: authors.id,
                name: authors.name,
                bio: authors.bio,
                orderPosition: articleAuthors.orderPosition,
            })
            .from(authors)
            .innerJoin(articleAuthors, eq(authors.id, articleAuthors.authorId))
            .where(eq(articleAuthors.articleId, id))
            .orderBy(articleAuthors.orderPosition);

        article.authors = articleAuthorsList;

        // Get title image if it exists
        if (article.titleImageId) {
            const titleImage = await this.db
                .select()
                .from(images)
                .where(eq(images.id, article.titleImageId))
                .get();

            if (titleImage) {
                // Get image authors/photographers
                const imageAuthorsList = await this.db
                    .select({
                        name: authors.name,
                        role: imageAuthors.role,
                    })
                    .from(authors)
                    .innerJoin(imageAuthors, eq(authors.id, imageAuthors.authorId))
                    .where(eq(imageAuthors.imageId, article.titleImageId))
                    .orderBy(authors.name);

                titleImage.authors = imageAuthorsList;

                // Create a byline from the image authors
                if (imageAuthorsList.length > 0) {
                    titleImage.byline = imageAuthorsList.map(author => author.name).join(', ');
                }

                article.title_image = titleImage;
            }
        }

        return article;
    }

    async create(articleData, authorIds = []) {
        return this.rawDb.transaction(() => {
            const { hed, dek, body, title_image_id = null, order_in_edition = null } = articleData;

            // Insert the article
            const result = this.db
                .insert(articles)
                .values({
                    hed,
                    dek,
                    body,
                    titleImageId: title_image_id,
                    orderInEdition: order_in_edition,
                })
                .returning()
                .get();

            // Insert author relationships
            if (authorIds.length > 0) {
                const authorRelations = authorIds.map((authorId, index) => ({
                    articleId: result.id,
                    authorId: authorId,
                    orderPosition: index + 1,
                }));

                this.db
                    .insert(articleAuthors)
                    .values(authorRelations)
                    .run();
            }

            return this.getById(result.id);
        });
    }

    async updateById(id, articleData, authorIds = []) {
        return this.rawDb.transaction(() => {
            const { hed, dek, body, title_image_id = null, order_in_edition = null } = articleData;

            // Update the article
            const result = this.db
                .update(articles)
                .set({
                    hed,
                    dek,
                    body,
                    titleImageId: title_image_id,
                    orderInEdition: order_in_edition,
                    updatedAt: new Date(),
                })
                .where(eq(articles.id, id))
                .returning()
                .get();

            // Delete existing author relationships
            this.db
                .delete(articleAuthors)
                .where(eq(articleAuthors.articleId, id))
                .run();

            // Insert new author relationships
            if (authorIds.length > 0) {
                const authorRelations = authorIds.map((authorId, index) => ({
                    articleId: id,
                    authorId: authorId,
                    orderPosition: index + 1,
                }));

                this.db
                    .insert(articleAuthors)
                    .values(authorRelations)
                    .run();
            }

            return this.getById(id);
        });
    }

    async deleteById(id) {
        return this.db
            .delete(articles)
            .where(eq(articles.id, id))
            .run();
    }
}