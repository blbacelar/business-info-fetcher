import { Semaphore } from "./utils/concurrency";

console.log("Background script loaded");

// Initialize semaphore with concurrency limit of 3
const scrapeSemaphore = new Semaphore(3);

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

interface PlaceResult {
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);
  if (request.action === "search") {
    handleSearch(request.keyword, request.location, request.pageToken, sendResponse);
    return true; // Keep message channel open for async response
  }
});

async function handleSearch(
  keyword: string,
  location: string,
  pageToken: string | undefined, // Add pageToken param
  sendResponse: (response: any) => void
) {
  try {
    const { results, nextPageToken } = await searchBusinesses(keyword, location, pageToken); // Pass token
    console.log("Search results:", results);

    // Process enrichment with concurrency limit
    const enrichedResults = await Promise.all(
      results.map((business) =>
        scrapeSemaphore.run(() => enrichBusinessData(business))
      )
    );

    console.log("Enriched results:", enrichedResults);
    sendResponse({ results: enrichedResults, nextPageToken }); // Return both
  } catch (error: any) {
    console.error("Search error:", error);
    sendResponse({ error: error.message });
  }
}

async function searchBusinesses(
  keyword: string,
  location: string,
  pageToken?: string // Add pageToken param
): Promise<{ results: BusinessInfo[]; nextPageToken?: string }> { // Update return type
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const searchUrl = "https://places.googleapis.com/v1/places:searchText";

  const requestBody: any = {
    textQuery: `${keyword} in ${location}`,
  };

  // Add pageToken if it exists
  if (pageToken) {
    requestBody.pageToken = pageToken;
  }

  const response = await fetch(searchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey || "",
      "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.id,nextPageToken", // Add nextPageToken to mask
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Google API Error Body:", errorBody);
    throw new Error(`Places API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const places = (data.places as PlaceResult[]) || [];

  const results = places.map((place) => ({
    name: place.displayName?.text || "",
    address: place.formattedAddress || "",
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
  }));

  return { results, nextPageToken: data.nextPageToken };
}

async function enrichBusinessData(
  business: BusinessInfo
): Promise<BusinessInfo> {
  const emails: string[] = [];
  let socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  } = {
    facebook: undefined,
    twitter: undefined,
    instagram: undefined,
  };

  if (business.website) {
    try {
      console.log(`Scraping ${business.website}...`);
      // Get emails from main page
      const mainEmails = await scrapeEmailsFromUrl(business.website);
      emails.push(...mainEmails);

      // Try to find and scrape contact page
      const contactPageUrl = await findContactPage(business.website);
      if (contactPageUrl) {
        const contactEmails = await scrapeEmailsFromUrl(contactPageUrl);
        emails.push(...contactEmails);
      }

      // Find social media links
      socialLinks = await findSocialMediaLinks(business.website);
    } catch (error) {
      console.error(
        `Failed to fetch website data for ${business.name}:`,
        error
      );
    }
  }

  const uniqueEmails = [...new Set(emails)].filter(
    (email) => email && isValidEmail(email)
  );

  return {
    ...business,
    email: uniqueEmails[0] || undefined,
    ...socialLinks,
  };
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
        // Handle relative URLs
        try {
          return new URL(match[1], baseUrl).href;
        } catch {
          return null;
        }
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
