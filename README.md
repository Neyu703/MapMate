# MapMate

A personal, self-hosted alternative to Google Maps for exploring your surroundings: search
an address, find nearby points of interest (supermarket, tram stop, gym, ...), plan walking
and public-transport routes, save favorites, and link them into a small map-based graph.

Ships as a Windows desktop app (`MapMate.exe`) — the FastAPI backend runs inside the same
process as the UI window, so there's nothing to start manually.

## Stack

- **Frontend**: React + Vite + TypeScript, `react-leaflet` (OpenStreetMap tiles), SCSS
  (CSS Modules), `@tanstack/react-query` for server state.
- **Backend**: Python + FastAPI + SQLite, proxying Nominatim (geocoding), Overpass (POIs),
  OSRM (walking routes), and `v6.db.transport.rest` (public transport journeys).
- **Desktop shell**: `pywebview`, packaged with PyInstaller.

## Development

Two terminals, backend and frontend served separately with hot reload:

```bash
# Terminal 1 — backend
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Run the backend test suite:

```bash
cd backend
.venv\Scripts\pytest --cov=app
```

Run the desktop launcher against a built frontend (needs `requirements-desktop.txt`):

```bash
cd frontend && npm run build && cd ..
backend\.venv\Scripts\pip install -r backend/requirements-desktop.txt
backend\.venv\Scripts\python desktop/launcher.py
```

## Versioning & Releases

Every commit to `main` bumps the minor version in `frontend/package.json`
(`X.Y.0 → X.(Y+1).0`, patch always `0`) and gets tagged/released automatically by
`.github/workflows/auto-release.yml`. `.github/workflows/build-exe-release.yml` then builds
the frontend, bundles it with the backend into `MapMate.exe` via PyInstaller, and attaches
`MapMate-win64.zip` to that release — so every push to `main` produces a downloadable,
versioned build with no manual release step. Grab the latest one from the
[Releases page](../../releases).

`auto-release.yml` needs a `RELEASE_PAT` repository secret (a token with `repo` +
`workflow` scope) rather than the default `GITHUB_TOKEN`: GitHub does not fire new
workflow runs for events created by the default token, so a release created that way
would never trigger `build-exe-release.yml`.

## Data & Logs

Application data lives outside the install folder, so updates never touch it:
`%LOCALAPPDATA%\MapMate\app.db` and `%LOCALAPPDATA%\MapMate\logs\mapmate.log`.
