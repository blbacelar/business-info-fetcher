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

    // Use coordinates and radius if available, otherwise use location-based search
    const searchUrl =
      params.latitude && params.longitude && params.radius
        ? `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${
            params.latitude
          },${params.longitude}&radius=${
            params.radius
          }&keyword=${encodeURIComponent(params.keyword)}&key=${apiKey}`
        : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
            params.keyword
          )}${
            params.location ? `+in+${encodeURIComponent(params.location)}` : ""
          }&key=${apiKey}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status === "OK") {
      // Get additional details for each place
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

      return {
        results: detailedResults,
        nextPageToken: searchData.next_page_token,
      };
    }

    return { results: [] };
  } catch (error) {
    console.error("Failed to search businesses:", error);
    return { results: [] };
  }
}

// Separate function to fetch places from API
async function fetchPlacesFromApi(params: SearchParams, apiKey: string) {
  if (!params.location) {
    return [];
  }

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
