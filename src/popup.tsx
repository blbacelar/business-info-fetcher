console.log("Popup script loaded");

import * as React from "react";
import { useState, useEffect } from "react";
import * as ReactDOM from "react-dom/client";
import "./styles/globals.css";
import { Table } from "./components/Table";
import { BusinessResult } from "./types";

const Popup: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState<BusinessResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataSource, setDataSource] = useState<"maps" | "places">("maps");

  useEffect(() => {
    chrome.storage.local.get(["keyword", "location", "results"], (data) => {
      if (data.keyword) setKeyword(data.keyword);
      if (data.location) setLocation(data.location);
      if (data.results) setResults(data.results);
    });
  }, []);

  useEffect(() => {
    // Load initial config
    chrome.storage.local.get(["config"], (result) => {
      if (result.config?.dataSource) {
        setDataSource(result.config.dataSource);
      }
    });
  }, []);

  const handleDataSourceChange = (value: "maps" | "places") => {
    setDataSource(value);
    chrome.runtime.sendMessage({
      action: "updateConfig",
      config: { dataSource: value },
    });
  };

  const handleSearch = () => {
    if (!keyword || !location) {
      setError("Please enter both keyword and location");
      return;
    }

    // Clear all states before new search
    setResults([]);
    setError(null);
    setCurrentPage(1); // Reset pagination

    setIsLoading(true);

    // Save search params to storage
    chrome.storage.local.set({ keyword, location });

    chrome.runtime.sendMessage(
      { action: "search", keyword, location },
      (response) => {
        setIsLoading(false);
        if (response.error) {
          setError(response.error);
        } else {
          setResults(response);
          chrome.storage.local.set({ results: response });
        }
      }
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "keyword" | "location"
  ) => {
    const value = e.target.value;
    if (field === "keyword") {
      setKeyword(value);
    } else {
      setLocation(value);
    }

    if (!value && field === "keyword") {
      setResults([]);
      chrome.storage.local.remove(["keyword", "location", "results"]);
    }
  };

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string
  ) => {
    e.preventDefault();
    chrome.tabs.create({ url });
  };

  const handleClearCache = () => {
    // Clear state
    setKeyword("");
    setLocation("");
    setResults([]);
    setError(null);

    // Clear chrome storage
    chrome.storage.local.clear(() => {
      console.log("Cache cleared");
    });
  };

  return (
    <div className="w-screen h-screen p-4 bg-white overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Business Info Fetcher</h1>
      </div>

      <div className="flex flex-col gap-4 mb-4 max-w-2xl">
        <div className="flex gap-4">
          <div className="flex-1">
            <label
              htmlFor="keyword"
              className="text-sm font-medium mb-1.5 block text-gray-600"
            >
              Business Type
            </label>
            <input
              id="keyword"
              type="text"
              value={keyword}
              onChange={(e) => handleInputChange(e, "keyword")}
              placeholder="Enter business type or keyword"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="location"
              className="text-sm font-medium mb-1.5 block text-gray-600"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => handleInputChange(e, "location")}
              placeholder="Enter city or location"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />
          </div>
          <div className="flex gap-2 self-end">
            <button
              onClick={handleClearCache}
              className="px-4 py-2 text-sm rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleSearch}
              disabled={isLoading || !keyword || !location}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Data Source
          </label>
          <select
            value={dataSource}
            onChange={(e) =>
              handleDataSourceChange(e.target.value as "maps" | "places")
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="maps">Google Maps (Scraping)</option>
            <option value="places">Google Places API</option>
          </select>
        </div>

        {error && <div className="text-red-500">{error}</div>}
      </div>

      <Table results={results} handleLinkClick={handleLinkClick} />
    </div>
  );
};

try {
  const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
  );
  root.render(<Popup />);
} catch (error) {
  console.error("Error rendering popup:", error);
}
