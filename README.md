# The Daily Pilgrim

`The Daily Pilgrim` is software--a series of NodeJS processes--that take text input (markdown) and images, stuffs them into a SQLite database, and then generates an "edition" of a mobile-first "magazine": a 9:16 aspect-ratio PDF with a cover and multiple pages.

Input is managed via a SvelteKit (version 5) application.

Each edition has a few attributes:

1. A `cover_image`, which is displayed on the cover.
2. An `issue_number`, which is displayed on the cover and the the table of contents.
3. A `published_at` date, which is displayed on the cover and the table of contents.

The cover of each edition should have "THE DAILY PILGRIM" as well as an issue number and date. The second page, which has the table of contents, should list clearly the articles in the edition, as well as the images and poems included.

There are three kinds of material in each edition:

1. **Articles**. These form the backbone of the edition. There will always be at least one. They have a "hed", "dek", "byline", and "body".
2. **Images**. These are used in two types, first as "background" fixtures, such as on the cover page, or "inline", such as on the title page of a given article. When "background," they will be full-bleed at 9:16. When they are "title," they will be 16:9. They will also have a caption. All images will be processed so that they are one-bit dithered images.
3. **Poems**. These have a "title", "byline", and "body".