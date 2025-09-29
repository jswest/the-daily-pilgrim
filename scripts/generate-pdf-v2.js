#!/usr/bin/env node

import { ChromiumPDFGenerator } from '../src/lib/pdf/chromium-generator.js';
import { getDatabase } from '../src/lib/db/connection.js';
import { editions } from '../src/lib/db/schema.js';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const OUTPUT_DIR = join(process.cwd(), 'out');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        const db = getDatabase();
        const generator = new ChromiumPDFGenerator({
            pageWidthMM: 90,
            pageHeightMM: 160,
            marginMM: 8,
            viewportW: 360,
            viewportH: 640,
            waitForLoad: 3000
        });

        switch (command) {
            case 'list':
                console.log('Available Editions:');
                const allEditions = await db.query.editions.findMany({
                    orderBy: (editions, { desc }) => [desc(editions.publishedAt)]
                });
                if (allEditions.length === 0) {
                    console.log('No editions found.');
                } else {
                    allEditions.forEach(edition => {
                        const publishedDate = new Date(edition.publishedAt).toLocaleDateString();
                        console.log(`- Issue ${edition.issueNumber} (ID: ${edition.id}) - ${publishedDate}`);
                    });
                }
                break;

            case 'generate':
                const editionId = args[1];
                if (!editionId) {
                    console.error('Usage: npm run pdf:generate <edition-id>');
                    console.error('Use "npm run pdf:list" to see available editions');
                    process.exit(1);
                }

                const edition = await db.query.editions.findFirst({
                    where: (editions, { eq }) => eq(editions.id, parseInt(editionId))
                });
                if (!edition) {
                    console.error(`Edition ${editionId} not found.`);
                    process.exit(1);
                }

                const filename = `daily-pilgrim-issue-${edition.issueNumber}.pdf`;
                const outputPath = join(OUTPUT_DIR, filename);

                console.log(`Generating PDF for Issue ${edition.issueNumber}...`);
                console.log(`Print URL: ${BASE_URL}/print?issue=${edition.issueNumber}`);

                await generator.generateFromIssue(edition.issueNumber, outputPath, BASE_URL);

                console.log(`✓ PDF generated successfully!`);
                console.log(`  File: ${filename}`);
                console.log(`  Path: ${outputPath}`);
                break;

            case 'issue':
                const issueNumber = args[1];
                if (!issueNumber) {
                    console.error('Usage: npm run pdf:issue <issue-number>');
                    process.exit(1);
                }

                const issueFilename = `daily-pilgrim-issue-${issueNumber}.pdf`;
                const issueOutputPath = join(OUTPUT_DIR, issueFilename);

                console.log(`Generating PDF for Issue ${issueNumber}...`);
                console.log(`Print URL: ${BASE_URL}/print?issue=${issueNumber}`);

                await generator.generateFromIssue(issueNumber, issueOutputPath, BASE_URL);

                console.log(`✓ PDF generated successfully!`);
                console.log(`  File: ${issueFilename}`);
                console.log(`  Path: ${issueOutputPath}`);
                break;

            case 'date':
                const dateParam = args[1];
                if (!dateParam) {
                    console.error('Usage: npm run pdf:date <date> (e.g., 2025-09-22)');
                    process.exit(1);
                }

                const dateFilename = `daily-pilgrim-${dateParam}.pdf`;
                const dateOutputPath = join(OUTPUT_DIR, dateFilename);

                console.log(`Generating PDF for date ${dateParam}...`);
                console.log(`Print URL: ${BASE_URL}/print?issue=${dateParam}`);

                await generator.generateFromIssue(dateParam, dateOutputPath, BASE_URL);

                console.log(`✓ PDF generated successfully!`);
                console.log(`  File: ${dateFilename}`);
                console.log(`  Path: ${dateOutputPath}`);
                break;

            case 'preview':
                const previewParam = args[1];
                if (!previewParam) {
                    console.error('Usage: npm run pdf:preview <issue-number-or-date>');
                    process.exit(1);
                }

                const previewFilename = `preview-${previewParam}.png`;
                const previewOutputPath = join(OUTPUT_DIR, previewFilename);
                const previewUrl = `${BASE_URL}/print?issue=${previewParam}`;

                console.log(`Generating preview for ${previewParam}...`);
                console.log(`Print URL: ${previewUrl}`);

                await generator.generatePreviewScreenshot(previewUrl, previewOutputPath);

                console.log(`✓ Preview generated successfully!`);
                console.log(`  File: ${previewFilename}`);
                console.log(`  Path: ${previewOutputPath}`);
                break;

            case 'info':
                const infoId = args[1];
                if (!infoId) {
                    console.error('Usage: npm run pdf:info <edition-id>');
                    process.exit(1);
                }

                const infoEdition = await db.query.editions.findFirst({
                    where: (editions, { eq }) => eq(editions.id, parseInt(infoId)),
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
                        images: {
                            with: {
                                image: {
                                    with: {
                                        authors: {
                                            with: {
                                                author: true,
                                            },
                                        },
                                    },
                                },
                            },
                            orderBy: (editionImages, { asc }) => [asc(editionImages.orderPosition)],
                        },
                    },
                });
                if (!infoEdition) {
                    console.error(`Edition ${infoId} not found.`);
                    process.exit(1);
                }

                console.log(`Edition ${infoEdition.id} - Issue ${infoEdition.issueNumber}`);
                console.log(`Published: ${new Date(infoEdition.publishedAt).toLocaleDateString()}`);
                console.log(`Cover Image: ${infoEdition.coverImage ? infoEdition.coverImage.filename : 'None'}`);
                console.log(`Print URL: ${BASE_URL}/print?issue=${infoEdition.issueNumber}`);
                console.log('');
                console.log('Content:');
                console.log(`  Articles: ${infoEdition.articles?.length || 0}`);
                infoEdition.articles?.forEach((editionArticle, index) => {
                    const article = editionArticle.article;
                    const authors = article.authors?.map(aa => aa.author.name).join(', ') || '';
                    console.log(`    ${index + 1}. ${article.hed}${authors ? ` (by ${authors})` : ''}`);
                });

                console.log(`  Poems: ${infoEdition.poems?.length || 0}`);
                infoEdition.poems?.forEach((editionPoem, index) => {
                    const poem = editionPoem.poem;
                    const authors = poem.authors?.map(pa => pa.author.name).join(', ') || '';
                    console.log(`    ${index + 1}. ${poem.title}${authors ? ` (by ${authors})` : ''}`);
                });

                console.log(`  Images: ${infoEdition.images?.length || 0}`);
                infoEdition.images?.forEach((editionImage, index) => {
                    const image = editionImage.image;
                    const authors = image.authors?.map(ia => ia.author.name).join(', ') || '';
                    console.log(`    ${index + 1}. ${image.filename} (${editionImage.usageType})${authors ? ` by ${authors}` : ''}`);
                });
                break;

            case 'test-url':
                const testUrl = args[1] || `${BASE_URL}/print?issue=1`;
                const testOutputPath = join(OUTPUT_DIR, 'test-output.pdf');

                console.log(`Testing PDF generation with URL: ${testUrl}`);

                await generator.generatePDF(testUrl, testOutputPath);

                console.log(`✓ Test PDF generated successfully!`);
                console.log(`  Path: ${testOutputPath}`);
                break;

            case 'all':
                console.log('Generating PDFs for all editions...');
                const allEditionsForGeneration = await db.query.editions.findMany({
                    orderBy: (editions, { desc }) => [desc(editions.publishedAt)]
                });

                if (allEditionsForGeneration.length === 0) {
                    console.log('No editions found.');
                    break;
                }

                for (const edition of allEditionsForGeneration) {
                    try {
                        const filename = `daily-pilgrim-issue-${edition.issueNumber}.pdf`;
                        const outputPath = join(OUTPUT_DIR, filename);

                        console.log(`\nGenerating Issue ${edition.issueNumber}...`);
                        await generator.generateFromIssue(edition.issueNumber, outputPath, BASE_URL);
                        console.log(`✓ Issue ${edition.issueNumber}: ${filename}`);
                    } catch (error) {
                        console.error(`✗ Issue ${edition.issueNumber}: ${error.message}`);
                    }
                }
                break;

            default:
                console.log('PDF Generation CLI (Chromium/CSS Print Media)');
                console.log('');
                console.log('Usage:');
                console.log('  node scripts/generate-pdf-v2.js <command> [args]');
                console.log('');
                console.log('Commands:');
                console.log('  list                       List all available editions');
                console.log('  generate <edition-id>      Generate PDF for specific edition by ID');
                console.log('  issue <issue-number>       Generate PDF for specific issue number');
                console.log('  date <date>                Generate PDF for specific date (e.g., 2025-09-22)');
                console.log('  preview <issue-or-date>    Generate preview screenshot');
                console.log('  info <edition-id>          Show detailed info about an edition');
                console.log('  test-url [url]             Test PDF generation with specific URL');
                console.log('  all                        Generate PDFs for all editions');
                console.log('');
                console.log('Environment Variables:');
                console.log('  BASE_URL                   Base URL for the print route (default: http://localhost:5173)');
                console.log('');
                console.log('Examples:');
                console.log('  node scripts/generate-pdf-v2.js list');
                console.log('  node scripts/generate-pdf-v2.js generate 1');
                console.log('  node scripts/generate-pdf-v2.js issue 1');
                console.log('  node scripts/generate-pdf-v2.js date 2025-09-22');
                console.log('  node scripts/generate-pdf-v2.js preview 1');
                console.log('  node scripts/generate-pdf-v2.js test-url http://localhost:5173/print?issue=1');
                console.log('');
                console.log('Output directory: ' + OUTPUT_DIR);
                break;
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    process.exit(0);
});

main();