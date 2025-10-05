import { json } from "@sveltejs/kit";
import { getDatabase } from "$lib/db/connection.js";
import {
  articles,
  authors,
  articleAuthors,
  images,
  imageAuthors,
} from "$lib/db/schema.js";
import { eq } from "drizzle-orm";
import { canonicalizeUrl } from "$lib/util.js";

export async function GET({ params }) {
  try {
    const db = getDatabase();
    const articleId = parseInt(params.id);

    if (isNaN(articleId)) {
      return json({ error: "Invalid article ID" }, { status: 400 });
    }

    const raw = await db.query.articles.findFirst({
      where: (a, { eq }) => eq(a.id, articleId),
      with: {
        authors: {
          with: {
            author: true,
          },
        },
        titleImage: {
          with: {
            authors: {
              with: {
                author: true,
              },
            },
          },
        },
      },
    });
    const article = Object.assign(raw, {
      authors: raw.authors.map((au) => au.author),
      titleImage: Object.assign(raw.titleImage, {
        authors: raw.titleImage.authors.map((au) => au.author),
      }),
    });

    if (!article) {
      return json({ error: "Article not found" }, { status: 404 });
    }

    return json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    return json({ error: "Failed to fetch article" }, { status: 500 });
  }
}

export async function PUT({ params, request }) {
  try {
    const db = getDatabase();
    const articleId = parseInt(params.id);

    if (isNaN(articleId)) {
      return json({ error: "Invalid article ID" }, { status: 400 });
    }

    const {
      hed,
      dek,
      body,
      authorIds = [],
      title_image_id,
      url,
      sourcePublication,
    } = await request.json();

    if (!hed || !body) {
      return json({ error: "Hed and body are required" }, { status: 400 });
    }

    // Canonicalize URL if provided
    let canonicalUrl = null;
    let hostname = null;
    if (url && url.trim()) {
      const result = canonicalizeUrl(url);
      canonicalUrl = result.canonical;
      hostname = result.hostname;
    }

    // Update the article first
    const [article] = await db
      .update(articles)
      .set({
        hed,
        dek,
        body,
        titleImageId: title_image_id,
        url: canonicalUrl,
        sourcePublication: sourcePublication || null,
        hostname,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(articles.id, articleId))
      .returning();

    if (!article) {
      return json({ error: "Article not found" }, { status: 404 });
    }

    // Update author relationships
    await db
      .delete(articleAuthors)
      .where(eq(articleAuthors.articleId, articleId));

    if (authorIds.length > 0) {
      for (let i = 0; i < authorIds.length; i++) {
        await db.insert(articleAuthors).values({
          articleId: articleId,
          authorId: authorIds[i],
          orderPosition: i + 1,
        });
      }
    }

    return json(article);
  } catch (error) {
    console.error("Error updating article:", error);

    // Check for UNIQUE constraint violation
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return json({ error: 'An article with this URL already exists' }, { status: 409 });
    }

    if (error.message === "Article not found") {
      return json({ error: "Article not found" }, { status: 404 });
    }
    return json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE({ params }) {
  try {
    const db = getDatabase();
    const articleId = parseInt(params.id);

    if (isNaN(articleId)) {
      return json({ error: "Invalid article ID" }, { status: 400 });
    }

    const result = await db
      .delete(articles)
      .where(eq(articles.id, articleId))
      .returning();

    if (result.length === 0) {
      return json({ error: "Article not found" }, { status: 404 });
    }

    return json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    return json({ error: "Failed to delete article" }, { status: 500 });
  }
}
