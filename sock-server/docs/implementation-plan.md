# Implementation Plan: Unix Socket K/V Store Server

This document outlines the plan to implement a Unix Socket server for a key-value store, backed by `keyv`.

**1. Project Setup & Scaffolding:**

*   Create a `package.json` to manage dependencies.
*   Install core dependencies: `keyv` for the data store and `dotenvx` to manage encrypted environment variables.
*   Install development dependencies: `typescript`, `ts-node`, `nodemon` for development, and `jest`, `ts-jest`, `@types/jest` for testing.
*   Initialize a `tsconfig.json` to configure TypeScript compilation.
*   Create the basic directory structure: a `src` directory for the server's source code and a `tests` directory for the unit tests.

**2. Core Server Implementation (`src/server.ts`):**

*   Use Node.js's built-in `net` module to create a Unix Socket server.
*   The server will listen for client connections on a configurable socket file path instead of a TCP port.
*   It will need logic to handle incoming data streams, parse them into commands and arguments, and manage individual client connections. This includes cleaning up the socket file on shutdown.

**3. Data Store Integration (`src/store.ts`):**

*   Integrate `keyv` as the backing key-value store.
*   This module will encapsulate all interactions with `keyv`, including initialization and methods for saving the data to a file.

**4. Command Handling (`src/command-handler.ts`):**

*   Create a module to process and route the parsed commands.
*   This handler will take a command and its arguments and execute the corresponding logic (e.g., calling the appropriate function in the data store module).

**5. Command Implementation (within `src/`):**

*   Implement the logic for each command specified in the `README.md`, separated into logical modules:
    *   **Connection & Server Commands:** `quit`, `shutdown`, `version`, `ping`, `status`, `help`.
    *   **Data Store Commands:** `set`, `get`, `remove`, `last`, `dbsize`, `keys`, `cleardb`, `save`.
    *   **Key Generation Commands:** `txkey`, `rtkey`.

**6. Unit Testing (within `tests/`):**

*   Write Jest tests for each command to ensure they behave as expected.
*   Mock the `keyv` dependency to isolate the command logic during testing.
*   Write tests for the server's connection handling and data parsing.

**7. Configuration (`src/config.ts`):**

*   Implement a simple configuration module to manage settings like the socket file path and the path to the data file, using an encrypted `.env` file with `dotenvx`.
