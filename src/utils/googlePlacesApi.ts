import { SearchParams, BusinessResult } from "../types";
import { findSocialMediaLinks } from "./scraper";
import { scrapeEmailsFromUrl } from "../background";

export async function searchGooglePlaces(params: SearchParams) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    params.keyword
  )}&format=json&limit=10`;

  const response = await fetch(url);
  const data = await response.json();

  return {
    results: data.map((place: any) => ({
      name: place.display_name,
      address: place.display_name,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
    })),
  };
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
