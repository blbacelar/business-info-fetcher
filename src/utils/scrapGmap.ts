interface GMapResult {
  name: string;
  address: string;
  phone?: string;
  website?: string;
}

// Create a unique key for each result
function createResultKey(result: GMapResult): string {
  return `${result.name}__${result.address}`.toLowerCase();
}

export async function scrapeGoogleMaps(
  keyword: string,
  location: string
): Promise<GMapResult[]> {
  console.log(`Starting Google Maps search for "${keyword}" in "${location}"`);
  return new Promise((resolve, reject) => {
    chrome.tabs.create(
      {
        url: `https://www.google.com/maps/search/${encodeURIComponent(
          keyword + " in " + location
        )}`,
        active: false,
      },
      async (tab) => {
        if (!tab.id) {
          reject(new Error("Failed to create tab"));
          return;
        }

        // Wait for the feed to be loaded
        await waitForElement(tab.id, 'div[role="feed"]');

        try {
          const results = await scrapeAllResults(tab.id);
          console.log(
            `Scraping completed. Found ${results.length} total results`
          );
          chrome.tabs.remove(tab.id);
          resolve(results);
        } catch (error) {
          console.error("Error during scraping:", error);
          chrome.tabs.remove(tab.id);
          reject(error);
        }
      }
    );
  });
}

async function waitForElement(tabId: number, selector: string): Promise<void> {
  return new Promise((resolve) => {
    const checkElement = async () => {
      const [exists] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (selector) => !!document.querySelector(selector),
        args: [selector],
      });

      if (exists.result) {
        resolve();
      } else {
        setTimeout(checkElement, 500);
      }
    };

    checkElement();
  });
}

async function scrapeAllResults(tabId: number): Promise<GMapResult[]> {
  const resultsMap = new Map<string, GMapResult>();
  let previousHeight = 0;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  console.log("Starting to scrape results...");

  while (attempts < MAX_ATTEMPTS) {
    // Scrape current view
    const newResults = await chrome.scripting.executeScript({
      target: { tabId },
      func: scrapeResults,
    });

    const currentResults = newResults[0].result as GMapResult[];
    console.log(`Found ${currentResults.length} new results`);
    currentResults.forEach((result) => {
      const key = createResultKey(result);
      if (!resultsMap.has(key)) {
        resultsMap.set(key, result);
      }
    });
    console.log("Current total unique results:", resultsMap.size);

    // Check scroll position
    const scrollInfo = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const feed = document.querySelector('div[role="feed"]');
        return feed ? feed.scrollHeight : 0;
      },
    });

    const currentHeight = scrollInfo[0].result as number;

    if (currentHeight === previousHeight) {
      attempts++;
      console.log(
        `No new results found. Attempt ${attempts} of ${MAX_ATTEMPTS}`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    attempts = 0;
    previousHeight = currentHeight;

    // Scroll
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const feed = document.querySelector('div[role="feed"]');
        if (feed) {
          feed.scrollTo(0, feed.scrollHeight);
        }
      },
    });

    // Wait for new content
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if we reached the end
    const endCheck = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => !!document.querySelector(".HlvSq"),
    });

    if (endCheck[0].result) {
      console.log("Reached end of results list");
      break;
    }
  }

  const finalResults = Array.from(resultsMap.values());
  console.log("Final unique results:", finalResults);
  return finalResults;
}

function scrapeResults(): GMapResult[] {
  const results: GMapResult[] = [];
  const items = document.querySelectorAll("div.Nv2PK");

  items.forEach((item) => {
    try {
      const nameElement = item.querySelector("div.qBF1Pd");
      // Get the last span in W4Efsd that contains the address
      const addressElement = item.querySelector(
        "div.W4Efsd > span:nth-child(3) > span:last-child"
      );
      const phoneElement = item.querySelector("span.UsdlK");
      const websiteUrl = item
        .querySelector("a.lcr4fd[data-value='Website']")
        ?.getAttribute("href")
        ?.split(/[&?](?:adurl|url)=/i)
        .pop()
        ?.split(/[&?]/)[0];

      if (nameElement) {
        const result: GMapResult = {
          name: nameElement.textContent?.trim() || "",
          address: addressElement?.textContent?.trim() || "",
          phone: phoneElement?.textContent?.trim(),
          website:
            websiteUrl &&
            !websiteUrl.includes("googleadservices.com") &&
            !websiteUrl.includes("chrome-extension://")
              ? decodeURIComponent(websiteUrl)
              : undefined,
        };

        console.log("Scraped item:", {
          name: result.name,
          address: result.address,
          website: result.website,
        });

        results.push(result);
      }
    } catch (error) {
      console.error("Error extracting item:", error);
    }
  });

  return results;
}

// Helper function to clean phone numbers
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Helper function to validate website URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
