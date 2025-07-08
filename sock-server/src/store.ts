import Keyv from 'keyv';
import { config } from './config';

const keyv = new Keyv({ 
  uri: `file://${config.dataPath}`,
  // store: new (require('keyv-file'))({
  //   filename: config.dataPath,
  // })
});

keyv.on('error', err => console.error('Keyv connection error:', err));

export default keyv;
