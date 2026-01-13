import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// Simple HTML to PDF using pdf-lib (basic implementation)
// For production, consider using Puppeteer for better HTML rendering
export async function generatePdfFromHtml(htmlContent: string, outputPath: string): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Simple HTML parsing (basic - for full HTML support use Puppeteer)
  const text = htmlContent
    .replace(/<[^>]*>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  const lines = text.split('\n').filter(line => line.trim());
  const pageWidth = 612; // Letter size
  const pageHeight = 792;
  const margin = 50;
  const lineHeight = 14;
  let currentY = pageHeight - margin;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);

  for (const line of lines) {
    if (currentY < margin + lineHeight) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }

    page.drawText(line.trim(), {
      x: margin,
      y: currentY,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    });

    currentY -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return outputPath;
}

// Serverless version - works with base64 PDF data
export async function mergeSignaturesIntoPdfData(
  pdfBase64: string,
  signatures: Array<{
    pageNumber: number;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
    value: string; // base64 image
    fieldType: string;
  }>
): Promise<string> {
  // Decode base64 PDF
  const pdfBytes = Buffer.from(pdfBase64, 'base64');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const sig of signatures) {
    if (!sig.value || sig.pageNumber > pages.length) continue;

    const page = pages[sig.pageNumber - 1];
    const { width, height } = page.getSize();

    const fieldX = (sig.xPercent / 100) * width;
    const fieldY = height - (sig.yPercent / 100) * height;
    const fieldWidth = (sig.widthPercent / 100) * width;
    const fieldHeight = (sig.heightPercent / 100) * height;

    if (sig.fieldType === 'SIGNATURE' || sig.fieldType === 'INITIALS') {
      // Embed signature image
      const base64Data = sig.value.replace(/^data:image\/\w+;base64,/, '');
      const imageBytes = Buffer.from(base64Data, 'base64');

      let image;
      try {
        image = await pdfDoc.embedPng(imageBytes);
      } catch {
        try {
          image = await pdfDoc.embedJpg(imageBytes);
        } catch {
          console.error('Failed to embed signature image for field type:', sig.fieldType);
          continue;
        }
      }

      page.drawImage(image, {
        x: fieldX,
        y: fieldY - fieldHeight,
        width: fieldWidth,
        height: fieldHeight
      });
    } else if (sig.fieldType === 'DATE' || sig.fieldType === 'TEXT') {
      // Draw text
      page.drawText(sig.value, {
        x: fieldX + 2,
        y: fieldY - fieldHeight + 5,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      });
    } else if (sig.fieldType === 'CHECKBOX') {
      // Draw checkmark
      if (sig.value === 'true' || sig.value === 'checked') {
        page.drawText('✓', {
          x: fieldX + 2,
          y: fieldY - fieldHeight + 2,
          size: 14,
          font,
          color: rgb(0, 0.5, 0)
        });
      }
    }
  }

  const resultBytes = await pdfDoc.save();
  return Buffer.from(resultBytes).toString('base64');
}

export async function mergeSiganturesIntoPdf(
  originalPdfPath: string,
  signatures: Array<{
    pageNumber: number;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
    value: string; // base64 image
  }>,
  outputPath: string
): Promise<string> {
  const existingPdfBytes = fs.readFileSync(originalPdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();

  for (const sig of signatures) {
    if (sig.pageNumber > pages.length) continue;

    const page = pages[sig.pageNumber - 1];
    const { width, height } = page.getSize();

    // Decode base64 image
    const base64Data = sig.value.replace(/^data:image\/\w+;base64,/, '');
    const imageBytes = Buffer.from(base64Data, 'base64');

    let image;
    try {
      image = await pdfDoc.embedPng(imageBytes);
    } catch {
      try {
        image = await pdfDoc.embedJpg(imageBytes);
      } catch {
        console.error('Failed to embed signature image');
        continue;
      }
    }

    const sigWidth = (sig.widthPercent / 100) * width;
    const sigHeight = (sig.heightPercent / 100) * height;
    const sigX = (sig.xPercent / 100) * width;
    const sigY = height - (sig.yPercent / 100) * height - sigHeight;

    page.drawImage(image, {
      x: sigX,
      y: sigY,
      width: sigWidth,
      height: sigHeight
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return outputPath;
}

export async function addCertificatePage(
  pdfPath: string,
  documentTitle: string,
  recipients: Array<{ name: string; email: string; signedAt: Date | null }>,
  outputPath: string
): Promise<string> {
  const existingPdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let y = height - 50;

  // Title
  page.drawText('Certificate of Completion', {
    x: 50,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  y -= 40;

  // Document info
  page.drawText(`Document: ${documentTitle}`, {
    x: 50,
    y,
    size: 12,
    font,
    color: rgb(0, 0, 0)
  });
  y -= 20;

  page.drawText(`Completed: ${new Date().toLocaleString()}`, {
    x: 50,
    y,
    size: 12,
    font,
    color: rgb(0, 0, 0)
  });
  y -= 40;

  // Signers
  page.drawText('Signers:', {
    x: 50,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  y -= 25;

  for (const recipient of recipients) {
    page.drawText(`• ${recipient.name} (${recipient.email})`, {
      x: 60,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0)
    });
    y -= 15;

    if (recipient.signedAt) {
      page.drawText(`  Signed: ${new Date(recipient.signedAt).toLocaleString()}`, {
        x: 70,
        y,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4)
      });
      y -= 20;
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return outputPath;
}

export function getPdfPageCount(pdfPath: string): Promise<number> {
  return new Promise(async (resolve) => {
    try {
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      resolve(pdfDoc.getPageCount());
    } catch {
      resolve(1);
    }
  });
}
