# UnitWise — Unit Price Comparison

A beginner-friendly shopping utility that compares products by their normalized unit price, so different pack sizes can be compared fairly.

## Features
- Compare weight (g/kg), volume (ml/L), and piece-based products.
- Automatically normalizes quantities to grams, millilitres, or pieces.
- Highlights the lowest unit price within a compatible category.
- Add, remove, and clear products.
- Load a sample comparison with one click.
- Responsive layout for desktop and mobile.

## Run locally
1. Download or clone this repository.
2. Open `2026-11-11-unitwise/index.html` in a browser, or open the folder in VS Code and use Live Server.
3. Add products with their price, pack quantity, and unit. Compare only like categories.

No build step or dependencies are required. Currency display uses INR.

## Example
| Product | Pack price | Pack size | Price per gram |
| --- | ---: | ---: | ---: |
| Sunrise oats | ₹120 | 500 g | ₹0.24 |
| Harvest oats | ₹210 | 1 kg | ₹0.21 |
| Value oats | ₹165 | 750 g | ₹0.22 |

Harvest oats is the best value in this sample.

## Project structure
```
2026-11-11-unitwise/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Learning notes
- `FormData` reads submitted form values.
- `normalizedQuantity()` converts kg to g and litres to ml.
- `pricePerBaseUnit()` calculates the comparable unit price.
- Event delegation handles remove buttons for dynamically rendered cards.
- `escapeHtml()` prevents user-entered product names from being interpreted as HTML.

## Limitations
This is a simple local-only calculator. It does not save comparisons after a page refresh, and it does not fetch live product prices.
