# Wizard Scores

A dependency-free, offline-capable scorekeeper for the Wizard card game.

## Run locally

Serve this folder over HTTP. For example, with Python installed:

```powershell
Set-Location app
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Install on iPhone

Deploy the contents of this folder to any HTTPS static host, open the URL in Safari, then choose **Share > Add to Home Screen**. After the first visit, the service worker keeps the scorekeeper available offline.

All game data stays in browser storage on the device. Use **Export backup** on the home screen before clearing Safari data or replacing the phone.
