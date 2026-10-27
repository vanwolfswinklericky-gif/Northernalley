const crypto = require('node:crypto');
const fs = require('node:fs');

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1', // P-256
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync('private.pem', privateKey, { mode: 0o600 });
fs.writeFileSync('public.pem', publicKey);

console.log('Generated private.pem and public.pem');