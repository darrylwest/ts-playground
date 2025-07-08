import Keyv from 'keyv';
import { KeyvFile } from 'keyv-file';
import { config } from './config';

const keyv = new Keyv({
  store: new KeyvFile({
    filename: config.dataPath,
  }),
});

keyv.on('error', err => console.error('Keyv connection error:', err));

export { keyv };
