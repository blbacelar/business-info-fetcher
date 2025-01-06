// This script will be injected into web pages to handle geolocation
if (window.navigator.geolocation) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getLocation") {
      window.navigator.geolocation.getCurrentPosition(
        (position) => {
          sendResponse({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          sendResponse({ error: error.message });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
      return true; // Indicates we wish to send a response asynchronously
    }
  });
}
