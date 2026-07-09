export function renderHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Drive to PDF Merger</title>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 8px; box-sizing: border-box; }
        .margin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        button { padding: 10px 15px; background: #0056b3; color: white; border: none; cursor: pointer; width: 100%; font-size: 16px; }
        button:hover { background: #004494; }
    </style>
</head>
<body>
    <h2>Merge Google Drive Images to PDF</h2>
    <form action="/generate" method="POST">
        <div class="form-group">
            <label>Google Drive Folder ID or URL</label>
            <input type="text" name="folderInput" placeholder="e.g. https://drive.google.com/drive/folders/..." required>
        </div>
        <div class="form-group">
            <label>Paper Size</label>
            <select name="paperSize" id="paperSize" onchange="toggleCustomSize()">
                <option value="letter">Letter (8.5 x 11 in)</option>
                <option value="legal">Legal (8.5 x 14 in)</option>
                <option value="custom">Custom</option>
            </select>
        </div>
        <div id="customDimensions" style="display: none;" class="margin-grid">
            <div class="form-group">
                <label>Width (inches)</label>
                <input type="number" step="0.01" name="customWidth" value="8.5">
            </div>
            <div class="form-group">
                <label>Length (inches)</label>
                <input type="number" step="0.01" name="customLength" value="11">
            </div>
        </div>
        <div class="margin-grid">
            <div class="form-group">
                <label>Top Margin (in)</label>
                <input type="number" step="0.01" name="marginTop" value="1" required>
            </div>
            <div class="form-group">
                <label>Bottom Margin (in)</label>
                <input type="number" step="0.01" name="marginBottom" value="1" required>
            </div>
            <div class="form-group">
                <label>Left Margin (in)</label>
                <input type="number" step="0.01" name="marginLeft" value="1" required>
            </div>
            <div class="form-group">
                <label>Right Margin (in)</label>
                <input type="number" step="0.01" name="marginRight" value="1" required>
            </div>
        </div>
        <button type="submit">Generate PDF</button>
    </form>
    <script>
        function toggleCustomSize() {
            const size = document.getElementById('paperSize').value;
            const customDiv = document.getElementById('customDimensions');
            customDiv.style.display = size === 'custom' ? 'grid' : 'none';
        }
    </script>
</body>
</html>`;
}
