# WarrantyWise — Product Warranty Tracker

WarrantyWise is a responsive, browser-based product register built with HTML, CSS and vanilla JavaScript. Save product details, calculate warranty end dates, and see which items are active, expiring soon or already expired.

## Features

- Add, edit and delete product warranty records.
- Store brand, category, purchase date, warranty length, price, currency, serial/model number and notes.
- Calculate warranty end dates automatically.
- Handle month-end dates safely (January 31 + one month becomes the last day of February).
- Show days remaining or days since expiry.
- Filter by active, expiring soon (0–30 days) and expired.
- Search by product, brand, category, serial number or notes.
- Show summary counts for all warranty statuses.
- Save records in browser localStorage.
- Import and export JSON backups.
- Includes three sample products with different warranty statuses.
- Responsive layout for desktop and mobile.

## Project structure

```text
warrantywise/
├── index.html   # Page structure and responsive styling
├── app.js       # Date calculations, storage, forms, search and filters
└── README.md    # Setup, features and test instructions
```

## Run on Windows with VS Code

1. Extract the ZIP file.
2. Open the warrantywise folder in VS Code.
3. Right-click index.html and choose **Open with Live Server**.
4. Click **Load sample data** to add three example products.

No build step, package installation, API key or backend is required.

## How expiry dates work

The expiry date is calculated by adding the warranty length in calendar months to the purchase date. Month-end dates are clamped to the last valid day of the target month. For example, January 31 plus one month becomes February 28 (or February 29 in a leap year).

- **Active:** more than 30 days remain.
- **Expiring soon:** 0–30 days remain.
- **Expired:** the expiry date is in the past.

The date comparison uses calendar days, not elapsed hours.

## Sample data

The built-in sample button adds these example records:

```json
[
  {"product":"Everyday Laptop","brand":"Lenovo","category":"Electronics","purchaseDate":"2025-12-10","durationMonths":24,"price":64999,"currency":"INR","serial":"LNV-82XK-2025"},
  {"product":"Smartphone","brand":"Samsung","category":"Electronics","purchaseDate":"2025-05-22","durationMonths":18,"price":32999,"currency":"INR","serial":"SM-A556E-DEMO"},
  {"product":"Air Purifier","brand":"Philips","category":"Appliances","purchaseDate":"2024-07-08","durationMonths":12,"price":11999,"currency":"INR","serial":"PH-AC1711-DEMO"}
]
```

## Data and privacy

All records stay in this browser's local storage. Nothing is sent to a server. Use **Export backup** before clearing browser data or moving to another device. Importing a backup replaces the current register after confirmation.

## Quick test checklist

1. Load the sample data.
2. Check the three products' status labels.
3. Add a product purchased on January 31 with a one-month warranty; verify the expiry date is clamped to the end of February.
4. Search for a brand or serial number.
5. Filter to **Expiring soon** and **Expired**.
6. Edit one product, then delete another.
7. Export a JSON backup and import it again.

## Three meaningful Git commits

For a standalone repository named warrantywise:

```bash
git init

git add index.html
git commit -m "feat: build responsive warranty tracker interface"

git add app.js
git commit -m "feat: add warranty calculations and product management"

git add README.md
git commit -m "docs: add setup guide and sample warranty data"

git branch -M main
git remote add origin https://github.com/m44nss/warrantywise.git
git push -u origin main
```

If origin already exists:

```bash
git remote set-url origin https://github.com/m44nss/warrantywise.git
git push -u origin main
```

Three commits are useful practice, but they do not guarantee three contribution squares on GitHub.
