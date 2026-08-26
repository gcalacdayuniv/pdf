function doGet(e) {
  var action = e.parameter.action;
  
  try {
    if (action === 'list') {
      var folderId = e.parameter.folderId;
      var folder = DriveApp.getFolderById(folderId);
      var files = folder.getFiles();
      var fileList = [];
      
      while (files.hasNext()) {
        var file = files.next();
        var mime = file.getMimeType();
        if (mime === MimeType.JPEG || mime === MimeType.PNG) {
          fileList.push({
            id: file.getId(),
            name: file.getName(),
            mimeType: mime
          });
        }
      }
      
      fileList.sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });
      
      return ContentService.createTextOutput(JSON.stringify({files: fileList}))
        .setMimeType(ContentService.MimeType.JSON);
        
    } else if (action === 'getFile') {
      var fileId = e.parameter.fileId;
      var file = DriveApp.getFileById(fileId);
      var blob = file.getBlob();
      var base64 = Utilities.base64Encode(blob.getBytes());
      
      return ContentService.createTextOutput(JSON.stringify({
        base64: base64,
        mimeType: file.getMimeType()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
