# Ship Flow

Ship Flow has two runtimes:

- a hosted/web Next.js app
- a local-first Electron desktop app

The desktop app is designed to work offline on the local machine, support optional Remote SSH connections, and sync with the cloud when the user signs in.

## Requirements

- Node.js 20+
- npm

## Setup

Install dependencies from the repo root:

```bash
npm install
```

If you want cloud auth and sync, copy `.env.example` to `.env` and fill in the OAuth/database values:

```bash
cp .env.example .env
```

Cloud sign-in is optional for local desktop usage. It is required for hosted web auth and cloud sync.

## Run The Web App

Start the normal Next.js web app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Run The Desktop App

Start the Electron desktop app from the repo root:

```bash
npm run desktop:dev
```

What this does:

- builds the Next.js standalone server bundle Electron uses internally
- builds the desktop workspace
- launches Electron

Desktop behavior:

- it boots into the local workspace by default
- it works offline with local desktop storage
- cloud sign-in is only needed if you want sync

## Connect To A Remote Machine Over SSH

Once the desktop app is open:

1. Open `Connection -> Connect to Remote...`
2. Enter the SSH host, port, username, and private key
3. Ship Flow will connect over SSH and load the remote workspace

To return to the local workspace, use `Connection -> Return to Local Workspace`.

## Build Desktop Artifacts

Build the standalone server plus compiled Electron files:

```bash
npm run desktop:build
```

Run the desktop smoke test:

```bash
npm run test:desktop:smoke
```

Package the desktop app:

```bash
npm run desktop:package
```

## Notes

- The desktop runtime uses the local standalone app server rather than `next dev`.
- Packaged desktop builds bundle their own Node runtime so the local server works offline without requiring a system Node install.
- Remote SSH and cloud sync are separate features.
- In local mode, the desktop app owns local data and can sync it to cloud later.
- In SSH mode, the remote Ship Flow server owns the workspace state.
