# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript project demonstrating Unix socket communication with an Express server. It consists of:
- A main Express server (`src/server.ts`) that listens on a Unix socket
- An e2e client (`e2e-client/src/client.ts`) that tests the server via Unix socket
- Both projects use TypeScript and CommonJS modules

## Build & Run Commands

### Main Server
```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript to dist/
npm start          # Run the server (dist/server.js)
npm test           # Run API tests using test-apis.sh
```

### E2E Client
```bash
cd e2e-client
npm install        # Install client dependencies
npm run build      # Compile client TypeScript
npm test           # Run e2e tests (node ./dist/client.js)
```

## Architecture

### Server Architecture
- **Express Server**: Listens on Unix socket at `./dist/app.sock`
- **Socket Management**: Automatically cleans up socket files on startup and shutdown
- **API Endpoints**: `/ping`, `/date`, `/time`, `/iso`, `/api/get/:key`
- **Date Handling**: Uses `date-fns` library for formatting
- **Error Handling**: Proper TypeScript error typing with graceful shutdown

### Client Architecture
- **Custom Unix Socket Client**: Implements HTTP over Unix socket using raw `net.connect()`
- **Socket Path**: Hardcoded to `/Users/dpw/raincity/web-projects/ts-playground/unix-sockets/dist/app.sock`
- **HTTP Protocol**: Manually constructs HTTP requests and parses responses

## Key Implementation Details

### Socket File Management
The server automatically:
1. Removes existing socket files on startup (server.ts:16-28)
2. Sets socket permissions to 777 (server.ts:68) 
3. Handles graceful shutdown with socket cleanup (server.ts:73-84)

### Testing
- **Shell Script**: `test-apis.sh` uses curl with `--unix-socket` flag
- **E2E Client**: Custom TypeScript client that communicates over Unix socket
- **API Testing**: Tests all endpoints: ping, date, time, iso

## Dependencies

### Server Dependencies
- `express`: Web framework
- `date-fns`: Date formatting library
- `@types/express`, `@types/node`: TypeScript definitions

### Client Dependencies  
- `node-fetch`: HTTP client (types only)
- `@types/node-fetch`: TypeScript definitions

## Socket Communication Protocol

The project implements HTTP over Unix domain sockets:
- Socket path: `./dist/app.sock` (relative to project root)
- Client constructs raw HTTP requests manually
- Server responds with standard HTTP protocol over the socket