const fs = require('fs');
const ConvertApi = require('convertapi');

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/CONVERTAPI_SECRET=(.+)/);
if (!match) throw new Error('Secret not found');
const secret = match[1].trim();

const ca = ConvertApi(secret);

console.log(ca);
