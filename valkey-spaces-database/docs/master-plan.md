# Master Implementation Plan
## Valkey Spaces Database

### Architecture Overview

This prototype implements a hybrid database system combining Valkey (Redis-compatible) caching with Digital Ocean Spaces (S3) for persistence. The system provides:

- **Primary Storage**: Valkey for high-speed access
- **Backup Storage**: S3 for durability
- **Dual-write Strategy**: Parallel writes to both systems
- **Email Indexing**: Dedicated hash for email→key lookups
- **Error Recovery**: Exponential backoff retry pattern

### Core Design Principles

1. **No Transactions**: Async operations only, no commit/rollback
2. **Pipelining**: Use Valkey pipelines where possible
3. **Write-through Sync**: Immediate S3 updates for email index
4. **Key-based Access**: 16-char keys (domain:12-char-txkey format)

## Implementation Phases

### Phase 1: Foundation & Utilities
**Estimated Time**: 2-3 hours

#### 1.1 Project Setup
- Initialize TypeScript project with dependencies
- Configure ESLint, Prettier, Jest
- Setup dotenvx for encrypted environment variables
- Configure Winston logging with daily rotation

#### 1.2 Key Generation Utilities
**Location**: `src/utils/keys.ts`
- `createTxKey()`: Generate 12-character time-based short keys
- `createRouteKey(domain)`: Generate 16-character keys (domain:txkey)
- Key validation utilities

#### 1.3 Data Models  
**Location**: `src/models/`
- `base.ts`: BaseSchema, BaseStatus enum
- `person.ts`: PersonSchema  
- `contact.ts`: ContactSchema
- `user.ts`: UserSchema, AddressSchema
- `index.ts`: Export all schemas and types

### Phase 2: Database Layer
**Estimated Time**: 4-5 hours

#### 2.1 Connection Management
**Location**: `src/database/connections.ts`
- Valkey client initialization with iovalkey
- S3 client setup for Digital Ocean Spaces
- Connection health checks and reconnection logic

#### 2.2 Core Database Operations
**Location**: `src/database/operations.ts`
- `set(key, data)`: Dual-write to Valkey + S3 with retry logic
- `get(key)`: Cache-first with S3 fallback
- `delete(key)`: Remove from both systems
- Exponential backoff retry implementation

#### 2.3 Email Index Management
**Location**: `src/database/email-index.ts`
- `addEmailMapping(email, key)`: Update email_index hash + S3
- `getKeyByEmail(email)`: O(1) email→key lookup
- `removeEmailMapping(email)`: Remove from index
- `rebuildEmailIndex()`: Scan all users and rebuild index
- `verifyEmailIndex()`: Background verification job

#### 2.4 User Operations
**Location**: `src/database/user-ops.ts`
- `createUser(email, data)`: Create with email index update
- `getUserByEmail(email)`: Email-based lookup
- `getUserByKey(key)`: Direct key lookup  
- `updateUser(key, updates)`: Update with optimistic locking
- `listUsers(offset, limit)`: Paginated user listing
- `getUserCount()`: Total user count

### Phase 3: CLI Implementation
**Estimated Time**: 3-4 hours

#### 3.1 CLI Framework
**Location**: `src/cli/`
- Command parser and router
- JSON response formatting
- Error handling and logging

#### 3.2 User Commands
**Location**: `src/cli/commands/user.ts`
- `create-user <email>`: Create user with random data
- `find-user <email>`: Find by email address
- `get-user <key>`: Get by user key
- `update-user <key> <field>=<value>`: Update user fields
- `list-users <offset> <limit>`: List users with pagination
- `get-user-count`: Return total user count

#### 3.3 Admin Commands
**Location**: `src/cli/commands/admin.ts`
- `verify-email-index`: Run email index verification
- `rebuild-email-index`: Force rebuild of email index
- `health-check`: Verify Valkey and S3 connectivity

### Phase 4: Testing & Validation
**Estimated Time**: 2-3 hours

#### 4.1 Unit Tests
- Key generation utilities
- Data model validation
- Database operations (mocked)
- Email index management

#### 4.2 Integration Tests  
- End-to-end CLI commands
- Valkey + S3 integration
- Error scenarios and retry logic

#### 4.3 Performance Testing
- Concurrent user operations
- Cache hit/miss scenarios
- Email index lookup performance

## Project Structure

```
src/
├── models/           # Zod schemas and types
├── utils/           # Key generation and utilities  
├── database/        # Database layer and operations
├── cli/            # CLI commands and framework
├── config/         # Configuration management
└── types/          # Shared TypeScript types

tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── fixtures/       # Test data and helpers

docs/               # Documentation
├── master-plan.md  # This file
└── api.md         # CLI command documentation
```

## Dependencies Configuration

### Core Dependencies
```json
{
  "zod": "^3.22.0",
  "iovalkey": "^1.0.0", 
  "@aws-sdk/client-s3": "^3.0.0",
  "winston": "^3.10.0",
  "winston-daily-rotate-file": "^4.7.0",
  "dotenvx": "^0.10.0",
  "date-fns": "^2.30.0"
}
```

### Development Dependencies
```json
{
  "@types/node": "^20.0.0",
  "typescript": "^5.0.0",
  "eslint": "^8.50.0",
  "@typescript-eslint/eslint-plugin": "^6.0.0",
  "@typescript-eslint/parser": "^6.0.0",
  "prettier": "^3.0.0",
  "jest": "^29.0.0",
  "@types/jest": "^29.0.0",
  "ts-jest": "^29.0.0",
  "nodemon": "^3.0.0",
  "pm2": "^5.3.0"
}
```

## Configuration Strategy

### Environment Variables
```bash
# Valkey Configuration
VALKEY_HOST=localhost
VALKEY_PORT=6379
VALKEY_PASSWORD=<encrypted>

# Digital Ocean Spaces
DO_SPACES_KEY=<encrypted>
DO_SPACES_SECRET=<encrypted>
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=valkey-database

# Application
NODE_ENV=development
LOG_LEVEL=info
RETRY_MAX_ATTEMPTS=3
RETRY_BASE_DELAY=1000
```

## Error Handling Patterns

### Retry Strategy
```typescript
const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000,  // 8 seconds
  exponentialBase: 2,
  jitter: true
};
```

### Failure Scenarios
1. **Valkey Success, S3 Failure**: Log error, retry S3 operation
2. **S3 Success, Valkey Failure**: Log error, retry Valkey operation  
3. **Both Fail**: Return error after max retry attempts
4. **Partial Email Index Sync**: Background job will detect and repair

## Success Criteria

### Functional Requirements
- [ ] All CLI commands work as specified
- [ ] Data persists correctly in both Valkey and S3
- [ ] Email index provides O(1) lookups
- [ ] Cache-first reads with S3 fallback
- [ ] Proper error handling with exponential backoff

### Non-Functional Requirements  
- [ ] Sub-100ms response times for cached reads
- [ ] Handles concurrent operations safely
- [ ] Comprehensive test coverage (>80%)
- [ ] Proper logging and error reporting
- [ ] Clean, maintainable TypeScript code

## Risk Mitigation

### Technical Risks
- **Valkey Connection Loss**: Implement reconnection logic with health checks
- **S3 Rate Limits**: Use exponential backoff, consider connection pooling
- **Email Index Corruption**: Verification job detects and repairs inconsistencies
- **Concurrent Access**: Use optimistic locking with version fields

### Development Risks
- **Scope Creep**: Stick to CLI-only interface, defer Firebase integration
- **Over-Engineering**: Focus on PoC functionality, avoid premature optimization
- **Testing Gaps**: Prioritize integration tests for critical paths

---

**Next Steps**: 
1. Review and approve this implementation plan
2. Begin Phase 1 implementation
3. Iterate based on testing and feedback

*Plan created: 2025-07-22*
*Estimated total development time: 11-15 hours*