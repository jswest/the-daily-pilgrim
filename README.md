# The Daily Pilgrim

A content management system for creating mobile-first digital magazines with a unified ordering system for articles, poems, and images.

## What is this?

`The Daily Pilgrim` is a SvelteKit 5 application that manages text content (markdown) and images in a SQLite database, then generates beautifully formatted 9:16 aspect-ratio PDFs optimized for mobile reading. Content editors can create and organize magazine editions through a web interface, with full control over the order in which content appears.

### Content Types

Each edition can contain three types of content, which can be arranged in any order:

1. **Articles** - The backbone of each edition, with headline (hed), subtitle (dek), body text (markdown), and optional title image
2. **Poems** - Formatted verse with title, body, and author attribution
3. **Images** - Visual content with three usage types:
   - **Background** (9:16) - Full-bleed images for covers and backgrounds
   - **Title** (16:9) - Article title images in landscape format
   - **Content** - Inline images that appear as separate pages in the edition flow
   - All images are processed with one-bit dithering for a distinctive aesthetic

### Edition Features

Each edition includes:
- Cover page with magazine title, issue number, publication date, and optional cover image
- Table of contents with all articles, poems, and content images
- Content pages in the exact order specified by the editor
- Author attribution for all content
- Print-optimized layout at 400px × 711px (9:16 aspect ratio)

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd the-daily-pilgrim
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
npm run db:push
```

This will create the SQLite database and all necessary tables using Drizzle ORM.

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### Creating Content

#### Authors
1. Navigate to **Authors** (`/authors`)
2. Click **Create New Author**
3. Enter the author's name
4. Save

#### Images
1. Navigate to **Images** (`/images`)
2. Click **Upload New Image**
3. Select an image file (JPEG, PNG, GIF, or WebP, max 10MB)
4. Choose the image type (Background, Title, or Inline)
5. Add photographers/artists
6. Add an optional caption
7. Upload

The system automatically processes images with one-bit dithering.

#### Articles
1. Navigate to **Articles** (`/articles`)
2. Click **Create New Article**
3. Fill in the form:
   - **Headline** (hed) - Required
   - **Subtitle** (dek) - Optional
   - **Authors** - Select from existing authors
   - **Title Image** - Optional image to display at the article start
   - **Body** - Required, supports markdown formatting
4. Save

#### Poems
1. Navigate to **Poems** (`/poems`)
2. Click **Create New Poem**
3. Fill in the form:
   - **Title** - Required
   - **Authors** - Select from existing authors
   - **Body** - Required, line breaks are preserved
4. Save

### Creating an Edition

1. Navigate to **Editions** (`/editions`)
2. Click **Create New Edition**
3. Fill in edition details:
   - **Issue Number** - Sequential issue number
   - **Publication Date** - When this edition is published
   - **Cover Image** - Optional background image for the cover
4. Add content to the edition:
   - Click **Add** next to any article, poem, or image to add it to the edition
   - For images, choose whether to add as **Content** (appears as a page) or **Background** (for backgrounds/decoration)
   - Content appears in the **Selected Content** section at the top
5. Reorder content:
   - Use the **↑** and **↓** buttons to move items up or down
   - Use the **×** button to remove items
   - The order shown is exactly how content will appear in the final PDF
6. Save the edition

### Viewing an Edition

1. Navigate to **Editions** (`/editions`)
2. Click on an edition to view its details
3. The content view shows all articles, poems, and images in their exact order
4. Use the action buttons to:
   - **Edit** - Modify the edition
   - **Generate PDF** - Create a PDF version (see below)
   - **Delete** - Remove the edition
   - **Back to Editions** - Return to the editions list

### Print Preview

To see how an edition will look before generating a PDF:

1. Navigate to `/print?issue=<issue_number>`
   - Example: `http://localhost:5173/print?issue=4`
2. This displays the edition in browser with the same layout as the PDF
3. Use your browser's print function (Cmd/Ctrl + P) to print or save as PDF

### Generating PDFs

Use the CLI command to generate a PDF for an edition:

```bash
npm run pdf:generate <edition_id>
```

Example:
```bash
npm run pdf:generate 1
```

The PDF will be saved to the `generated/` directory with the filename `the-daily-pilgrim-issue-<issue_number>.pdf`

### Content Ordering System

The Daily Pilgrim uses a unified global ordering system:
- All content types (articles, poems, images) share the same order space
- You can intermix content types freely (e.g., poem, article, image, article, poem)
- Order is preserved across all views: web interface, print preview, and PDF output
- The order you set in the editor is exactly what readers see

## Technology Stack

- **Frontend**: SvelteKit 5 with Svelte 5 runes
- **Database**: SQLite with Drizzle ORM
- **PDF Generation**: Puppeteer
- **Image Processing**: Sharp (for one-bit dithering)
- **Markdown Parsing**: Marked
- **Styling**: CSS with custom design system (CSS variables)
- **Typography**: Google Fonts (Bodoni Moda, Cormorant, Merriweather)

## Development

### Database Changes

After modifying the database schema in `src/lib/db/schema.js`:

```bash
npm run db:push
```

### Building for Production

```bash
npm run build
```

The built application will be in the `build/` directory.

### Running in Production

```bash
npm run preview
```

## Project Structure

```
the-daily-pilgrim/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable Svelte components
│   │   ├── db/            # Database schema and connection
│   │   ├── pdf/           # PDF generation logic
│   │   └── processing/    # Image processing worker
│   ├── routes/            # SvelteKit routes (pages and API endpoints)
│   └── images/            # Uploaded and processed images
├── scripts/               # CLI scripts (PDF generation, etc.)
├── generated/             # Generated PDF files
└── local.db              # SQLite database file
```