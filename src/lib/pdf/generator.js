import puppeteer from "puppeteer";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { EditionModel } from "../db/models/editions.js";
import { marked } from "marked";

export class PDFGenerator {
  constructor() {
    this.editionModel = new EditionModel();
    this.browser = null;
    this.outputDir = "generated";

    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
  }

  async shutdown() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async generateEditionPDF(editionId) {
    await this.initialize();

    const edition = await this.editionModel.getById(editionId);
    if (!edition) {
      throw new Error(`Edition with ID ${editionId} not found`);
    }

    const filename = `the-daily-pilgrim-issue-${edition.issue_number}.pdf`;
    const outputPath = join(this.outputDir, filename);

    console.log(`Generating PDF for Issue ${edition.issue_number}...`);

    const page = await this.browser.newPage();

    try {
      // Configure page for mobile-first 9:16 aspect ratio
      await page.setViewport({
        width: 375, // iPhone width
        height: 667, // iPhone height (9:16 ratio)
        deviceScaleFactor: 2,
      });

      // Generate the complete magazine HTML
      const magazineHTML = await this.generateMagazineHTML(edition);

      // Set content and generate PDF
      await page.setContent(magazineHTML, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      await page.pdf({
        path: outputPath,
        width: "375px",
        height: "667px",
        pageRanges: "1-",
        printBackground: true,
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      });

      console.log(`PDF generated successfully: ${outputPath}`);
      return {
        success: true,
        filename,
        path: outputPath,
        edition,
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async generateMagazineHTML(edition) {
    const styles = this.getBaseStyles();

    // Generate individual sections
    const cover = this.generateCoverPage(edition);
    const tableOfContents = this.generateTableOfContents(edition);
    const content = this.generateContentPages(edition);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Daily Pilgrim - Issue ${edition.issue_number}</title>
    <style>${styles}</style>
</head>
<body>
    ${cover}
    ${tableOfContents}
    ${content}
</body>
</html>`;
  }

  generateCoverPage(edition) {
    const coverImage = edition.cover_image;
    const coverImagePath = coverImage
      ? coverImage.processed_path || coverImage.original_path
      : "";
    const publishedDate = new Date(edition.published_at).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    return `
<div class="page cover-page">
    ${
      coverImage
        ? `<div class="cover-image">
        <img src="${coverImagePath}" alt="Cover Image" />
    </div>`
        : ""
    }
    <div class="cover-content">
        <div class="masthead">
            <h1>The Daily Pilgrim</h1>
        </div>
        <div class="issue-info">
            <div class="issue-number">Issue ${edition.issue_number}</div>
            <div class="issue-date">${publishedDate}</div>
        </div>
        ${
          coverImage?.byline
            ? `<div class="cover-credit">Cover: ${coverImage.byline}</div>`
            : ""
        }
    </div>
</div>`;
  }

  generateTableOfContents(edition) {
    let tocItems = [];

    // Add articles
    edition.articles.forEach((article, index) => {
      tocItems.push({
        type: "article",
        title: article.hed,
        authors: article.authors,
        page: index + 3, // Cover + TOC + start of content
      });
    });

    // Add poems
    edition.poems.forEach((poem, index) => {
      tocItems.push({
        type: "poem",
        title: poem.title,
        authors: poem.authors,
        page: edition.articles.length + index + 3,
      });
    });

    const tocHTML = tocItems
      .map(
        (item) => `
            <div class="toc-item">
                <div class="toc-title">${item.title}</div>
                ${
                  item.authors
                    ? `<div class="toc-authors">by ${item.authors}</div>`
                    : ""
                }
                <div class="toc-page">${item.page}</div>
            </div>
        `
      )
      .join("");

    return `
<div class="page toc-page">
    <div class="toc-header">
        <h2>Contents</h2>
    </div>
    <div class="toc-content">
        ${tocHTML}
    </div>
</div>`;
  }

  generateContentPages(edition) {
    let contentHTML = "";

    // Generate article pages
    edition.articles.forEach((article) => {
      contentHTML += this.generateArticlePage(article);
    });

    // Generate poem pages
    edition.poems.forEach((poem) => {
      contentHTML += this.generatePoemPage(poem);
    });

    // Generate image pages for content images
    const contentImages = edition.images.filter(
      (img) => img.usage_type === "content"
    );
    contentImages.forEach((image) => {
      contentHTML += this.generateImagePage(image);
    });

    return contentHTML;
  }

  generateArticlePage(article) {
    const titleImage = article.title_image;
    const bodyHTML = marked(article.body);

    return `
<div class="page article-page">
    ${
      titleImage
        ? `
    <div class="article-title-image">
        <img src="${
          titleImage.processed_path || titleImage.original_path
        }" alt="${titleImage.caption || ""}" />
        ${
          titleImage.caption
            ? `<div class="image-caption">${titleImage.caption}</div>`
            : ""
        }
        ${
          titleImage.byline
            ? `<div class="image-credit">${titleImage.byline}</div>`
            : ""
        }
    </div>`
        : ""
    }

    <div class="article-content">
        <div class="article-header">
            <h1 class="article-hed">${article.hed}</h1>
            ${
              article.dek ? `<div class="article-dek">${article.dek}</div>` : ""
            }
            ${
              article.authors
                ? `<div class="article-byline">by ${article.authors}</div>`
                : ""
            }
        </div>

        <div class="article-body">
            ${bodyHTML}
        </div>
    </div>
</div>`;
  }

  generatePoemPage(poem) {
    const bodyHTML = marked(poem.body);

    return `
<div class="page poem-page">
    <div class="poem-content">
        <div class="poem-header">
            <h1 class="poem-title">${poem.title}</h1>
            ${
              poem.authors
                ? `<div class="poem-byline">by ${poem.authors}</div>`
                : ""
            }
        </div>

        <div class="poem-body">
            ${bodyHTML}
        </div>
    </div>
</div>`;
  }

  generateImagePage(image) {
    return `
<div class="page image-page">
    <div class="full-image">
        <img src="${image.processed_path || image.original_path}" alt="${
      image.caption || ""
    }" />
        ${
          image.caption
            ? `<div class="image-caption">${image.caption}</div>`
            : ""
        }
        ${
          image.authors
            ? `<div class="image-credit">${image.authors}</div>`
            : ""
        }
    </div>
</div>`;
  }

  getBaseStyles() {
    return `
/* CSS Variables matching the design system */
:root {
    --color-bg: #ffffff;
    --color-fg: #000000;
    --color-off: #0066cc;
    --color-warn: #cc6600;
    --font-body: "Cormorant", serif;
    --font-dek: "Merriweather", serif;
    --font-hed: "Merriweather", serif;
    --font-masthead: "Bodoni Moda", serif;
    --unit: 16px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-body);
    color: var(--color-fg);
    background: var(--color-bg);
    line-height: 1.5;
}

.page {
    width: 375px;
    height: 667px;
    page-break-after: always;
    position: relative;
    overflow: hidden;
}

/* Cover Page */
.cover-page {
    background: var(--color-fg);
    color: var(--color-bg);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    padding: var(--unit);
}

.cover-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.cover-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.cover-content {
    position: relative;
    z-index: 2;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: calc(var(--unit) * 2);
}

.masthead h1 {
    font-family: var(--font-masthead);
    font-size: calc(var(--unit) * 2.5);
    font-weight: 600;
    text-transform: uppercase;
    transform: scaleY(75%);
    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
}

.issue-info {
    margin-top: auto;
}

.issue-number {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1.5);
    font-weight: 900;
    margin-bottom: calc(var(--unit) * 0.5);
}

.issue-date {
    font-family: var(--font-dek);
    font-size: var(--unit);
    font-weight: 400;
}

.cover-credit {
    font-size: calc(var(--unit) * 0.75);
    margin-top: calc(var(--unit) * 2);
    opacity: 0.8;
}

/* Table of Contents */
.toc-page {
    padding: calc(var(--unit) * 2);
}

.toc-header h2 {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1.5);
    font-weight: 900;
    margin-bottom: calc(var(--unit) * 1.5);
    text-align: center;
}

.toc-item {
    margin-bottom: calc(var(--unit) * 1.25);
    padding-bottom: calc(var(--unit) * 0.75);
    border-bottom: 1px solid #eee;
    display: flex;
    flex-direction: column;
}

.toc-title {
    font-family: var(--font-hed);
    font-weight: 700;
    font-size: calc(var(--unit) * 0.9);
    margin-bottom: calc(var(--unit) * 0.25);
}

.toc-authors {
    font-family: var(--font-body);
    font-style: italic;
    font-size: calc(var(--unit) * 0.8);
    color: #666;
    margin-bottom: calc(var(--unit) * 0.25);
}

.toc-page {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.75);
    color: var(--color-off);
    font-weight: 600;
}

/* Article Pages */
.article-page {
    padding: calc(var(--unit) * 1.5);
}

.article-title-image {
    width: 100%;
    margin-bottom: calc(var(--unit) * 1.5);
}

.article-title-image img {
    width: 100%;
    height: auto;
    aspect-ratio: 16/9;
    object-fit: cover;
}

.article-hed {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1.25);
    font-weight: 900;
    line-height: 1.2;
    margin-bottom: calc(var(--unit) * 0.75);
}

.article-dek {
    font-family: var(--font-dek);
    font-size: calc(var(--unit) * 0.9);
    font-weight: 400;
    line-height: 1.4;
    margin-bottom: calc(var(--unit) * 0.75);
    color: #666;
}

.article-byline, .poem-byline {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.8);
    font-style: italic;
    margin-bottom: calc(var(--unit) * 1.5);
    color: var(--color-off);
}

.article-body {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.9);
    line-height: 1.6;
}

.article-body p {
    margin-bottom: calc(var(--unit) * 1);
}

/* Poem Pages */
.poem-page {
    padding: calc(var(--unit) * 2);
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.poem-title {
    font-family: var(--font-hed);
    font-size: calc(var(--unit) * 1.5);
    font-weight: 700;
    text-align: center;
    margin-bottom: calc(var(--unit) * 0.75);
}

.poem-body {
    font-family: var(--font-body);
    font-size: var(--unit);
    line-height: 1.8;
    white-space: pre-line;
    text-align: left;
}

/* Image Pages */
.image-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: calc(var(--unit) * 1);
}

.full-image img {
    width: 100%;
    height: auto;
    max-height: calc(667px - var(--unit) * 6);
    object-fit: contain;
}

.image-caption {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.8);
    margin-top: calc(var(--unit) * 0.75);
    text-align: center;
    font-style: italic;
}

.image-credit {
    font-family: var(--font-body);
    font-size: calc(var(--unit) * 0.7);
    margin-top: calc(var(--unit) * 0.5);
    text-align: center;
    color: #666;
}

/* Typography enhancements */
h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-hed);
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: calc(var(--unit) * 0.75);
}

p {
    margin-bottom: calc(var(--unit) * 1);
}

em {
    font-style: italic;
}

strong {
    font-weight: 700;
}

/* Print optimizations */
@media print {
    .page {
        page-break-after: always;
    }

    img {
        max-width: 100% !important;
        height: auto !important;
    }
}`;
  }
}
