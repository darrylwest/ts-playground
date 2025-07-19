# Booking Calendar Project

The Plan: Google Calendar Booking Webhook (v2)

## Phase 1: Google Cloud & Calendar Configuration (The "Setup")

1. Enable Google Calendar API: In the Google Cloud Console, enable the API for your project.
2. Create a Service Account: Create the service account to act as our application's identity.
3. Generate a JSON Key: Download the service account's JSON credentials file.
4. Share Calendar: Share your "Booking System" calendar with the service account's email address, granting it "Make changes to events" permissions.

## Phase 2: Node.js Webhook Server (The "Code")

1. Project Initialization & Tooling:
    * Initialize a Node.js project (npm init).
    * Set up TypeScript (tsconfig.json).
    * Install core dependencies: express, googleapis, and @dotenvx/dotenvx.
    * Install development dependencies: typescript, ts-node, nodemon, eslint, prettier, and necessary plugins (e.g., for TypeScript and Prettier integration).
    * Configure eslint and prettier with their respective config files (e.g., .eslintrc.js, .prettierrc).
    * Set up a .gitignore file to exclude node_modules, .env* files (except .env.vault), and build outputs.
2. Environment Variable Setup (dotenvx):
    * Create a .env file.
    * Add a variable pointing to the path of your downloaded Google JSON key, or store the key's content directly.
    * Use @dotenvx/dotenvx to load these variables into the application.
3. Create an Express Server: Build the minimal web server using Express.
4. Create the Webhook Endpoint: Define a /api/calendar-webhook route that listens for POST requests from Google. Initially, it will just log the incoming headers and body so we can inspect the notifications.
5. Implement Webhook Registration: Create a separate, one-time script. This script will use googleapis and our service account credentials to tell Google Calendar to start sending notifications for our booking calendar to our public webhook URL.

## Phase 3: Local Development & Deployment (The "Testing & Go-Live")

1. Use ngrok for Local Testing: Expose your local server to the internet to receive real notifications from Google during development.
2. Deployment: Plan for deploying the Node.js app to a permanent cloud host.

## Deployment to Droplet Fix

**Background**: The application failed to build on the droplet, so I modified the build command to this:

``json
"scripts": {
  "build": "NODE_OPTIONS='--max_old_space_size=4096' tsc"
}
```

1. **Node.js Memory Limits:**

* Node.js, by default, has a limited amount of memory allocated for its heap (the area where it stores variables and objects). This limit is typically around 512MB for 32-bit systems and 1GB for 64-bit systems.
* When compiling large TypeScript projects, the tsc (TypeScript compiler) process can exceed this default memory limit, leading to the "JavaScript heap out of memory" error.

2. **NODE_OPTIONS Environment Variable:**

* NODE_OPTIONS is an environment variable that allows you to pass command-line options to the Node.js runtime.
* By setting NODE_OPTIONS="--max_old_space_size=4096", you're instructing Node.js to increase the maximum memory that can be used by the "old generation" heap to 4GB (4096MB). The "old generation" heap is where long-lived objects are stored, which is relevant during the compilation process.

3. **Why This Works:*

* Increasing the heap size gives the tsc process more room to operate, preventing it from running out of memory when dealing with large or complex TypeScript codebases.

**NOTE**: _If you encounter a "JavaScript heap out of memory" error during the `npm run build` process, it means the TypeScript compiler is running out of memory. This can happen with larger projects. To resolve this, increase the Node.js memory limit by setting the `NODE_OPTIONS` environment variable._

###### dpw | 2025.07.19
