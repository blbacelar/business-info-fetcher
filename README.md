# Business Info Fetcher Chrome Extension

A Chrome extension that helps users find business information including contact details and social media profiles based on business type and location using the Google Places API.

## Features

- 🔍 Search businesses by:
  - Business type/keyword (e.g., "restaurants", "plumbers")
  - Location (e.g., "New York", "London")
- 📋 View comprehensive business information:
  - Business name
  - Physical address
  - Phone number
  - Website URL
  - Email address (scraped from business website)
  - Social media links (Facebook, Twitter, Instagram)
- 📊 Interactive table features:
  - Sort by any column
  - Click-to-copy functionality
  - Open links in new tabs
- 📥 Export results to CSV
- 💾 Auto-save last search and results
- 🎨 Modern UI with Tailwind CSS

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Build the extension:

```bash
npm run build
```

4. Load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Development Setup

### Prerequisites

- Node.js
- npm
- Chrome browser

### API Key Setup

1. Get a Google Places API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Places API in your Google Cloud project
3. Replace the API key in `src/background.ts`:

```typescript
const apiKey = "YOUR_API_KEY";
```

### Project Structure

```
business-info-extension/
├── src/
│   ├── components/          # React components
│   │   ├── Table.tsx       # Main table component
│   │   ├── TableHeader.tsx # Table header with sorting
│   │   └── TableRow.tsx    # Table row component
│   ├── types/              # TypeScript interfaces
│   ├── utils/              # Utility functions
│   ├── background.ts       # Extension background script
│   ├── popup.tsx          # Main popup component
│   └── popup.html         # Popup HTML template
├── dist/                  # Built files
└── package.json          # Dependencies and scripts
```

### Tech Stack

- React 19.0.0
- TypeScript 5.7.2
- Tailwind CSS 3.4.17
- Google Places API
- Chrome Extension APIs
- Lucide Icons

### Building and Testing

1. Make changes to the source code
2. Run the build:

```bash
npm run build
```

3. Reload the extension in Chrome
4. Test the changes

## Usage

1. Click the extension icon
2. Enter a business type in the first input
3. Enter a location in the second input
4. Click "Search"
5. View results in the table
6. Optional:
   - Sort by clicking column headers
   - Export results using "Export to CSV"
   - Click links to open in new tabs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License

## Acknowledgments

- [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## API Limits

### Google Places API Quotas

- **Basic (Free) Tier**:
  - 1,000 requests per day
  - 100 requests per second
- **Places Text Search**:
  - $17 USD per 1,000 requests
  - Maximum of 60 results per query

### Results Limitations

- Text Search returns maximum 20 results per page
- Maximum of 3 pages (60 total results)
- Place Details has separate quotas

### Error Handling

The extension handles API limits by:

- Limiting results to first 20 businesses per search
- Showing clear error messages for quota exceeded
- Logging API errors for debugging
- Gracefully handling rate limiting

### Cost Considerations

- Monitor your API usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges
- Consider implementing caching for frequent searches
