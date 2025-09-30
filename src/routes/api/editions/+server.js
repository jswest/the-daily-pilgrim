import { json } from "@sveltejs/kit";
import { getDatabase } from "$lib/db/connection.js";
import { editions, editionArticles, editionPoems, editionImages } from "$lib/db/schema.js";

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
    const { issueNumber, publishedAt, coverImageId, orderedContent = [] } = await request.json();

    // Create the edition
    const [edition] = await db
      .insert(editions)
      .values({
        issueNumber,
        publishedAt,
        coverImageId,
      })
      .returning();

    // Process orderedContent in order, maintaining global orderPosition
    let globalPosition = 1;

    for (const item of orderedContent) {
      if (item.type === 'article') {
        await db.insert(editionArticles).values({
          editionId: edition.id,
          articleId: item.id,
          orderPosition: globalPosition++
        });
      } else if (item.type === 'poem') {
        await db.insert(editionPoems).values({
          editionId: edition.id,
          poemId: item.id,
          orderPosition: globalPosition++
        });
      } else if (item.type === 'image') {
        await db.insert(editionImages).values({
          editionId: edition.id,
          imageId: item.id,
          usageType: item.usageType || 'content',
          orderPosition: globalPosition++
        });
      }
    }

    return json(edition);
  } catch (error) {
    console.error("Error creating edition:", error);
    return json({ error: error.message }, { status: 500 });
  }
}
