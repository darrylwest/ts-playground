# Models Service Project Plan

## Overview

The Models Service is a node.js / express / valkey service to define and implement various data models, e.g., users, contacts, address, email, product, etc.

## Dependencies

* node.js
* typescript
* express 
* dotenvx for encrypted configuration
* nodemod for dev server
* valkey
* txkey defined as `Date.now().toString(36) + Math.random().toString(36).substring(2, 10);`
* winston for rolling file logger
* jest for unit with mocks 
* jest for e2e tests without mocks (live database, and full REST calls with node-fetch)
* jest for code coverage reports
* github workflow CI/CD script

## TypeScript Files

src


###### dpw | 2025-07-08 | 81VOlU6XYyhM

