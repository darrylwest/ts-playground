# Typescript Domain Keys
 
## DomainKey class

The DomainKey class generates a base62 key unique to a specific domain. It has these features:

* used as unique id in domain models
* uses crypto to generate random numbers
* uses process.hrtime.bigint() for high res nano second clock
* always generates 16 characters
* sortable, new keys always increase (dt + random)

## Dependencies

* node.js
* ts-node
* jest for unit tests
* base62 

## Proposed Use

import { createDomainKey } from 'domainkey';

const key: string = createDomainKey();

console.log('key: ' + key);

###### dpw | 2025-07-10 | 81WKMfCmUsWs
