// Connection management
export {
  getValkeyClient,
  getS3Client,
  checkValkeyHealth,
  checkS3Health,
  closeConnections,
} from './connections.js';

// Core database operations
export { set, get, del, exists, setS3Only } from './operations.js';

// Email index operations
export {
  addEmailMapping,
  getKeyByEmail,
  removeEmailMapping,
  rebuildEmailIndex,
  verifyEmailIndex,
  getAllEmailMappings,
  syncEmailIndexToS3,
} from './email-index.js';

// User operations
export {
  createUser,
  getUserByEmail,
  getUserByKey,
  updateUser,
  deleteUser,
  listUsers,
  getUserCount,
  userExists,
  getAllUserKeys,
} from './user-ops.js';

// Retry utilities
export { retryWithExponentialBackoff, type RetryOptions } from './retry.js';
