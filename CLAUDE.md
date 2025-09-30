# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Daily Pilgrim is a CMS for creating mobile-first digital magazines. It uses:
- **SvelteKit 5** with **Svelte 5 runes** ($state, $props, $derived, $effect)
- **SQLite** database with **Drizzle ORM**
- **Puppeteer** for PDF generation
- **Sharp** for image processing (one-bit dithering)

## Core Architecture Principles

### 1. DRY (Don't Repeat Yourself)
- Create reusable components instead of duplicating code
- Extract shared logic into utility functions
- Use base components for consistent UI patterns

### 2. Unified Content Ordering System
The application uses a **global ordering system** where all content types (articles, poems, images) share the same order space:
- All junction tables (editionArticles, editionPoems, editionImages) have an `orderPosition` field
- API endpoints accept and return `orderedContent` arrays with mixed content types
- The order is preserved across: editor UI → database → print view → PDF generation
- Never split orderedContent into separate type arrays in the backend

### 3. Component-Based Architecture
- Base components live in `/src/lib/components/base/`
- Feature components live in `/src/lib/components/`
- Always use base components (Button, Card, LoadingState, etc.) instead of custom elements

## Svelte 5 Patterns

### Runes Usage

**State Management:**
```svelte
let count = $state(0);
let items = $state([]);
```

**Props:**
```svelte
let { data, onSubmit, isLoading = false } = $props();
```

**Derived State (Simple):**
```svelte
let doubled = $derived(count * 2);
```

**Derived State (Complex) - Use $derived.by():**
```svelte
let orderedContent = $derived.by(() => {
  const allContent = [];
  // ... complex logic
  return allContent.sort((a, b) => a.orderPosition - b.orderPosition);
});
```

**Important:** Never use `$derived(() => {...})()` - this is invalid. Use `$derived.by()` for functions.

### Component Patterns

**Form Components:**
- Accept `onSubmit` callback prop
- Use Button component with `type="submit"` for form submissions
- Never use plain `<button>` elements - always use `<Button>`
- Export a `reset()` function if the form needs to be reset externally

Example:
```svelte
<script>
  import Button from './base/Button.svelte';

  let { onSubmit, isSubmitting = false } = $props();
  let formData = $state({ title: '', body: '' });

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(formData);
  }

  export function reset() {
    formData = { title: '', body: '' };
  }
</script>

<form onsubmit={handleSubmit}>
  <input bind:value={formData.title} />
  <Button type="submit" disabled={isSubmitting} variant="primary">
    {isSubmitting ? 'Saving...' : 'Save'}
  </Button>
</form>
```

## Database Patterns

### Schema Design

**Junction Tables with Ordering:**
```javascript
export const editionArticles = sqliteTable('edition_articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  editionId: integer('edition_id').notNull().references(() => editions.id, { onDelete: 'cascade' }),
  articleId: integer('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  orderPosition: integer('order_position').notNull(), // Global ordering field
});
```

**Key Points:**
- Use `onDelete: 'cascade'` for foreign keys to auto-cleanup
- All content junction tables should have `orderPosition` for unified ordering
- Use camelCase in JavaScript, snake_case in database

### Drizzle ORM Queries

**Fetching with Relations:**
```javascript
const edition = await db.query.editions.findFirst({
  where: (editions, { eq }) => eq(editions.id, id),
  with: {
    articles: {
      with: {
        article: {
          with: {
            authors: {
              with: { author: true }
            }
          }
        }
      },
      orderBy: (editionArticles, { asc }) => [asc(editionArticles.orderPosition)]
    }
  }
});
```

**Inserting with Global Order:**
```javascript
let globalPosition = 1;
for (const item of orderedContent) {
  if (item.type === 'article') {
    await db.insert(editionArticles).values({
      editionId: id,
      articleId: item.id,
      orderPosition: globalPosition++
    });
  } else if (item.type === 'poem') {
    await db.insert(editionPoems).values({
      editionId: id,
      poemId: item.id,
      orderPosition: globalPosition++
    });
  }
  // etc...
}
```

## API Patterns

### Request/Response Format

**Edition Endpoints Should:**
- Accept `orderedContent` array (not separate articleIds/poemIds/imageIds arrays)
- Return flattened data with `orderPosition` preserved
- Transform nested author relations into simple arrays

**Example POST/PUT Request:**
```json
{
  "issueNumber": 4,
  "publishedAt": "2025-01-15",
  "coverImageId": 1,
  "orderedContent": [
    { "type": "poem", "id": 5 },
    { "type": "article", "id": 2 },
    { "type": "image", "id": 3, "usageType": "content" }
  ]
}
```

**Example GET Response:**
```json
{
  "id": 1,
  "issueNumber": 4,
  "articles": [
    {
      "id": 2,
      "hed": "Title",
      "orderPosition": 2,
      "authors": [{ "id": 1, "name": "John Doe" }]
    }
  ],
  "poems": [
    {
      "id": 5,
      "title": "A Poem",
      "orderPosition": 1,
      "authors": [{ "id": 2, "name": "Jane Smith" }]
    }
  ]
}
```

### Data Transformation

Always transform junction table data before returning:
```javascript
// BAD - returns nested structure
articles: edition.articles || []

// GOOD - flattens and includes orderPosition
articles: edition.articles?.map(ea => ({
  ...ea.article,
  orderPosition: ea.orderPosition,
  authors: ea.article.authors?.map(aa => aa.author) || []
})) || []
```

## Styling Best Practices

### CSS Variables

Use the design system variables defined in `:root`:
```css
--color-bg: #ffffff;    /* Background */
--color-fg: #000000;    /* Foreground/text */
--color-off: #0066cc;   /* Accent/links */
--color-warn: #cc6600;  /* Warnings/errors */
--font-body: "Cormorant";
--font-hed: "Merriweather";
--font-masthead: "Bodoni Moda";
--unit: 16px;           /* Base spacing unit */
```

### Spacing

Always use multiples of `--unit`:
```css
padding: calc(var(--unit) * 2);
margin-bottom: calc(var(--unit) * 1.5);
gap: var(--unit);
```

### Base Components

**Always use these instead of plain HTML:**
- `<Button>` instead of `<button>`
- `<Card>` instead of custom card divs
- `<LoadingState>` for loading indicators
- `<EmptyState>` for empty lists
- `<PageContainer>` for page wrappers

## Common Patterns & Solutions

### Displaying Authors

Authors are returned as objects, handle gracefully:
```javascript
import { oxford } from '$lib/util.js';

function formatAuthors(authors) {
  if (!authors) return '';
  if (typeof authors === 'string') return authors;
  if (Array.isArray(authors)) {
    return oxford(authors.map(a => a.name));
  }
  return '';
}
```

The `oxford()` utility function formats lists with proper Oxford comma grammar:
- 1 item: "Alice"
- 2 items: "Alice and Bob"
- 3+ items: "Alice, Bob, and Charlie"

### Unified Content Lists

When displaying mixed content:
```javascript
let orderedContent = $derived.by(() => {
  const allContent = [];

  (edition.articles || []).forEach(article => {
    allContent.push({ type: 'article', orderPosition: article.orderPosition, data: article });
  });

  (edition.poems || []).forEach(poem => {
    allContent.push({ type: 'poem', orderPosition: poem.orderPosition, data: poem });
  });

  (edition.images || []).forEach(image => {
    if (image.usageType === 'content') {
      allContent.push({ type: 'image', orderPosition: image.orderPosition, data: image });
    }
  });

  return allContent.sort((a, b) => a.orderPosition - b.orderPosition);
});
```

### Form Submission with Ordered Content

Transform UI state to API format:
```javascript
async function handleSubmit(event) {
  event.preventDefault();

  const submissionData = {
    issueNumber: parseInt(formData.issueNumber),
    publishedAt: formData.publishedAt,
    coverImageId: formData.coverImageId,
    orderedContent: orderedContent.map(item => ({
      type: item.type,
      id: item.id,
      usageType: item.usageType  // Only for images
    }))
  };

  await onSubmit(submissionData);
}
```

## File Organization

```
src/
├── lib/
│   ├── components/
│   │   ├── base/              # Base UI components (Button, Card, etc.)
│   │   ├── ArticleForm.svelte # Feature components
│   │   └── EditionForm.svelte
│   ├── db/
│   │   ├── connection.js      # Database connection
│   │   └── schema.js          # Drizzle schema
│   ├── pdf/
│   │   └── generator.js       # PDF generation logic
│   └── util.js                # Utility functions
├── routes/
│   ├── api/                   # API endpoints
│   │   ├── articles/
│   │   ├── editions/
│   │   └── poems/
│   ├── articles/              # Article pages
│   ├── editions/              # Edition pages
│   └── +layout.svelte         # Root layout with global styles
└── images/                    # Uploaded images
```

## Important Rules

1. **Never create files unless absolutely necessary** - prefer editing existing files
2. **Always use base components** - never create custom button/card elements
3. **Preserve orderPosition throughout the stack** - from UI to database to PDF
4. **Use $derived.by() for complex derived state** - not $derived(() => {...})()
5. **Transform API responses** - flatten junction table data before returning
6. **Use Drizzle ORM** - avoid raw SQL queries
7. **Follow DRY principles** - extract reusable components and logic
8. **Handle author data carefully** - it can be string, array, or objects
9. **Use CSS variables** - never hardcode colors or spacing
10. **Type forms correctly** - Button components should have type="submit" for form submission