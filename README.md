# TypeScript Playground
# Pluggable Web Application

## 

I need to create a full stack web app using tRPC for client and server in a mono-repo.  

The project layout is **mono-repo** and would look something like this

```
medcal
├── CLAUDE.md
├── node_modules
├── package.json
├── packages
│   ├── client
│   │   ├── dist
│   │   │   ├── client
│   │   │   └── server
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── public
│   │   │   └── css
│   │   │   └── images
│   │   ├── src
│   │   │   ├── assets
│   │   │   │   └── css
│   │   │   │   └── images
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   └── server
│       ├── package.json
│       ├── src
│       │   ├── index.ts
│       │   └── router.ts
│       └── tsconfig.json
├── README.md
└── tsconfig.json
```

The html, css, and images will be served from a public folder? _Whatever is standard for Vue3 applications._

## Primary Goals

* flexibility: swap logic modules with a minimum of side effects
* engineering specialties: assign tasks to engineers with a limited scope

[System Diagram](docs/system-diagram.md) | 


## Node/Typescript Dependencies

* nodemon for the server dev mode
* vite for the client dev mode
* typescript
* tRPC for client/server and server-to-server
* zod for model validation
* eslint
* jest unit tests + coverage
* prettier
* winston and winston-daily-rotate-file for logging json 
* iovalkey for database
* dotenvx
* cors
* date-fns
* nodemon for the server (development)
* pm2 for production cluster

## Other Depandencies

* github actions

Notes:

* use mono repo with packages/client packages/server

Direct Function Calls: When both your main server application and your Firebase wrapper are part of the same server package (and thus the same Node.js process), createCallerFactory() allows you to call the tRPC procedures of your wrapper directly, without any HTTP or network overhead. It's like calling a local function.

End-to-End Type Safety: By having the tRPC router definitions for your wrapper within the server package, any other part of your server (or even your client, if you configure it to import types) can benefit from compile-time type checking and auto-completion for these calls.

Simplified Monorepo Management: It keeps related server-side logic co-located and makes dependency management straightforward within your monorepo.

###### dpw | 2025-07-21



```
 _______                     _______             __         __ 
|_     _|.--.--.-----.-----.|     __|.----.----.|__|.-----.|  |_ 
  |   |  |  |  |  _  |  -__||__     ||  __|   _||  ||  _  ||   _|
  |___|  |___  |   __|_____||_______||____|__|  |__||   __||____|
         |_____|__|                                 |__|
 ______ __                                                __ 
|   __ \  |.---.-.--.--. .-----.----.-----.--.--.-----.--|  |
|    __/  ||  _  |  |  | |  _  |   _|  _  |  |  |     |  _  |
|___|  |__||___._|___  | |___  |__| |_____|_____|__|__|_____|
                 |_____| |_____|                             
```

A collection of small typescript test cases.

## Projects

* Unix Sockets - with date-tns tests
* txkey
* sock-server
* zod-models
* ts-rpc

###### dpw | 2025-07-10 | 81UnbyMrTXtu
