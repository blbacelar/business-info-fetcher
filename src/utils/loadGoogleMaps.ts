declare global {
  interface Window {
    google: any;
  }
}

export const loadGoogleMaps = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }

    const maxAttempts = 50; // 5 seconds total
    let attempts = 0;

    const checkGoogleMaps = setInterval(() => {
      if (window.google?.maps) {
        clearInterval(checkGoogleMaps);
        resolve();
        return;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(checkGoogleMaps);
        reject(new Error("Google Maps failed to load"));
      }
    }, 100);
  });
};
