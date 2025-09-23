# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Daily Pilgrim is a two-part system: a SvelteKit 5 frontend for content management and Node.js backend processes for PDF generation. The system manages articles, poems, and images in a SQLite database, then generates mobile-first magazine PDFs (9:16 aspect ratio).

## Architecture

**Frontend (SvelteKit 5)**: Content management interface where users create/edit articles, poems, images, and manage editions.

**Backend (Node.js)**: PDF generation processes that read from the database and create magazine editions.

**Database (SQLite)**: Centralized storage with normalized schema including authors table and many-to-many relationships.

## Content Types

- **Articles**: Have hed, dek, body, and associated authors
- **Images**: Full-bleed (9:16) for backgrounds or 16:9 for titles, with 1-bit dithering processing and photographer attribution
- **Poems**: Have title, body, and associated authors
- **Authors**: Normalized author data for writers, photographers, artists

## Tech Stack

**Frontend**:
- **SvelteKit 5** - Content management UI
- **better-sqlite3** - Database integration

**Backend**:
- **Node.js** - PDF generation processes
- **Puppeteer** - PDF generation with precise layout control
- **Sharp** - Image processing and 1-bit dithering
- **better-sqlite3** - Database access

## Commands

```bash
# Development
npm run dev          # Start SvelteKit dev server
npm run build        # Build SvelteKit app
npm run preview      # Preview built app

# Image Processing
npm run process:status   # Show image processing queue status
npm run process:all      # Process all pending images
npm run process:reset    # Reset failed images to pending
npm run process:worker   # Start background processing worker

# PDF Generation
npm run pdf:list         # List all available editions
npm run pdf:generate     # Generate PDF for specific edition (requires edition ID)
npm run pdf:issue        # Generate PDF for specific issue number
npm run pdf:info         # Show detailed info about an edition
npm run pdf:all          # Generate PDFs for all editions
```

## Current Project Structure

```
src/
├── routes/           # SvelteKit pages (content management UI)
├── lib/             # Shared utilities and components  
├── db/              # Database schema (✓ complete)
└── app.html         # SvelteKit app template

# Database schema location:
src/db/schema.sql     # Complete SQLite schema with authors table
```

## Development Plan

### Phase 1: Database Layer
1. Create database initialization script
2. Build database connection utilities
3. Create data access layer (models/repositories)

### Phase 2: SvelteKit Content Management
1. Create forms for articles, poems, authors
2. Build image upload and management interface
3. Create edition management interface
4. Implement CRUD operations

### Phase 3: PDF Generation Backend
1. Set up Node.js CLI for PDF generation
2. Build image processing pipeline (1-bit dithering)
3. Create HTML templates for PDF layouts
4. Implement Puppeteer PDF generation
5. Add cover and table of contents generation

## Design System

The project uses a consistent CSS design system based on CSS custom properties and typography-focused design:

### CSS Variables
```css
:global(:root) {
  --color-bg: #ffffff;      /* Background color */
  --color-fg: #000000;      /* Foreground/text color */
  --color-off: #0066cc;     /* Primary accent color */
  --color-warn: #cc6600;    /* Warning/error color */
  --font-body: "Cormorant"; /* Body text font */
  --font-dek: "Merriweather"; /* Dek/subtitle font */
  --font-hed: "Merriweather"; /* Headline font */
  --font-masthead: "Bodoni Moda"; /* Masthead font */
  --unit: 16px;             /* Base unit for spacing */
}
```

### Button Styles
- `.btn` - Base button class with opacity transition
- `.btn-primary` - Blue background (--color-off) with white text
- `.btn-secondary` - White background with black border

### Layout
- Use CSS Grid for card layouts: `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`
- Consistent spacing using `var(--unit)` multiples
- Typography hierarchy using the defined font families

### Implementation
All pages should use this design system consistently. Apply these styles instead of creating custom styling.

## Key Implementation Notes

- Database schema includes authors table with many-to-many relationships
- All PDFs must be mobile-first with 9:16 aspect ratio
- Images require 1-bit dithering processing via Sharp
- Each edition needs cover page with title, issue number, and date
- Table of contents page lists all articles, images, and poems
- Background images are full-bleed 9:16, title images are 16:9
- Author attribution supports multiple authors per content piece
- Use the consistent CSS design system across all pages