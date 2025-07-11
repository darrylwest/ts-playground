import { exec, ExecException } from 'child_process';
import { promisify } from 'util';

// Promisify exec for easier async/await usage
const execPromise = promisify(exec);

// Path to your compiled 'txkey' executable
// Make sure this path is correct for your development and production environments!
// For example:
// On Ubuntu/macOS: '/usr/local/bin/txkey'
const TXKEY_EXECUTABLE_PATH = '/usr/local/bin/txkey'; // or look up from config

export async function createRouteKey(prefix: string): Promise<string> {
    const txKey = await createTxKey(TXKEY_EXECUTABLE_PATH);
    return `${prefix}:${txKey}`;
}

/**
 * Generates a key by invoking an external 'txkey' executable.
 * The 'txkey' executable is expected to take arguments and print the
 * generated key to standard output (stdout).
 *
 * @param path The path to the 'txkey' executable. This should be the full path to the binary.
 * @param args An optional array of strings representing the arguments to pass to 'txkey'.
 * @returns A Promise that resolves with the generated key string from stdout.
 * @throws An error if the executable fails or returns no output.
 */
export async function createTxKey(path: string, args: string[] = []): Promise<string> {
    // Construct the command string.
    // Ensure arguments are properly quoted if they might contain spaces or special characters.
    // For a simple string like '81WPUUnaM3Fn', quoting might not be strictly necessary,
    // but it's good practice for robustness.
    const command = `${TXKEY_EXECUTABLE_PATH} ${args.map(arg => `'${arg}'`).join(' ')}`;

    try {
        const { stdout, stderr } = await execPromise(command);

        if (stderr) {
            console.warn(`'txkey' executable produced stderr: ${stderr.trim()}`);
            // Depending on your txkey, stderr might indicate non-fatal warnings
            // or critical errors. You might want to throw an error here if stderr indicates failure.
        }

        const key = stdout.trim(); // Remove any leading/trailing whitespace, especially newlines

        if (!key) {
            throw new Error(`'txkey' executable returned no output.`);
        }

        return key;

    } catch (error: any) {
        // execPromise wraps the original ExecException in a generic Error type.
        // We can cast back to ExecException to get error.code, error.signal, etc.
        const execError = error as ExecException;
        console.error(`Error executing 'txkey': ${execError.message}`);
        if (execError.code !== undefined) {
            console.error(`Exit code: ${execError.code}`);
        }
        if (execError.signal !== undefined) {
            console.error(`Signal: ${execError.signal}`);
        }
        if (execError.stderr) {
            console.error(`Stderr: ${execError.stderr.trim()}`);
        }
        // Re-throw a more informative error for the caller
        throw new Error(`Failed to generate key using external 'txkey' executable. Details: ${execError.message}`);
    }
}

// Export the executable path for configuration purposes
export { TXKEY_EXECUTABLE_PATH };
