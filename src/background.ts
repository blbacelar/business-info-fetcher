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

async function searchBusinesses(
  keyword: string,
  location: string
): Promise<BusinessInfo[]> {
  const apiKey = "AIzaSyCK4XcoqrLmsZUAtvztrJzDFNKgNqApHWA";

  // Include location in the search query
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    keyword
  )}+in+${encodeURIComponent(location)}&key=${apiKey}`;

  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();

  // Then get detailed information for each place
  const detailedResults = await Promise.all(
    searchData.results.map(async (place: any) => {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website&key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      return {
        name: detailsData.result.name || place.name,
        address:
          detailsData.result.formatted_address || place.formatted_address,
        phone: detailsData.result.formatted_phone_number,
        website: detailsData.result.website,
      };
    })
  );

  console.log("Detailed results:", detailedResults); // Debug log
  return detailedResults;
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
