import { PDFDocument } from 'pdf-lib';

const INCH_TO_PT = 72;

export async function createPdf(imageBuffers, config) {
    const pdfDoc = await PDFDocument.create();

    let widthPt = 8.5 * INCH_TO_PT;
    let heightPt = 11 * INCH_TO_PT;

    if (config.paperSize === 'legal') {
        heightPt = 14 * INCH_TO_PT;
    } else if (config.paperSize === 'custom') {
        widthPt = (parseFloat(config.customWidth) || 8.5) * INCH_TO_PT;
        heightPt = (parseFloat(config.customHeight) || 11) * INCH_TO_PT;
    }

    const marginTop = (parseFloat(config.marginTop) ?? 1) * INCH_TO_PT;
    const marginBottom = (parseFloat(config.marginBottom) ?? 1) * INCH_TO_PT;
    const marginLeft = (parseFloat(config.marginLeft) ?? 1) * INCH_TO_PT;
    const marginRight = (parseFloat(config.marginRight) ?? 1) * INCH_TO_PT;

    const usableWidth = widthPt - marginLeft - marginRight;
    const usableHeight = heightPt - marginTop - marginBottom;

    for (const bufferObj of imageBuffers) {
        let image;
        try {
            if (bufferObj.mimeType === 'image/jpeg') {
                image = await pdfDoc.embedJpg(bufferObj.buffer);
            } else if (bufferObj.mimeType === 'image/png') {
                image = await pdfDoc.embedPng(bufferObj.buffer);
            } else {
                continue;
            }
        } catch (e) {
            console.error("Skipping unreadable image buffer");
            continue;
        }

        const page = pdfDoc.addPage([widthPt, heightPt]);
        const imageDims = image.scaleToFit(usableWidth, usableHeight);

        const x = marginLeft + (usableWidth - imageDims.width) / 2;
        const y = marginBottom + (usableHeight - imageDims.height) / 2;

        page.drawImage(image, {
            x,
            y,
            width: imageDims.width,
            height: imageDims.height,
        });
    }

    return await pdfDoc.save();
}
