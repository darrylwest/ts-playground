# Express with Unix Socket

A typescript service to demonstrate unix socket use.  
Creates a http server that responds to various API calls.

## API

```
/ping
/date
/time
```

## Build & Run

```
npm install
npm build
npm start
```

## Test

`curl --unix-socket ./dist/app.sock http://localhost/`


###### dpw | 2025-07-08 | 81UnbyMrTXtu
