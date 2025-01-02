console.log("Background script loaded");

interface BusinessInfo {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);
  if (request.action === "search") {
    searchBusinesses(request.keyword, request.location)
      .then(async (results) => {
        console.log("Search results:", results); // Debug log
        const enrichedResults = await Promise.all(
          results.map(enrichBusinessData)
        );
        console.log("Enriched results:", enrichedResults); // Debug log
        sendResponse(enrichedResults);
      })
      .catch((error) => {
        console.error("Search error:", error); // Debug log
        sendResponse({ error: error.message });
      });
    return true;
  }
});

const processFacebookUrl = (
  website: string
): { website: string; facebook: string } => {
  const facebookPatterns = [
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9.]+\/?/i,
    /(?:https?:\/\/)?(?:www\.)?fb\.com\/[a-zA-Z0-9.]+\/?/i,
  ];

  for (const pattern of facebookPatterns) {
    if (pattern.test(website)) {
      return {
        website: "",
        facebook: website.startsWith("http") ? website : `https://${website}`,
      };
    }
  }

  return {
    website,
    facebook: "",
  };
};

async function searchBusinesses(
  keyword: string,
  location: string
): Promise<BusinessInfo[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps API key is not configured");
  }

  const searchAreas = [
    `north ${location}`,
    `south ${location}`,
    `east ${location}`,
    `west ${location}`,
    `central ${location}`,
    location,
  ];

  try {
    let allResults = new Map(); // Use Map to store unique results by place_id

    // Search in each area
    for (const area of searchAreas) {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        keyword
      )}+in+${encodeURIComponent(area)}&key=${apiKey}`;

      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.status === "OK") {
        // Add results to Map using place_id as key to ensure uniqueness
        searchData.results.forEach((place: any) => {
          if (!allResults.has(place.place_id)) {
            allResults.set(place.place_id, place);
          }
        });
      }
    }

    // Convert Map values back to array and limit results
    const uniqueResults = Array.from(allResults.values()).slice(0, 100);

    const detailedResults = await Promise.all(
      uniqueResults.map(async (place: any) => {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website&key=${apiKey}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        const website = detailsData.result.website;
        return {
          name: detailsData.result.name || place.name,
          address:
            detailsData.result.formatted_address || place.formatted_address,
          phone: detailsData.result.formatted_phone_number,
          website: website,
        };
      })
    );

    return detailedResults;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}

async function enrichBusinessData(
  business: BusinessInfo
): Promise<BusinessInfo> {
  console.log(
    "Enriching business:",
    business.name,
    "Website:",
    business.website
  );

  if (business.website) {
    if (business.website.includes("facebook.com")) {
      console.log("Found Facebook URL:", business.website);
      return { ...business, facebook: business.website, website: undefined };
    }
    // ... similar for Instagram and Twitter
  }

  return business;
}

async function scrapeEmailsFromUrl(url: string): Promise<string[]> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Enhanced email regex to avoid false positives
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return html.match(emailRegex) || [];
  } catch (error) {
    console.error(`Failed to scrape emails from ${url}:`, error);
    return [];
  }
}

async function findContactPage(baseUrl: string): Promise<string | null> {
  try {
    const response = await fetch(baseUrl);
    const html = await response.text();

    // Common contact page patterns
    const contactPatterns = [
      /href="([^"]*contact[^"]*)">/i,
      /href="([^"]*about[^"]*)">/i,
      /href="([^"]*get-in-touch[^"]*)">/i,
    ];

    for (const pattern of contactPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const contactUrl = new URL(match[1], baseUrl).href;
        return contactUrl;
      }
    }

    return null;
  } catch (error) {
    console.error(`Failed to find contact page on ${baseUrl}:`, error);
    return null;
  }
}

async function findSocialMediaLinks(url: string): Promise<{
  facebook?: string;
  twitter?: string;
  instagram?: string;
}> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    const socialPatterns = {
      facebook: /href="(https?:\/\/(?:www\.)?facebook\.com\/[^"]+)"/i,
      twitter: /href="(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"]+)"/i,
      instagram: /href="(https?:\/\/(?:www\.)?instagram\.com\/[^"]+)"/i,
    };

    const socialUrls: {
      [key: string]: string | undefined;
    } = {
      facebook: undefined,
      twitter: undefined,
      instagram: undefined,
    };

    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      const match = html.match(pattern);
      if (match && match[1]) {
        socialUrls[platform] = match[1];
      }
    }

    return socialUrls as {
      facebook?: string;
      twitter?: string;
      instagram?: string;
    };
  } catch (error) {
    console.error(`Failed to find social media links on ${url}:`, error);
    return {};
  }
}

function isValidEmail(email: string): boolean {
  // Basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return (
    emailRegex.test(email) &&
    !email.includes("example.com") &&
    !email.includes("domain.com")
  );
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: "popup.html",
  });
});
