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
*   Test Coverage

**7. Configuration (`src/config.ts`):**

*   Implement a simple configuration module to manage settings like the socket file path and the path to the data file, using an encrypted `.env` file with `dotenvx`.

**8. Logging

* Use Winston for logging
* create a rolling file logger

**9. Integration (e2e) Testing

* create e2e folder
* develop tests with jest

---- Revised to replace keyv with valkey

✦ Okay, I understand. Replacing keyv with valkey is a significant change, as it involves switching the underlying data store.


  Here's a plan to migrate the socket server to use Valkey:

  1. Research Valkey & Client:
   * Briefly understand Valkey's core concepts and identify a suitable Node.js client library (e.g., ioredis or node-redis).


  2. Update Dependencies:
   * Uninstall keyv and keyv-file.
   * Install the chosen Valkey client library.


  3. Refactor `src/store.ts`:
   * Replace the Keyv initialization with the Valkey client initialization.
   * Adapt set, get, delete, and clear operations to use the Valkey client's API.
   * Implement the iterator functionality using Valkey's SCAN command to support dbsize, keys, last, and status commands.


  4. Refactor `src/command-handler.ts`:
   * Re-enable and update the dbsize, keys, last, and status commands to use the new Valkey-based iteration logic from src/store.ts.
   * Ensure all other commands (set, get, remove, etc.) continue to interact correctly with the refactored store.ts.


  5. Update `src/config.ts`:
   * Modify configuration to include Valkey connection details (e.g., host, port) instead of dataPath if Valkey is running as a separate service. If Valkey is embedded or file-based, adapt dataPath accordingly. (Initial assumption: Valkey will run as a separate service, so new config for host/port
     will be needed).


  6. Update Tests (`tests/command-handler.test.ts`):
   * Modify the jest.mock setup to mock the Valkey client instead of keyv.
   * Verify that all existing tests still pass with the new data store.
