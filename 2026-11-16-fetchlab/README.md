# FetchLab — API Request Tester

A beginner-friendly browser HTTP client for trying APIs and learning fetch, JSON, headers, async/await and error handling.

## Features
- GET, POST, PUT, PATCH and DELETE methods.
- Editable request headers as a JSON object.
- JSON request body with validation.
- Response status, duration, size, body and response headers.
- Cancel button and 20-second timeout.
- Copy response and replay the last 8 requests.
- Local browser history; no backend or account.

## Files
- index.html — interface and responsive CSS
- app.js — request logic, helpers, sample data and history
- README.md — setup and test guide

## Run on Windows
1. Extract the ZIP and open the fetchlab folder in VS Code.
2. Right-click index.html and choose Open with Live Server.
3. A GET sample loads automatically. Press Send request.
4. Try the POST sample and inspect its response.
5. Refresh the page and replay a request from Recent Activity.

Use Live Server because this project uses a JavaScript ES module. Do not open the HTML with file://.

## Demo endpoints
- GET https://jsonplaceholder.typicode.com/posts/1
- POST https://jsonplaceholder.typicode.com/posts

JSONPlaceholder is a fake REST API. Its POST response is simulated and does not permanently save a record.

## Quick tests
1. Send the GET sample; expect HTTP 200.
2. Send the POST sample.
3. Add a custom header such as X-Learning-Tag with value fetchlab.
4. Enter invalid JSON in the headers field; the request should be blocked.
5. Enter a file:// URL; validation should reject it.
6. Cancel a slow request.
7. Refresh and replay a history item, then clear history.

## CORS and privacy
The browser Fetch API can only read cross-origin responses when the API allows your page's origin (CORS). A network error may be caused by CORS, not by an offline API. Do not disable browser security. Never send passwords, API secrets or private data to public demo endpoints. Request history stays in this browser's localStorage.

## Exactly 3 meaningful Git commit groups

~~~bash
git init

git add index.html
git commit -m "feat: build FetchLab API workspace interface"

git add app.js
git commit -m "feat: implement HTTP client and response inspector"

git add README.md
git commit -m "docs: add FetchLab setup, demos and CORS guide"

git branch -M main
git remote add origin https://github.com/m44nss/fetchlab.git
git push -u origin main
~~~

If origin already exists:

~~~bash
git remote set-url origin https://github.com/m44nss/fetchlab.git
git push -u origin main
~~~

Three meaningful commits are useful practice, but they do not guarantee three GitHub contribution squares.
