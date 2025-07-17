# e2e Client

## Steps

### Project Setup

```base
mkdir e2e-client
cd e2e-client
npm init -y
npm install typescript node-fetch @types/node-fetch --save-dev
npm install @types/node --save-dev # if you need node types
tsc --init # Initialize tsconfig.json
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### src/client.ts

