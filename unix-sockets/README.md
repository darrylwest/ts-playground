# Express with Unix Socket

A typescript service to demonstrate unix socket use.  
Creates a http server that responds to various API calls.

## API

```
/ping
/date
/time
/iso
/api/get/:key
```

## Build & Run

```
npm install
npm build
npm start
```

## Test

`curl --unix-socket ./dist/app.sock http://localhost/`

## References

* [date-fms docs](https://date-fns.org/v4.1.0/docs/Getting-Started)
* [Datetime Format Tokens](https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table)
* [zod validation](https://zod.dev/)

###### dpw | 2025-07-08 | 81UnbyMrTXtu
