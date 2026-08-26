export function renderHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Drive to PDF Merger</title>
    <script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 8px; box-sizing: border-box; }
        .margin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        button { padding: 10px 15px; background: #0056b3; color: white; border: none; cursor: pointer; width: 100%; font-size: 16px; margin-top: 10px; }
        button:hover { background: #004494; }
        button:disabled { background: #cccccc; cursor: not-allowed; }
        #status { margin-top: 15px; font-weight: bold; color: #333; text-align: center; }
    </style>
</head>
<body>
    <h2>Merge Google Drive Images or Slides to PDF</h2>
    <form id="pdfForm">
        <div class="form-group">
            <label>Google Drive Folder URL or Google Slides URL</label>
            <input type="text" id="folderInput" placeholder="e.g. https://drive.google.com/... or https://docs.google.com/presentation/..." required>
        </div>
        <div class="form-group">
            <label>Output File Name</label>
            <input type="text" id="outputFileName" value="Name here" placeholder="e.g. merged_document" required>
        </div>
        <div class="form-group">
            <label>Compression Quality (For Email)</label>
            <select id="compressionQuality">
                <option value="original">Original (No Compression)</option>
                <option value="medium" selected>Medium (Balances Quality and Size)</option>
                <option value="low">Low (Smallest File Size)</option>
            </select>
        </div>
        <div class="form-group">
            <label>Paper Size</label>
            <select id="paperSize" onchange="toggleCustomSize()">
                <option value="letter">Letter (8.5 x 11 in)</option>
                <option value="legal">Legal (8.5 x 14 in)</option>
                <option value="custom">Custom</option>
            </select>
        </div>
        <div id="customDimensions" style="display: none;" class="margin-grid">
            <div class="form-group">
                <label>Width (inches)</label>
                <input type="number" step="0.01" id="customWidth" value="8.5">
            </div>
            <div class="form-group">
                <label>Length (inches)</label>
                <input type="number" step="0.01" id="customLength" value="11">
            </div>
        </div>
        <div class="margin-grid">
            <div class="form-group">
                <label>Top Margin (in)</label>
                <input type="number" step="0.01" id="marginTop" value="1" required>
            </div>
            <div class="form-group">
                <label>Bottom Margin (in)</label>
                <input type="number" step="0.01" id="marginBottom" value="1" required>
            </div>
            <div class="form-group">
                <label>Left Margin (in)</label>
                <input type="number" step="0.01" id="marginLeft" value="1" required>
            </div>
            <div class="form-group">
                <label>Right Margin (in)</label>
                <input type="number" step="0.01" id="marginRight" value="1" required>
            </div>
        </div>
        <div class="form-group">
            <label>Invisible Prompt Injection (.txt file, optional)</label>
            <input type="file" id="promptInjectionFile" accept=".txt">
        </div>
        <button type="submit" id="submitBtn">Generate PDF</button>
    </form>
    
    <div id="status"></div>

    <script>
        const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz1955uU1r29FNbK2HGPLQlABwCBnZrQX6ckmeKRI50bim9CGDGiW3ZFzPbV1tHrMkudQ/exec";
        const INCH_TO_PT = 72;
        
        function toggleCustomSize() {
            const size = document.getElementById('paperSize').value;
            const customDiv = document.getElementById('customDimensions');
            customDiv.style.display = size === 'custom' ? 'grid' : 'none';
        }

        function base64ToUint8Array(base64) {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }

        async function compressImage(imgBytes, mimeType, qualitySetting) {
            if (qualitySetting === 'original') {
                return { bytes: imgBytes, isJpg: mimeType === 'image/jpeg' || mimeType === 'image/jpg' };
            }

            const blob = new Blob([imgBytes], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });
            URL.revokeObjectURL(url);

            let maxDim = 1500;
            let jpegQuality = 0.6;
            
            if (qualitySetting === 'low') {
                maxDim = 1000;
                jpegQuality = 0.4;
            }

            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
            const base64 = dataUrl.split(',')[1];
            
            return { bytes: base64ToUint8Array(base64), isJpg: true };
        }

        document.getElementById('pdfForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submitBtn');
            const statusText = document.getElementById('status');
            
            submitBtn.disabled = true;
            statusText.innerText = "Processing request...";

            try {
                let folderInput = document.getElementById('folderInput').value;
                
                let customFileName = document.getElementById('outputFileName').value.trim();
                if (!customFileName.toLowerCase().endsWith('.pdf')) {
                    customFileName += '.pdf';
                }
                
                const qualitySetting = document.getElementById('compressionQuality').value;

                const injectionFile = document.getElementById('promptInjectionFile').files[0];
                let injectionText = "";
                if (injectionFile) {
                    injectionText = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = (e) => reject(e);
                        reader.readAsText(injectionFile);
                    });
                    injectionText = injectionText.replace(/[^\\x00-\\x7F]/g, " ");
                }

                const pdfDoc = await PDFLib.PDFDocument.create();
                const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
                
                const paperSize = document.getElementById('paperSize').value;
                let widthPt = 8.5 * INCH_TO_PT;
                let heightPt = 11 * INCH_TO_PT;

                if (paperSize === 'legal') {
                    heightPt = 14 * INCH_TO_PT;
                } else if (paperSize === 'custom') {
                    widthPt = (parseFloat(document.getElementById('customWidth').value) || 8.5) * INCH_TO_PT;
                    heightPt = (parseFloat(document.getElementById('customLength').value) || 11) * INCH_TO_PT;
                }

                const marginTop = (parseFloat(document.getElementById('marginTop').value) || 0) * INCH_TO_PT;
                const marginBottom = (parseFloat(document.getElementById('marginBottom').value) || 0) * INCH_TO_PT;
                const marginLeft = (parseFloat(document.getElementById('marginLeft').value) || 0) * INCH_TO_PT;
                const marginRight = (parseFloat(document.getElementById('marginRight').value) || 0) * INCH_TO_PT;

                const usableWidth = widthPt - marginLeft - marginRight;
                const usableHeight = heightPt - marginTop - marginBottom;

                async function addImageToPdf(originalBytes, mimeType) {
                    let image;
                    try {
                        const { bytes: processedBytes, isJpg } = await compressImage(originalBytes, mimeType, qualitySetting);
                        if (isJpg) {
                            image = await pdfDoc.embedJpg(processedBytes);
                        } else {
                            image = await pdfDoc.embedPng(processedBytes);
                        }
                    } catch (err) {
                        console.error("Skipping unreadable or unprocessable image");
                        return;
                    }

                    if (image) {
                        const page = pdfDoc.addPage([widthPt, heightPt]);
                        const imageDims = image.scaleToFit(usableWidth, usableHeight);
                        const x = marginLeft + (usableWidth - imageDims.width) / 2;
                        const y = marginBottom + (usableHeight - imageDims.height) / 2;

                        page.drawImage(image, { x, y, width: imageDims.width, height: imageDims.height });
                        
                        if (injectionText) {
                            page.drawText(injectionText.substring(0, 5000), {
                                x: 10, y: 10, size: 1, font: helveticaFont, color: PDFLib.rgb(1, 1, 1), opacity: 0
                            });
                        }
                    }
                }

                const slideMatch = folderInput.match(/presentation\\/d\\/([a-zA-Z0-9-_]+)/);
                const folderMatch = folderInput.match(/folders\\/([a-zA-Z0-9-_]+)/);

                if (slideMatch && slideMatch[1]) {
                    const presentationId = slideMatch[1];
                    statusText.innerText = "Connecting to Google Slides via Apps Script...";
                    
                    const listUrl = \`\${GAS_WEB_APP_URL}?action=getSlides&presentationId=\${presentationId}\`;
                    const listResponse = await fetch(listUrl, { redirect: "follow" });
                    
                    const listText = await listResponse.text();
                    let data;
                    try {
                        data = JSON.parse(listText);
                    } catch (err) {
                        throw new Error('Google Apps Script failed to respond correctly. Please check your App Script deployment.');
                    }
                    
                    if (data.error) throw new Error(data.error);
                    
                    const slides = data.slides || [];
                    if (slides.length === 0) throw new Error('No visible slides found in this presentation.');
                    
                    statusText.innerText = \`Found \${slides.length} visible slides. Formatting PDF...\`;

                    for (let i = 0; i < slides.length; i++) {
                        const slide = slides[i];
                        statusText.innerText = \`Processing slide \${i + 1} of \${slides.length}...\`;
                        
                        if (slide.base64) {
                            await addImageToPdf(base64ToUint8Array(slide.base64), slide.mimeType || 'image/png');
                        } else {
                            console.warn(\`Skipping slide \${i + 1}: No image data\`);
                        }
                    }
                } else {
                    let folderId = folderInput;
                    if (folderMatch && folderMatch[1]) {
                        folderId = folderMatch[1];
                    }
                    
                    statusText.innerText = "Connecting to Google Drive via Apps Script...";
                    const listUrl = \`\${GAS_WEB_APP_URL}?action=list&folderId=\${folderId}\`;
                    const listResponse = await fetch(listUrl, { redirect: "follow" });
                    
                    const listText = await listResponse.text();
                    let data;
                    try {
                        data = JSON.parse(listText);
                    } catch (err) {
                        throw new Error('Google Apps Script failed to respond correctly. Please check your App Script deployment.');
                    }
                    
                    if (data.error) throw new Error(data.error);
                    
                    const files = data.files || [];
                    if (files.length === 0) throw new Error('No images found in this folder.');

                    statusText.innerText = \`Found \${files.length} images. Formatting PDF...\`;

                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        statusText.innerText = \`Processing image \${i + 1} of \${files.length}...\`;
                        
                        const imgUrl = \`\${GAS_WEB_APP_URL}?action=getFile&fileId=\${file.id}\`;
                        const imgResponse = await fetch(imgUrl, { redirect: "follow" });
                        
                        const imgText = await imgResponse.text();
                        let imgData;
                        try {
                            imgData = JSON.parse(imgText);
                        } catch (err) {
                            console.warn(\`Failed to parse response for \${file.name}. Moving to next.\`);
                            continue;
                        }

                        if (imgData.error) {
                            console.error(\`Script Error on \${file.name}: \${imgData.error}\`);
                            continue;
                        }

                        await addImageToPdf(base64ToUint8Array(imgData.base64), file.mimeType);
                    }
                }

                statusText.innerText = "Finalizing PDF document...";
                const pdfBytes = await pdfDoc.save();
                
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = customFileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);

                statusText.innerText = \`Success! Saved as \${customFileName}.\`;
            } catch (error) {
                statusText.innerText = \`Error: \${error.message}\`;
                statusText.style.color = "red";
            } finally {
                submitBtn.disabled = false;
            }
        });
    </script>
</body>
</html>`;
}
