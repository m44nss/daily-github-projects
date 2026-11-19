# ReturnRadar — Purchase Return Window Tracker

A local-first app for tracking purchases, calculating return-by dates and spotting deadlines before they pass.

## Features
- Add, edit, delete and mark purchases as returned.
- Calculate return-by dates from purchase date + return-window days.
- Dashboard counts, due-soon/overdue filters, search and sorting.
- Export a JSON backup or CSV spreadsheet.
- Five demo purchases with dates relative to today.
- Responsive layout; no framework, account, API or build step.

## Files
```text
returnradar/
├── index.html     # App structure
├── styles.css     # Responsive styling
├── app.js         # Date math, forms, filters, storage and exports
├── demo-data.js   # Five starter purchases
└── README.md      # This guide
```

## Run on Windows
1. Extract `returnradar.zip`.
2. Open the folder in VS Code.
3. Right-click `index.html` → **Open with Live Server**.
4. Try the desk lamp (about 4 days left) and USB-C hub (overdue).

No npm install is required. Live Server is recommended because the app uses JavaScript modules.

## Deadline rule
`Return by = purchase date + return-window days`. Retailer rules vary: some count from delivery or use a fixed date. Confirm the receipt or store policy and enter the appropriate window. “Due soon” means 0–5 days remaining. This app is a personal tracker, not a retailer policy checker.

## Quick tests
1. Search for `SoundHouse`; only the headphones should show.
2. Select **Due soon**; the desk lamp should appear.
3. Edit the lamp's window to 45 days; its deadline should update.
4. Mark the headphones returned and open the Returned filter.
5. Export JSON and CSV, then refresh; data should persist in this browser.

Purchases are stored in `localStorage` on this device. Export a backup before clearing browser data or changing devices. Price labels use USD by default.

## Exactly 3 Git commit groups
Run from the extracted project folder:
```bash
git init
git add index.html styles.css
git commit -m "feat: build responsive ReturnRadar purchase dashboard"
git add app.js
git commit -m "feat: add return deadline tracking and purchase management"
git add demo-data.js README.md
git commit -m "docs: add demo purchases and ReturnRadar setup guide"
git branch -M main
git remote add origin https://github.com/m44nss/returnradar.git
git push -u origin main
```
If `origin` already exists:
```bash
git remote set-url origin https://github.com/m44nss/returnradar.git
git push -u origin main
```
Three commits are good practice but do not guarantee three GitHub contribution squares.
