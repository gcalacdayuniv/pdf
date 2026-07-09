export async function getImagesFromFolder(folderId, apiKey) {
    const query = `'${folderId}' in parents and (mimeType='image/jpeg' or mimeType='image/png') and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=name&fields=files(id,name,mimeType)&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
}

export async function downloadImage(fileId, apiKey) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to download image ${fileId}`);
    }

    return await response.arrayBuffer();
}
