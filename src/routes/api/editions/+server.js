import { json } from "@sveltejs/kit";
import { getDatabase } from "$lib/db/connection.js";
import { editions } from "$lib/db/schema.js";

export async function GET() {
  try {
    const db = getDatabase();
    const raw = await db.query.editions.findMany({
      orderBy: (editions, { desc }) => [desc(editions.publishedAt)],
      with: {
        coverImage: true,
        articles: {
          with: {
            article: {
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
            },
          },
          orderBy: (editionArticles, { asc }) => [asc(editionArticles.orderPosition)],
        },
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
          orderBy: (editionPoems, { asc }) => [asc(editionPoems.orderPosition)],
        },
      },
    });

    const editionsList = raw.map(edition => ({
      ...edition,
      articles: edition.articles?.map(ea => ({
        ...ea.article,
        authors: ea.article.authors?.map(aa => aa.author) || [],
        titleImage: ea.article.titleImage ? {
          ...ea.article.titleImage,
          authors: ea.article.titleImage.authors?.map(ia => ia.author) || []
        } : null
      })) || [],
      poems: edition.poems?.map(ep => ({
        ...ep.poem,
        authors: ep.poem.authors?.map(pa => pa.author) || []
      })) || []
    }));

    return json(editionsList);
  } catch (error) {
    console.error("Error fetching editions:", error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    const db = getDatabase();
    const { issueNumber, publishedAt, coverImageId } = await request.json();

    const [edition] = await db
      .insert(editions)
      .values({
        issueNumber,
        publishedAt,
        coverImageId,
      })
      .returning();

    return json(edition);
  } catch (error) {
    console.error("Error creating edition:", error);
    return json({ error: error.message }, { status: 500 });
  }
}
