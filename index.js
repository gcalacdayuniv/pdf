import { Hono } from 'hono';
import { getImagesFromFolder, downloadImage } from './services/driveService.js';
import { createPdf } from './services/pdfService.js';
import { renderHTML } from './ui/template.js';

const app = new Hono();

app.get('/', (c) => {
  return c.html(renderHTML());
});

app.post('/generate', async (c) => {
  try {
    const body = await c.req.parseBody();
    const { folderId, apiKey, paperSize, customWidth, customLength, marginTop, marginBottom, marginLeft, marginRight } = body;

    if (!folderId || !apiKey) {
      return c.text('Folder ID and API Key are required.', 400);
    }

    const files = await getImagesFromFolder(folderId, apiKey);
    if (files.length === 0) {
      return c.text('No images found in this folder.', 404);
    }

    const imageBuffers = [];
    for (const file of files) {
      const buffer = await downloadImage(file.id, apiKey);
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
