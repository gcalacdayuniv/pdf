import { Hono } from 'hono';
import { getImagesFromFolder, downloadImage } from './services/driveService.js';
import { createPdf } from './services/pdfService.js';
import { renderHTML } from './ui/template.js';

const app = new Hono();

// Hardcoded API Key
const GOOGLE_API_KEY = "AIzaSyD8B4SRbew1s2BBlYkRXC2SaiCVcfMwFQs"; 

app.get('/', (c) => {
  return c.html(renderHTML());
});

app.post('/generate', async (c) => {
  try {
    const body = await c.req.parseBody();
    const { folderInput, paperSize, customWidth, customLength, marginTop, marginBottom, marginLeft, marginRight } = body;

    if (!folderInput) {
      return c.text('Folder ID or URL is required.', 400);
    }

    // Extract ID if a full URL is provided
    let folderId = folderInput;
    const urlMatch = folderInput.match(/folders\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
        folderId = urlMatch[1];
    }

    const files = await getImagesFromFolder(folderId, GOOGLE_API_KEY);
    if (files.length === 0) {
      return c.text('No images found in this folder.', 404);
    }

    // Cap at 45 files to prevent Cloudflare's 50 subrequest limit error
    const filesToProcess = files.slice(0, 45);

    const imageBuffers = [];
    for (const file of filesToProcess) {
      const buffer = await downloadImage(file.id, GOOGLE_API_KEY);
      imageBuffers.push({ buffer, mimeType: file.mimeType });
    }

    const pdfBytes = await createPdf(imageBuffers, {
      paperSize,
      customWidth,
      customHeight: customLength,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight
    });

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="merged_images.pdf"',
      },
    });
  } catch (error) {
    return c.text(`Error: ${error.message}`, 500);
  }
});

export default app;
