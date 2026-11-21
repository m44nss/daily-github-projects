# SitemapScope — XML Sitemap Inspector

SitemapScope is a browser-only technical SEO utility. Upload an XML sitemap to review its locations, flag common sitemap hygiene issues, filter and sort entries, copy individual URLs, and export the current view as CSV.

## Features

- Reads standard XML `urlset` sitemaps and `sitemapindex` files.
- Detects repeated locations, query strings, HTTP URLs, malformed/non-HTTP locations, missing or invalid `lastmod` values, and dates older than one year.
- Search, issue filters, and URL/date/issue sorting.
- Copy a URL or export the visible results to CSV.
- Includes a built-in demo dataset; no extra files or network request are needed.
- Keeps uploaded files in the browser; no server or API key is used.

## Run on Windows

1. Extract the project folder.
2. Open the folder in VS Code.
3. Install/enable the **Live Server** extension if needed.
4. Right-click `index.html` and choose **Open with Live Server**.
5. Click **Explore demo data** or upload your own `.xml` file (up to 5 MB).

No npm install or build step is required.

## Project structure

```text
2026-11-21-sitemapscope/
├── index.html   # Page structure and responsive CSS
├── app.js       # XML parsing, issue checks, filters, CSV export and demo data
└── README.md    # Setup, feature notes and test plan
```

## What the checks mean

| Flag | Meaning |
| --- | --- |
| Duplicate | The same normalized location appears more than once in this file. |
| Query string | The URL contains query parameters. |
| HTTP | The location uses `http://` instead of `https://`. |
| Invalid URL | The location is empty, malformed, or does not use HTTP(S). |
| Missing lastmod | No `lastmod` element is present, or its date cannot be parsed. |
| Old lastmod | The parsed `lastmod` date is more than 365 days old. |

The duplicate check is an exact normalized-location check; it does not infer canonical equivalence between different paths. `lastmod` is a hint supplied by the sitemap, not proof that a page changed.

## Important limitations

SitemapScope only parses the XML you upload. It does **not** request destination pages, check HTTP status codes, inspect robots.txt/canonical tags, or recursively download child sitemaps listed by a sitemap index. These tasks require network crawling and are intentionally not performed by this browser-only project. A sitemap index is displayed as a list of child sitemap locations.

## Suggested manual tests

1. Click **Explore demo data**. The demo should show 8 locations.
2. Choose **Duplicates**. The two `/about/` entries should appear.
3. Choose **Query strings**. The `/products/?ref=main-nav` row should appear.
4. Choose **HTTP links**. The `/legacy-page/` row should appear.
5. Choose **Invalid URLs**. The malformed `ht!tp://broken-location` row should appear.
6. Search for `contact` and verify the result narrows to one row.
7. Export CSV, open it in a spreadsheet, and confirm the visible filtered rows are present.
8. Upload malformed XML and confirm an error message appears without crashing the app.

## Demo XML dataset

The following small sample is also embedded in `app.js` for the **Explore demo data** button. Save it as `sample.xml` if you want to test the upload control instead.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc><lastmod>2026-11-10</lastmod></url>
  <url><loc>https://example.com/about/</loc><lastmod>2026-10-02</lastmod></url>
  <url><loc>https://example.com/products/?ref=main-nav</loc><lastmod>2026-11-18</lastmod></url>
  <url><loc>http://example.com/legacy-page/</loc><lastmod>2024-01-15</lastmod></url>
  <url><loc>https://example.com/blog/launch-notes/</loc></url>
  <url><loc>https://example.com/about/</loc><lastmod>2026-10-02</lastmod></url>
  <url><loc>ht!tp://broken-location</loc></url>
  <url><loc>https://example.com/contact/</loc><lastmod>2026-11-20</lastmod></url>
</urlset>
```

## Privacy

The XML file is read with the browser File API and parsed locally using `DOMParser`. No sitemap content is uploaded to a backend.

## License

MIT — use, modify, and learn from this project.
