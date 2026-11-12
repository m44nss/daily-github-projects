# RecallDeck — Flashcard Study Tool

RecallDeck is a responsive flashcard app built with HTML, CSS and vanilla JavaScript. Create your own cards, practise in study mode and track which topics you have mastered.

## Features

- Create, edit and delete flashcards
- Add a topic/category to each card
- Search cards and filter by learning status
- Flip cards to reveal answers
- Mark cards as **Got it** or **Review again**
- Shuffle the study queue
- Track total, mastered and to-review cards
- Save your deck in browser localStorage
- Import and export JSON deck backups
- Keyboard shortcuts in study mode: **Space** flips, **← / →** moves between cards
- Includes a sample deck to try immediately

## Project files

- `index.html` — page structure and dialogs
- `styles.css` — responsive visual design
- `storage.js` — card creation, validation and localStorage
- `study.js` — study queue and progress helpers
- `app.js` — UI events and app integration
- `sample-deck.json` — starter flashcards

## Run on Windows with VS Code

1. Extract the project folder.
2. Open the folder in VS Code.
3. Install the **Live Server** extension if you do not already have it.
4. Right-click `index.html` and select **Open with Live Server**.
5. In the empty deck, choose **Load sample deck** or create your own cards.

Use Live Server because the app loads `sample-deck.json` with `fetch()` and uses JavaScript modules. Do not open the page directly with `file://`.

## Data and privacy

Your cards are stored in this browser's localStorage. They are not uploaded to a server. Use **Export JSON** to make a backup before clearing browser data or changing devices.

## Quick test

1. Load the sample deck.
2. Open **Study mode** and begin a session.
3. Click the card or press Space to reveal an answer.
4. Mark one card **Got it** and another **Review again**.
5. Return to **My cards** and check the progress counters.
6. Export the deck, then try importing that JSON file.
