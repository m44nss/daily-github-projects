# PortionPilot — Recipe Scaler & Shopping List

A browser-based kitchen helper: resize recipes for the number of servings you need, then combine ingredients into one shopping list.

## Features

- Three built-in demo recipes.
- Scale ingredient quantities from 1 to 50 servings.
- Create and save custom recipes.
- Combine matching ingredients from multiple recipes.
- Convert compatible weight units (g/kg) and volume units (ml/l/tsp/tbsp/cup).
- Tick off or remove shopping items; clear checked or all items.
- Export recipes and shopping list as a JSON backup.
- Responsive layout; no framework, account, API or build step.

## Files

```text
portionpilot/
├── index.html   # Responsive interface and styles
├── app.js       # Recipe data, scaling, unit math and shopping list
└── README.md    # Setup and test guide
```

## Run on Windows

1. Extract \`portionpilot.zip\`.
2. Open the \`portionpilot\` folder in VS Code.
3. Right-click \`index.html\` → **Open with Live Server**.
4. Select a recipe, change servings and add scaled ingredients to the shopping list.

No npm install is required. Live Server is recommended because the app uses a JavaScript module.

## Create a recipe

Select **Create a recipe**, enter the name and base servings, then add one ingredient per line:

```text
1 | cup | rice
2 | tbsp | lemon juice
0.5 | tsp | salt
```

Supported units: \`g\`, \`kg\`, \`ml\`, \`l\`, \`tsp\`, \`tbsp\`, \`cup\`, \`pcs\`, \`clove\`, \`slice\`, \`pinch\`, \`bunch\`.

## Scaling and conversions

Each amount is multiplied by \`target servings / base servings\`. For shopping-list combining, weight units convert to grams and volume units convert to millilitres. The app uses 1 cup = 240 ml, 1 tbsp = 15 ml and 1 tsp = 5 ml. Count-like units combine only with the same unit. It does not infer ingredient density or convert grams to cups.

## Quick tests

1. Choose Berry overnight oats (2 servings); change to 4. Rolled oats should change from 1 cup to 2 cups.
2. Add the recipe to the shopping list.
3. Add Tomato basil pasta. Matching ingredient names and compatible dimensions are combined.
4. Create a recipe with \`0.5 | cup | rolled oats\`; add it and check that the oats total increases.
5. Tick an item and use **Clear checked**.
6. Export a JSON backup.
7. Refresh the page; recipes and shopping list should remain.

## Storage notes

Data is saved in this browser's \`localStorage\`, not uploaded. Export a backup before clearing browser data or changing devices. The app does not sync between devices. Use invoice or recipe source measurements when precision matters.

## Exactly 3 meaningful Git commit groups

```bash
git init

git add index.html
git commit -m "feat: build responsive PortionPilot recipe workspace"

git add app.js
git commit -m "feat: add recipe scaling and combined shopping list logic"

git add README.md
git commit -m "docs: add PortionPilot setup, demo data and testing guide"

git branch -M main
git remote add origin https://github.com/m44nss/portionpilot.git
git push -u origin main
```

If \`origin\` already exists:

```bash
git remote set-url origin https://github.com/m44nss/portionpilot.git
git push -u origin main
```

Three meaningful commits are good Git practice, but they do not guarantee three GitHub contribution squares.
