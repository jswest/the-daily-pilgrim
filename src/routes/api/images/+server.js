import { json } from "@sveltejs/kit";
import { getDatabase } from "$lib/db/connection.js";
import { images, imageAuthors } from "$lib/db/schema.js";
import { writeFileSync } from "fs";
import { eq } from "drizzle-orm";
import { join } from "path";

export async function GET() {
  try {
    const db = getDatabase();
    const imagesList = await db.query.images.findMany({
      orderBy: (images, { desc }) => [desc(images.createdAt)],
    });
    return json(imagesList);
  } catch (error) {
    console.error("Error fetching images:", error);
    return json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    const db = getDatabase();
    const formData = await request.formData();

    const file = formData.get("file");
    const caption = formData.get("caption") || null;
    const imageType = formData.get("imageType") || "inline";
    const authors = JSON.parse(formData.get("authorIds") || "[]");

    if (!file || file.size === 0) {
      return json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }

    // Get file extension and buffer outside transaction
    const extension = file.name.split(".").pop().toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    // First, create the image record with actual path
    const filename = `${Date.now()}_${file.name}`;
    const filePath = join(process.cwd(), "src", "images", filename);
    writeFileSync(filePath, buffer);

    const [image] = await db
      .insert(images)
      .values({
        filename: file.name,
        originalPath: `src/images/${filename}`,
        caption,
        imageType,
        isProcessed: false,
        processingStatus: "pending",
        processingAttempts: 0,
      })
      .returning();

    if (authors.length > 0) {
      for (const author of authors) {
        await db.insert(imageAuthors).values({
          imageId: image.id,
          authorId: author.authorId || author,
          role: "photographer",
        });
      }
    }

    const raw = await db.query.images.findFirst({
      where: (im, { eq }) => eq(im.id, image.id),
      with: {
        authors: {
          with: {
            author: true,
          },
        },
      },
    });

    return json(
      Object.assign(raw, {
        authors: raw.authors.map((au) => au.author),
      })
    );
  } catch (error) {
    console.error("Error uploading image:", error);
    return json({ error: "Failed to upload image" }, { status: 500 });
  }
}
