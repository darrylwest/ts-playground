import { z } from 'zod';
import { ContactSchema, BaseStatus } from './models';
import { createRouteKey } from './txkey';

// Define the input type for the function using z.input
type ContactFunctionInput = z.input<typeof ContactSchema>;

/**
 * Processes contact data, validating it against ContactSchema.
 * @param data The contact data to process.
 */
async function processContactData(data: ContactFunctionInput) {
  try {
    // Attempt to parse and validate the incoming data
    const validatedContact = ContactSchema.parse(data);
    console.log("Successfully validated and processed contact:", validatedContact);
    return validatedContact;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error for contact data:", error.issues);
    } else {
      console.error("An unexpected error occurred:", error);
    }
    throw error; // Re-throw the error after logging
  }
}

async function runExample() {
  console.log("\n--- Running Zod Function Parameter Validation Example ---");

  // Example 1: Valid contact data
  const validContact = {
    key: await createRouteKey('con'),
    dateCreated: Date.now(),
    lastUpdated: Date.now(),
    version: 1,
    status: BaseStatus.Active,
    first_name: "Alice",
    last_name: "Smith",
    email: "alice.smith@example.com",
    ip_address: "192.168.1.100",
    details: new Map([["source", "web"]]),
  };
  console.log("\nAttempting to process valid contact:");
  await processContactData(validContact);

  // Example 2: Invalid contact data (missing email)
  const invalidContactMissingEmail = {
    key: await createRouteKey('con'),
    dateCreated: Date.now(),
    lastUpdated: Date.now(),
    version: 1,
    status: BaseStatus.New,
    first_name: "Bob",
    last_name: "Johnson",
    // email is missing, which is required by ContactSchema
    email: undefined as any, // Intentionally missing to trigger validation
    ip_address: "10.0.0.50",
  };
  console.log("\nAttempting to process invalid contact (missing email):");
  try {
    await processContactData(invalidContactMissingEmail);
  } catch (e) {
    // Expected error
  }

  // Example 3: Invalid contact data (invalid key prefix)
  const invalidContactBadKey = {
    key: await createRouteKey('bad'), // Incorrect prefix
    dateCreated: Date.now(),
    lastUpdated: Date.now(),
    version: 1,
    status: BaseStatus.Active,
    first_name: "Charlie",
    last_name: "Brown",
    email: "charlie.brown@example.com",
    ip_address: "172.16.0.1",
  };
  console.log("\nAttempting to process invalid contact (bad key prefix):");
  try {
    await processContactData(invalidContactBadKey);
  } catch (e) {
    // Expected error
  }
}

// Run the example
runExample();