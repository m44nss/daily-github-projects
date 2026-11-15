# UTM Studio — Campaign Link Builder

UTM Studio creates consistent campaign-tracking URLs. Enter the destination and campaign details, preview the tagged URL, save it in your browser, copy it, and export the library to CSV.

## Features
- Adds `utm_source`, `utm_medium`, `utm_campaign`, `utm_term` and `utm_content`.
- Requires a valid HTTP(S) destination, source, medium and campaign.
- Preserves existing query parameters and URL fragments.
- Live preview, clipboard copy and saved-link library.
- Browser localStorage persistence and CSV export with escaped quotes.
- Three sample campaign presets.
- Responsive layout; no framework, backend or account.

## Files
- `index.html` — page structure
- `styles.css` — responsive interface
- `utm-core.js` — URL validation, UTM generation and CSV/date helpers
- `app.js` — preview, saving, copying, deleting and export
- `demo-data.js` — sample campaign presetr
- `README.md` — setup and test guide

## Run on Windows
1. Extract the ZIP.
2. Open the `utm-studio` folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Click an example button or enter your details.
5. Copy the preview URL or save it to the library.
6. Use **Export CSV** to download saved campaigns.

Use Live Server because the project uses JavaScript ES modules. Do not open the HTML directly with file://.

## Demo campaigns
| Example | Source | Medium | Campaign |
|---|---|---|---|
| Instagram product launch | instagram | social | spring_product_launch |
| Monthly newsletter | newsletter | email | monthly_digest |
| Google search ad | google | cpc | brand_search |

The newsletter example includes an existing `?ref=homepage` query parameter. UTM Studio should keep it.

## Quick test checklist
1. Load the newsletter example and confirm `ref=homepage` remains.
2. Change source to `weekly_email` and watch the preview update.
3. Save, refresh, and confirm the campaign remains in the library.
4. Copy a saved URL and export the CSV.
5. Delete one record, then test Clear library.
6. Try a url without `https://`; validation should explain the issue.
7. Leave source, medium or campaign blank; saving should be blocked.
8. Add an existing `utm_source` parameter; the builder should replace it rather than duplicate it.

## UTM naming tips
Use lowercase, consistent source and medium names. Prefer readable campaign identifiers such as `spring_launch_2026`. UTM values can be case-sensitive in analytics reports. Never put secrets in URLs; they can appear in browser history, server logs and analytics systems.

## Privacy and limitations
Saved campaigns stay in this browser's localStorage. They are not synced between devices and may disappear if browser data is cleared. This tool does not send campaign data to a server.

## Exactly 3 meaningful Git commit groups
For a standalone repository named `utm-studio`:

```bash
git init

main Group 1: git add index.html styles.css
git commit -m "feat: build responsive UTM Studio interface"

main Group 2: git add utm-core.js
git commit -m "feat: add campaign URL and CSV helpers"

GROUP 3: git add app.js demo-data.js README.md
git commit -m "feat: connect campaign library and add examples"

git branch -M main
git remote add origin https://github.com/m44nss/utm-studio.git
git push -u origin main
```

If `origin` already exists:

```bash
git remote set-url origin https://github.com/m44nss/utm-studio.git
git push -u origin main
```

Three commits are useful practice, but do not guarantee three contribution squares on GitHub.