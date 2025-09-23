import { getDatabase, getRawDatabase } from "../connection.js";
import {
  editions,
  articles,
  poems,
  images,
  authors,
  editionArticles,
  editionPoems,
  editionImages,
  articleAuthors,
  poemAuthors,
  imageAuthors,
} from "../schema.js";
import { eq, desc, sql, max, isNull } from "drizzle-orm";

export class EditionModel {
  constructor() {
    this.db = getDatabase();
    this.rawDb = getRawDatabase();
  }

  async getAll() {
    // Get editions with cover image filename
    const query = `
            SELECT e.*, i.filename as cover_image_filename
            FROM editions e
            LEFT JOIN images i ON e.cover_image_id = i.id
            ORDER BY e.issue_number DESC
        `;

    return this.rawDb.prepare(query).all();
  }

  async getById(id) {
    const raw = await this.db.query.editions.findFirst({
      where: (e, { eq }) => eq(e.id, id),
      with: {
        articles: {
          with: {
            article: {
              with: {
                authors: {
                  with: {
                    author: true,
                  },
                },
                titleImage: true,
              },
            },
          },
        },
        coverImage: true,
        poems: {
          with: {
            poem: {
              with: {
                authors: {
                  with: {
                    author: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const edition = Object.assign(raw, {
      articles: raw.articles.map((a) =>
        Object.assign(a.article, {
          authors: a.article.authors.map((au) => au.author),
        })
      ),
      coverImage: raw.coverImage,
      poems: raw.poems.map((a) =>
        Object.assign(a.poem, {
          authors: a.poem.authors.map((au) => au.author),
        })
      ),
    });

    return edition;
  }

  async getByIssueNumber(issueNumber) {
    const edition = await this.db
      .select()
      .from(editions)
      .where(eq(editions.issueNumber, issueNumber))
      .get();

    return edition ? this.getById(edition.id) : null;
  }

  async getNextIssueNumber() {
    const result = await this.db
      .select({
        nextIssueNumber: sql`COALESCE(MAX(${editions.issueNumber}), 0) + 1`,
      })
      .from(editions)
      .get();

    return result.nextIssueNumber;
  }

  async create(
    editionData,
    contentItems = { articles: [], poems: [], images: [] }
  ) {
    return this.rawDb.transaction(() => {
      const { issue_number, published_at, cover_image_id = null } = editionData;

      // Insert the edition
      const result = this.db
        .insert(editions)
        .values({
          issueNumber: issue_number,
          publishedAt: published_at,
          coverImageId: cover_image_id,
        })
        .returning()
        .get();

      // Add articles to edition
      if (contentItems.articles.length > 0) {
        const articleRelations = contentItems.articles.map(
          (articleId, index) => ({
            editionId: result.id,
            articleId: articleId,
            orderPosition: index + 1,
          })
        );

        this.db.insert(editionArticles).values(articleRelations).run();
      }

      // Add poems to edition
      if (contentItems.poems.length > 0) {
        const poemRelations = contentItems.poems.map((poemId, index) => ({
          editionId: result.id,
          poemId: poemId,
          orderPosition: index + 1,
        }));

        this.db.insert(editionPoems).values(poemRelations).run();
      }

      // Add images to edition
      if (contentItems.images.length > 0) {
        const imageRelations = contentItems.images.map((imageItem, index) => {
          const { id: imageId, usage_type = "content" } = imageItem;
          return {
            editionId: result.id,
            imageId: imageId,
            usageType: usage_type,
            orderPosition: index + 1,
          };
        });

        this.db.insert(editionImages).values(imageRelations).run();
      }

      return this.getById(result.id);
    });
  }

  async updateById(
    id,
    editionData,
    contentItems = { articles: [], poems: [], images: [] }
  ) {
    return this.rawDb.transaction(() => {
      const { issue_number, published_at, cover_image_id = null } = editionData;

      // Update the edition
      const result = this.db
        .update(editions)
        .set({
          issueNumber: issue_number,
          publishedAt: published_at,
          coverImageId: cover_image_id,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(editions.id, id))
        .returning()
        .get();

      // Clear existing content relations
      this.db
        .delete(editionArticles)
        .where(eq(editionArticles.editionId, id))
        .run();
      this.db.delete(editionPoems).where(eq(editionPoems.editionId, id)).run();
      this.db
        .delete(editionImages)
        .where(eq(editionImages.editionId, id))
        .run();

      // Add updated content
      if (contentItems.articles.length > 0) {
        const articleRelations = contentItems.articles.map(
          (articleId, index) => ({
            editionId: id,
            articleId: articleId,
            orderPosition: index + 1,
          })
        );

        this.db.insert(editionArticles).values(articleRelations).run();
      }

      if (contentItems.poems.length > 0) {
        const poemRelations = contentItems.poems.map((poemId, index) => ({
          editionId: id,
          poemId: poemId,
          orderPosition: index + 1,
        }));

        this.db.insert(editionPoems).values(poemRelations).run();
      }

      if (contentItems.images.length > 0) {
        const imageRelations = contentItems.images.map((imageItem, index) => {
          const { id: imageId, usage_type = "content" } = imageItem;
          return {
            editionId: id,
            imageId: imageId,
            usageType: usage_type,
            orderPosition: index + 1,
          };
        });

        this.db.insert(editionImages).values(imageRelations).run();
      }

      return this.getById(id);
    });
  }

  async deleteById(id) {
    return this.db.delete(editions).where(eq(editions.id, id)).run();
  }

  // Get available content not yet assigned to any edition
  async getAvailableContent() {
    // Get available articles
    const availableArticlesQuery = `
            SELECT a.*, GROUP_CONCAT(au.name, ', ') as authors
            FROM articles a
            LEFT JOIN article_authors aa ON a.id = aa.article_id
            LEFT JOIN authors au ON aa.author_id = au.id
            LEFT JOIN edition_articles ea ON a.id = ea.article_id
            WHERE ea.article_id IS NULL
            GROUP BY a.id
            ORDER BY a.created_at DESC
        `;
    const availableArticles = this.rawDb.prepare(availableArticlesQuery).all();

    // Get available poems
    const availablePoemsQuery = `
            SELECT p.*, GROUP_CONCAT(au.name, ', ') as authors
            FROM poems p
            LEFT JOIN poem_authors pa ON p.id = pa.poem_id
            LEFT JOIN authors au ON pa.author_id = au.id
            LEFT JOIN edition_poems ep ON p.id = ep.poem_id
            WHERE ep.poem_id IS NULL
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `;
    const availablePoems = this.rawDb.prepare(availablePoemsQuery).all();

    // Get available images
    const availableImagesQuery = `
            SELECT i.*, GROUP_CONCAT(au.name, ', ') as authors
            FROM images i
            LEFT JOIN image_authors ia ON i.id = ia.image_id
            LEFT JOIN authors au ON ia.author_id = au.id
            LEFT JOIN edition_images ei ON i.id = ei.image_id
            WHERE ei.image_id IS NULL AND i.is_processed = 1
            GROUP BY i.id
            ORDER BY i.created_at DESC
        `;
    const availableImages = this.rawDb.prepare(availableImagesQuery).all();

    return {
      articles: availableArticles,
      poems: availablePoems,
      images: availableImages,
    };
  }
}
