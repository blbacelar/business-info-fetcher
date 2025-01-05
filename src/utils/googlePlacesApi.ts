import { SearchParams, BusinessResult } from "../types";
import { findSocialMediaLinks } from "./scraper";
import { scrapeEmailsFromUrl } from "../background";

export async function searchGooglePlaces(
  params: SearchParams,
  nextPageToken?: string
): Promise<{
  results: BusinessResult[];
  nextPageToken?: string;
}> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key is not configured");
    }

    // First get all places from API
    const placesFromApi = await fetchPlacesFromApi(params, apiKey);
    console.log("Places fetched from API:", placesFromApi);

    // Then process and scrape data
    const processedResults = await Promise.all(
      placesFromApi.map(async (place) => {
        try {
          const website = place.website;
          console.log(`Processing website: ${website} for ${place.name}`);

          const socialLinks = website
            ? await findSocialMediaLinks(website)
            : {};

          const result: BusinessResult = {
            name: place.name,
            address: place.address,
            phone: place.phone,
            website,
            ...socialLinks,
          };

          if (website) {
            const emails = await scrapeEmailsFromUrl(website);
            if (emails.length > 0) {
              result.email = emails[0];
            }
          }

          return result;
        } catch (e) {
          console.error(`Failed to process place:`, e);
          return null;
        }
      })
    );

    const results = processedResults.filter(
      (result): result is BusinessResult => result !== null
    );

    return {
      results,
      nextPageToken,
    };
  } catch (error) {
    console.error("Failed to search businesses:", error);
    return { results: [] };
  }
}

// Separate function to fetch places from API
async function fetchPlacesFromApi(params: SearchParams, apiKey: string) {
  const searchAreas = [
    `north ${params.location}`,
    `south ${params.location}`,
    `east ${params.location}`,
    `west ${params.location}`,
    `central ${params.location}`,
    params.location,
  ];

  let placesMap = new Map();

  // Search in each area
  for (const area of searchAreas) {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      params.keyword
    )}+in+${encodeURIComponent(area)}&key=${apiKey}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status === "OK") {
      for (const place of searchData.results) {
        if (!placesMap.has(place.place_id)) {
          // Get additional details for each place
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website&key=${apiKey}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();

          placesMap.set(place.place_id, {
            name: detailsData.result.name || place.name,
            address:
              detailsData.result.formatted_address || place.formatted_address,
            phone: detailsData.result.formatted_phone_number,
            website: detailsData.result.website,
          });
        }
      }
    }
  }

  return Array.from(placesMap.values()).slice(0, 100);
}
