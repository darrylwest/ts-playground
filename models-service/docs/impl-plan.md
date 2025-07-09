# Models Service Project Plan

## Overview

The Models Service is a node.js / express / valkey service to define and implement various data models, e.g., users, contacts, address, email, product, etc.

## Dependencies

* node.js
* typescript
* express 
* dotenvx for encrypted configuration
* nodemod for dev server
* valkey data store
* winston for rolling file logger
* date-fns for date/time calculations
* dinero for money/currency calculations
* jest for unit with mocks 
* jest for e2e tests without mocks (live database, and full REST calls with node-fetch)
* jest for code coverage reports
* github workflow CI/CD script

## Models

### Domain Key: TxKey

Function: `createTxKey`
File: txkey.tc

* a base62 date based key unique to a specific domain
* used for unique id in domain models
* uses crypto to generate random numbers
* uses process.hrtime.bigint() for high res nano second clock
* always 12 characters
* sortable, new keys always increase (dt + random)

### Base Model

* key: DomainKey.create()
* dateCreated: number
* lastUpdate: number
* version: number

### Contact Model

### Address Model

### User Model

### Availability Model

### Appointment Model

## TypeScript Files

src


###### dpw | 2025-07-08 | 81VOlU6XYyhM

