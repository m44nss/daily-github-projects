# CoverKeeper — Warranty Tracker

CoverKeeper is a local-first purchase warranty tracker. Record what you bought, when you bought it, the warranty duration and optional price/notes. It calculates expiry dates, highlights warranties expiring within 30 days, and lets you export or import a JSON backup.

## Features

- Add, edit and remove purchases.
- Calculate warranty expiry from purchase date + duration in months.
- Dashboard counts for covered, expiring soon and expired items.
- Search by product, category, store or notes.
- Filter by active, expiring soon or expired.
- Demo data for four example purchases.
- Export and import a JSON backup.
- Responsive layout; no framework, account, server or external API.
- Data stays in this browser's `localStorage`.

## Project files

```text
coverkeeper/
├── index.html   # Complete responsive interface and styles
├── app.js       # Warranty calculations, storage, filters and backup
└── README.md    # Setup, tests and Git instructions
```

## Run on Windows

1. Download and extract `coverkeeper.zip`.
2. Open the `coverkeeper` folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Add a purchase, or click **Load demo items** to explore sample records.
5. Try editing a record, searching, filtering and exporting a backup.

This project has no module imports or build step. Live Server is still recommended for a consistent local development workflow.

## Demo records

Click **Load demo items** to insert four sample purchases. Dates are generated relative to the current day so the examples continue to demonstrate active, expiring-soon and expired states whenever you open the project.

Sample categories: Computers, Electronics, Appliances and Home & furniture.

## Quick test checklist

1. Add a product purchased today with a 12-month warranty. Its expiry should be 12 months from today.
2. Add a product with a purchase date one year ago and a 12-month warranty. It should show as expired.
3. Search for a store name and confirm the list filters.
4. Select **Expiring soon** and check the sample phone.
5. Edit a purchase and save the changes.
6. Export a JSON backup.
7. Import that backup and confirm the records appear.
8. Refresh the page. Saved records should remain.
9. Remove a sample item and confirm it disappears.

## Warranty date rule

Expiry is calculated by adding the warranty month count to the purchase date. Month-end dates are clamped to the last valid day of the target month (for example, 31 January + 1 month becomes 28/29 February). The expiry date itself is treated as the final covered day. Your seller/manufacturer terms may define coverage differently, so use the date printed on your invoice when it differs.

## Privacy and limitations

Records are saved only in this browser on this device. Clearing site data can erase them; export backups regularly. Importing adds records rather than replacing the current vault. The app does not upload receipts, send notifications, or verify warranty claims with manufacturers. Do not store sensitive personal information in the notes field.

## Exactly 3 meaningful Git commit groups

```bash
git init

git add index.html
git commit -m "feat: build responsive CoverKeeper warranty dashboard"

git add app.js
git commit -m "feat: add warranty calculations and local inventory management"

git add README.md
git commit -m "docs: add CoverKeeper setup, demo and backup guide"

git branch -M main
git remote add origin https://github.com/m44nss/coverkeeper.git
git push -u origin main
```

If `origin` already exists:

```bash
git remote set-url origin https://github.com/m44nss/coverkeeper.git
git push -u origin main
```

Three meaningful commits are useful practice, but they do not guarantee three GitHub contribution squares.
