# Socket Server

A TypeScript socket server that uses keyv as a data store.

## Server API

The server exposes a TCP-based API on the port specified in the configuration file. The server handles the following commands:

### Connection Management

*   **`quit`**: Closes the current client connection.
*   **`shutdown`**: Shuts down the server gracefully, saving the database if it has been modified.

### Server Information

*   **`version`**: Returns the server version.
*   **`ping`**: Returns "pong". Used to check if the server is alive.
*   **`status`**: Returns the server status, including database size, uptime, and the database file path.
*   **`help`**: Returns the help text.

### Key/Value Store

*   **`set <key> <value>`**: Sets the value for the given key. If the key already exists, its value is updated.
*   **`get <key>`**: Retrieves the value for the given key.
*   **`remove <key>`**: Removes the key and its value from the store.
*   **`last <count>`**: Returns the last `<count>` key/value pairs from the store.
*   **`dbsize`**: Returns the number of key/value pairs in the store.
*   **`keys`**: Returns a list of all keys in the store.
*   **`cleardb`**: Removes all key/value pairs from the store.
*   **`save`**: Saves the in-memory database to the configured data file.

### Key Generation

*   **`txkey`**: Generates a new timestamp-based key.
*   **`rtkey`**: Generates a new route-based key.

###### dpw | 2025.07.08 | 81UteFYAocl8
