# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript demo application that tests data model schemas using Zod. The project demonstrates schema validation and data persistence patterns with TypeScript and Zod.

## Key Architecture

- **Models**: Defined in `src/models.ts` using Zod schemas
- **Base Schema Pattern**: All models extend `BaseSchema` which provides common fields (key, dateCreated, lastUpdated, version, status)
- **Schema Hierarchy**: 
  - `BaseSchema` → `ContactSchema` → `UserSchema`
  - `AddressSchema` (standalone, used as array in UserSchema)
- **Data Storage**: Models are stored in Zod maps (`const ContactMap = z.map(z.string(), ContactSchema)`, `const UserMap = z.map(z.string(), UserSchema)`)
- **Persistence**: Models are JSON.stringify'd and written to disk

## Development Commands

The project currently has minimal npm scripts configured:
- `npm test` - Currently returns an error (no tests implemented yet)

## Required Development Setup

Based on the README requirements, the following structure needs to be implemented:

1. **Main Entry Point**: Create an index file that:
   - Populates models in various ways
   - Stores data in Zod maps (ContactMap, UserMap)
   - JSON.stringify's and writes models to disk

2. **Testing Framework**: Set up Jest for unit testing
   - Tests should go in `tests/` folder
   - No mocks needed for model tests
   - Test coverage should be provided

3. **Build System**: Set up TypeScript compilation
   - Compiled code should go in `dist/` folder

## Model Schemas

- **BaseSchema**: Contains key (12-char), dateCreated, lastUpdated, version, and status fields
- **ContactSchema**: Extends BaseSchema with contact information (email required, IP address required)
- **UserSchema**: Extends ContactSchema with roles, preferences, company_name, and addresses array
- **AddressSchema**: Standalone schema for address information

## Key Utilities

- `createTxKey()`: Generates 12-character transaction keys for model instances

## Dependencies

- **zod**: ^4.0.5 - Schema validation library
- **type**: commonjs - Module system