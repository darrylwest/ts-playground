# Valkey Spaces Database

## Project Overview

A **hybrid database system** combining Valkey (Redis-compatible) caching with S3-compatible storage to provide both high-speed access and durable persistence. Built with TypeScript, this system features a dual-write architecture, comprehensive CLI interface, and robust error handling with exponential backoff retry logic.

### Key Features

- **Hybrid Architecture**: Valkey for speed + Digital Ocean Spaces for durability
- **Dual-Write Strategy**: Parallel writes to both systems with individual retry logic
- **Cache-First Reads**: Valkey primary, S3 fallback with automatic cache warming
- **Email Index System**: O(1) email-to-key lookups with consistency verification
- **CLI Interface**: Full command-line management with JSON responses
- **Type Safety**: End-to-end TypeScript with Zod runtime validation
- **Comprehensive Testing**: Unit and integration tests with 75% coverage requirement

## Architecture

### Core Design Patterns

- **Repository Pattern**: Database operations abstracted through dedicated modules
- **Command Pattern**: CLI commands as separate, composable handlers
- **Strategy Pattern**: Configurable retry logic with exponential backoff
- **Factory Pattern**: Connection management with singleton instances

### Design Principles

1. **No Transactions**: Async-only operations, no commit/rollback
2. **Optimistic Locking**: Version-based concurrency control
3. **Write-through Caching**: Immediate S3 synchronization for durability
4. **Fail-safe Operations**: Graceful degradation when one system fails

## Technology Stack

- **Runtime**: Node.js with ES2022 modules
- **Language**: TypeScript 5.0+ (strict mode)
- **Primary Cache**: Valkey via iovalkey client (^0.3.3)
- **Persistent Storage**: Digital Ocean Spaces via AWS SDK v3
- **Validation**: Zod (^3.22.0) for schema validation
- **Configuration**: dotenvx (^1.48.3) for encrypted environment variables
- **Logging**: Winston with daily rotation
- **Testing**: Jest with coverage reporting
- **Development**: ESLint, Prettier, Nodemon

## Project Structure

```
src/
├── cli/                    # Command-line interface
│   ├── commands/          
│   │   ├── admin.ts       # Administrative operations
│   │   └── user.ts        # User management commands
│   ├── index.ts           # CLI entry point and router
│   ├── types.ts           # CLI response types
│   └── utils.ts           # CLI utilities and validation
├── config/                # Configuration management
│   ├── env.ts             # Zod-validated environment config
│   ├── logger.ts          # Winston logging setup
│   └── index.ts           
├── database/              # Data access layer
│   ├── connections.ts     # Valkey & S3 client management
│   ├── operations.ts      # Core dual-write CRUD operations
│   ├── email-index.ts     # Email→key index management
│   ├── user-ops.ts        # High-level user operations
│   ├── retry.ts           # Exponential backoff retry logic
│   └── index.ts           
├── models/                # Zod data models
│   ├── base.ts            # BaseSchema with common fields
│   ├── person.ts          # PersonSchema 
│   ├── contact.ts         # ContactSchema
│   ├── user.ts            # UserSchema
│   ├── address.ts         # AddressSchema
│   └── index.ts           
├── utils/                 
│   └── keys.ts            # Key generation utilities
└── index.ts               # Main application entry

tests/
├── unit/                  # Isolated unit tests
├── integration/           # End-to-end integration tests
└── setup.ts               # Test configuration
```

## Data Models

All models use Zod schemas for runtime validation:

### BaseSchema
- `key`: Route key format (e.g., `usr:81q3XaaUZzF5`)
- `version`: Optimistic locking version number
- `dateCreated` / `lastUpdated`: ISO timestamp strings
- `status`: Enum (new, active, inactive, suspended, archived)

### UserSchema (extends BaseSchema)
- `email`: Validated email address (unique)
- `first_name`, `last_name`: Optional person details
- `company_name`, `title`: Optional professional details
- `ip_address`: IP address tracking
- `roles`: Comma-separated roles
- `address`: Optional embedded AddressSchema

## Database Operations

### Data Flow
```
CLI Commands → User Operations → Core Database Operations → [Valkey + S3]
                ↓
            Email Index ← → Email→Key Mapping
```

### Core Operations

#### Dual-Write Strategy
```typescript
// Parallel writes with individual retry logic
await Promise.all([
  retryWithExponentialBackoff(() => valkeyClient.set(key, data)),
  retryWithExponentialBackoff(() => s3Client.send(putObjectCommand))
]);
```

#### Cache-First Reads
1. Try Valkey (fast cache access)
2. Fallback to S3 on cache miss
3. Warm cache with S3 data (fire-and-forget)

### Email Index System

**Purpose**: Enable O(1) email-to-user-key lookups without scanning all users

**Implementation**:
- **Valkey Hash**: `email_index` for instant lookups
- **S3 Backup**: `system/email_index.json` for persistence
- **Write-through**: Updates go to both Valkey and S3
- **Consistency Checks**: Periodic verification between systems
- **Rebuild Capability**: Full index reconstruction from user data

## CLI Interface

### User Management Commands

```bash
# Create user with random test data
npm run create-user "user@example.com"

# Find user by email (O(1) lookup)
npm run find-user "user@example.com"

# Get user by key
npm run get-user "usr:81q3XaaUZzF5"

# Update user with optimistic locking
npm run update-user "usr:81q3XaaUZzF5" status=active first_name=John

# List users with pagination
npm run list-users 0 20

# Get total user count
npm run get-user-count
```

### Administrative Commands

```bash
# System health check
npm run health-check

# Verify email index consistency
npm run verify-email-index

# Rebuild email index from scratch
npm run rebuild-email-index

# Show database statistics
npm run show-stats

# Graceful shutdown
npm run shutdown
```

### Response Format

All CLI commands return consistent JSON responses:

```typescript
interface CLIResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp: string;
}
```

## Key Generation

Uses external `txkey` utility for time-based key generation:

- **TxKey**: 12-character time-based key (e.g., `81q3XaaUZzF5`)
- **Route Key**: Domain prefix + txkey (e.g., `usr:81q3XaaUZzF5`)
- **Domains**: `usr:` for users, `con:` for contacts

## Error Handling & Retry Logic

### Exponential Backoff Retry

```typescript
interface RetryOptions {
  maxAttempts: number;      // Default: 3
  baseDelay: number;        // Default: 1000ms
  maxDelay: number;         // Default: 30000ms
  exponentialBase: number;  // Default: 2
  jitter: boolean;          // Default: true
}
```

**Retry Strategy**:
- Initial delay: `baseDelay`
- Subsequent delays: `min(baseDelay * (exponentialBase ^ attempt), maxDelay)`
- Jitter: ±25% randomization to prevent thundering herd
- Applied to all Valkey and S3 operations

### Error Types

1. **Connection Errors**: Network/connectivity issues (retryable)
2. **Validation Errors**: Invalid data format (non-retryable)
3. **Business Logic Errors**: Duplicate users, version conflicts (non-retryable)
4. **System Errors**: Service unavailable (retryable)

## Configuration

### Environment Variables (Zod Validated)

```bash
# Valkey Configuration
VALKEY_HOST=localhost
VALKEY_PORT=6379
VALKEY_PASSWORD=optional

# S3/Spaces Configuration  
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_REGION=nyc3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_BUCKET=your-bucket

# Retry Configuration
RETRY_MAX_ATTEMPTS=3
RETRY_BASE_DELAY=1000
RETRY_MAX_DELAY=30000

# Logging
LOG_LEVEL=info
```

### Encrypted Configuration (dotenvx)

Environment variables are encrypted using dotenvx:

- **Encrypted Files**: `.env`, `.env.development` (committed to repo)
- **Private Keys**: `.env.keys` (gitignored, contains decryption keys)
- **Usage**: All npm scripts automatically decrypt with `dotenvx run`

## Development

### Setup

```bash
# Install dependencies
npm install

# Setup environment (create .env.keys)
npx dotenvx get

# Start development server
npm run dev
```

### Scripts

```bash
npm run build        # TypeScript compilation
npm run lint         # ESLint checking
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier formatting
npm run test         # Run all tests
npm run test:unit    # Unit tests only
npm run test:int     # Integration tests only
npm run test:watch   # Watch mode testing
```

### TypeScript Configuration

- **Target**: ES2022
- **Module System**: ESNext with `.js` import extensions
- **Strict Mode**: Full TypeScript strictness enabled
- **Declaration Files**: Generated for all modules
- **Source Maps**: Enabled for debugging

## Testing

### Test Architecture

- **Unit Tests**: Isolated component testing with comprehensive mocking
- **Integration Tests**: End-to-end CLI and database operations
- **Coverage Requirement**: 75% across branches, functions, lines, statements

### Jest Configuration

```javascript
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75, 
      lines: 75,
      statements: 75
    }
  }
};
```

### Test Categories

1. **Model Validation**: Zod schema validation with valid/invalid data
2. **Key Generation**: txkey and route key creation/validation
3. **Database Operations**: CRUD operations with mocked clients
4. **CLI Commands**: End-to-end command execution
5. **Retry Logic**: Exponential backoff behavior verification
6. **Integration**: Full database and CLI integration tests

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests (requires Valkey + S3)
npm run test:int

# Skip integration tests
SKIP_INTEGRATION_TESTS=true npm test

# Skip CLI tests
SKIP_CLI_TESTS=true npm test
```

## Logging

### Winston Configuration

- **Format**: JSON with timestamps and metadata
- **Daily Rotation**: 20MB max file size, 14-day retention
- **Log Levels**: error, warn, info, debug
- **Development**: Colorized console output
- **Production**: File-based logging only

### Log Files

- **Combined**: `logs/application-%DATE%.log` (all levels)
- **Errors**: `logs/error-%DATE%.log` (error level only, 30-day retention)

## Production Deployment

### PM2 Configuration

```bash
# Start production cluster
npm run start:prod

# Monitor processes
npm run pm2:status

# View logs
npm run pm2:logs

# Stop all processes
npm run pm2:stop
```

### Environment Checklist

- [ ] Valkey server accessible and configured
- [ ] Digital Ocean Spaces credentials configured
- [ ] Environment variables encrypted with dotenvx
- [ ] PM2 installed globally
- [ ] Log directory permissions configured
- [ ] Health checks passing

## Key Technical Decisions

1. **Dual-Write Strategy**: Provides both performance (Valkey) and durability (S3)
2. **Email Index**: Enables O(1) user lookups without full table scans
3. **Exponential Backoff**: Resilient retry logic for network failures
4. **Optimistic Locking**: Version-based concurrency without blocking
5. **CLI-First Design**: Scriptable operations for automation
6. **Type Safety**: End-to-end TypeScript with runtime validation
7. **Encrypted Configuration**: Secure credential management

## Operational Considerations

### Monitoring

- Health check endpoints for both Valkey and S3
- Email index consistency verification
- Database statistics and user counts
- Winston logging with structured JSON output

### Maintenance

- Email index rebuilds for consistency recovery
- Log rotation and cleanup
- Connection pool monitoring
- Version upgrade procedures

### Scaling

- Valkey clustering for cache layer scaling
- S3 partitioning strategies for large datasets
- Connection pool tuning for high concurrency
- Retry logic tuning for network conditions

## Security

- Encrypted environment variable storage (dotenvx)
- Input validation on all CLI commands
- Email format validation
- Key format validation and sanitization
- No sensitive data in logs
- Proper error message sanitization

This database system provides a solid foundation for applications requiring both high-performance access and durable persistence, with excellent operational characteristics and comprehensive tooling for development and production environments.