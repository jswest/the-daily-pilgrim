import puppeteer from "puppeteer";
import { join } from "path";

export class ChromiumPDFGenerator {
  constructor(options = {}) {
    this.options = {
      pageWidthMM: options.pageWidthMM || 90,
      pageHeightMM: options.pageHeightMM || 160,
      marginMM: options.marginMM || 8,
      viewportW: options.viewportW || 360,
      viewportH: options.viewportH || 640,
      waitForLoad: options.waitForLoad || 2000,
      headless: options.headless !== false,
      ...options,
    };
  }

  async generatePDF(printUrl, outputPath) {
    let browser;

    try {
      console.log(`Launching browser...`);
      browser = await puppeteer.launch({
        headless: this.options.headless,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-web-security",
          "--font-render-hinting=none",
        ],
      });

      const page = await browser.newPage();

      // Set viewport for preview
      await page.setViewport({
        width: this.options.viewportW,
        height: this.options.viewportH,
        deviceScaleFactor: 2,
      });

      // Enable font loading
      await page.evaluateOnNewDocument(() => {
        // Force font loading
        document.fonts.ready.then(() => {
          console.log("Fonts loaded");
        });
      });

      console.log(`Navigating to: ${printUrl}`);
      await page.goto(printUrl, {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 30000,
      });

      // Wait for fonts and any dynamic content
      console.log(`Waiting for content to load...`);
      await new Promise((resolve) =>
        setTimeout(resolve, this.options.waitForLoad)
      );

      // Wait for fonts to be ready
      await page.evaluate(() => document.fonts.ready);

      // Generate PDF with paged media settings
      console.log(`Generating PDF...`);
      const pdf = await page.pdf({
        path: outputPath,
        format: "A4", // Will be overridden by @page CSS
        printBackground: true,
        preferCSSPageSize: true, // Honor @page size in CSS
        displayHeaderFooter: false,
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      });

      console.log(`PDF generated successfully: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async generateFromIssue(
    issueParam,
    outputPath,
    baseUrl = "http://localhost:5173"
  ) {
    const printUrl = `${baseUrl}/print?issue=${encodeURIComponent(issueParam)}`;
    return this.generatePDF(printUrl, outputPath);
  }

  async generatePreviewScreenshot(printUrl, outputPath) {
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: this.options.headless,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setViewport({
        width: this.options.viewportW,
        height: this.options.viewportH,
        deviceScaleFactor: 2,
      });

      await page.goto(printUrl, {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 30000,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.evaluate(() => document.fonts.ready);

      await page.screenshot({
        path: outputPath,
        fullPage: true,
        type: "png",
      });

      console.log(`Preview screenshot saved: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error("Error generating preview:", error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
