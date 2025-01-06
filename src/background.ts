import { scrapeGoogleMaps } from "./utils/scrapGmap";
import { findSocialMediaLinks } from "./utils/scraper";
import { searchGooglePlaces } from "./utils/googlePlacesApi";

interface SearchParams {
  keyword: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

interface BusinessInfo {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  whatsapp?: string;
}

interface Config {
  dataSource: "maps" | "places";
}

// Default configuration
let config: Config = {
  dataSource: "maps",
};

// Load configuration
chrome.storage.local.get(["config"], (result) => {
  if (result.config) {
    config = result.config;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateConfig") {
    config = { ...config, ...request.config };
    chrome.storage.local.set({ config });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "search") {
    searchBusinesses({
      keyword: request.keyword,
      location: request.location,
    })
      .then(async (results) => {
        const enrichedResults = await Promise.all(
          results.map(enrichBusinessData)
        );
        sendResponse(enrichedResults);
      })
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    return true;
  }
});

async function searchBusinesses(params: SearchParams): Promise<BusinessInfo[]> {
  try {
    let results;
    if (params.latitude && params.longitude && params.radius) {
      // Search using coordinates and radius
      results = await searchGooglePlacesByCoordinates(
        params.keyword,
        params.latitude,
        params.longitude,
        params.radius
      );
    } else {
      // Fallback to the existing location-based search
      results =
        config.dataSource === "maps"
          ? await scrapeGoogleMaps(params.keyword, params.location || "")
          : (
              await searchGooglePlaces({
                keyword: params.keyword,
                location: params.location || "",
              })
            ).results;
    }

    // Enrich with website data
    const enrichedResults = await Promise.all(
      results.map(async (place: BusinessInfo) => {
        const website = place.website;
        const socialLinks = website ? await findSocialMediaLinks(website) : {};
        const emails = website ? await scrapeEmailsFromUrl(website) : [];

        return {
          name: place.name,
          address: place.address,
          phone: place.phone,
          website,
          email: emails[0],
          ...socialLinks,
        };
      })
    );

    return enrichedResults;
  } catch (error) {
    console.error("Failed to search businesses:", error);
    throw error;
  }
}

async function searchGooglePlacesByCoordinates(
  keyword: string,
  latitude: number,
  longitude: number,
  radius: number
): Promise<BusinessInfo[]> {
  try {
    // Implement a fallback search method
    // This could be a different API or a more generic search
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      keyword
    )}&format=json&limit=10`;

    const response = await fetch(url);
    const data = await response.json();

    return data.map((place: any) => ({
      name: place.display_name,
      address: place.display_name,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
    }));
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
}

async function enrichBusinessData(
  business: BusinessInfo
): Promise<BusinessInfo> {
  if (business.website) {
    if (
      business.website.includes("facebook.com") ||
      business.website.includes("fb.com")
    ) {
      return { ...business, facebook: business.website, website: undefined };
    }
    if (
      business.website.includes("instagram.com") ||
      business.website.includes("@instagram.com")
    ) {
      const instagramUrl = business.website.startsWith("@")
        ? `https://www.instagram.com/${business.website.slice(1)}`
        : business.website;
      return { ...business, instagram: instagramUrl, website: undefined };
    }
    if (
      business.website.includes("twitter.com") ||
      business.website.includes("x.com") ||
      business.website.includes("@twitter.com")
    ) {
      const twitterUrl = business.website.startsWith("@")
        ? `https://twitter.com/${business.website.slice(1)}`
        : business.website;
      return { ...business, twitter: twitterUrl, website: undefined };
    }
    if (
      business.website.includes("wa.me") ||
      business.website.includes("whatsapp.com") ||
      business.website.includes("api.whatsapp.com")
    ) {
      return { ...business, whatsapp: business.website, website: undefined };
    }
  }

  return business;
}

export async function scrapeEmailsFromUrl(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      mode: "no-cors",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const html = await response.text();

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return html.match(emailRegex) || [];
  } catch (error) {
    console.error(`Failed to scrape emails from ${url}:`, error);
    return [];
  }
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("popup.html"),
  });
});
