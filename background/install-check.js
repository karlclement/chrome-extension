// Send a message to Email Hunter website if the extension is installed
//
chrome.runtime.onMessageExternal.addListener(
function(request, sender, sendResponse) {
    if (request) {
        if (request.message) {
            if (request.message == "version") {
              var manifest = chrome.runtime.getManifest();
              sendResponse({version: manifest.version});
            }
        }
    }
    return true;
});