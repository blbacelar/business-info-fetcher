chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "loadMap") {
    // Handle map loading or API interactions here
  }
});
