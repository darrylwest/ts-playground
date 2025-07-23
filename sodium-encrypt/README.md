# Sodium Encrypt/Decrypt

## Project

* create a stand-alone project
* compile with `bun` to binary

## Example Code

```typescript
import libsodium from 'libsodium-wrappers';

// ... key loading logic as before ...
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'base64');

async function encryptWithLibsodium(text: string): Promise<string> {
    await libsodium.ready; // Ensure the library is initialized
    
    // Nonce must be unique for each message
    const nonce = libsodium.randombytes_buf(libsodium.crypto_secretbox_NONCEBYTES);
    
    const encrypted = libsodium.crypto_secretbox_easy(text, nonce, ENCRYPTION_KEY);
    
    // Combine nonce and encrypted data for storage (as Base64)
    return `${Buffer.from(nonce).toString('base64')}:${Buffer.from(encrypted).toString('base64')}`;
}

async function decryptWithLibsodium(encryptedText: string): Promise<string> {
    await libsodium.ready;

    const [nonceB64, encryptedB64] = encryptedText.split(':');
    const nonce = Buffer.from(nonceB64, 'base64');
    const encrypted = Buffer.from(encryptedB64, 'base64');
    
    const decryptedBytes = libsodium.crypto_secretbox_open_easy(encrypted, nonce, ENCRYPTION_KEY);
    
    return Buffer.from(decryptedBytes).toString('utf8');
}
```

###### dpw | 2025.07.23
