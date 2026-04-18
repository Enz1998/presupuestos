const ConvertApi = require('convertapi');
const ca = ConvertApi('test'); // invalid key but check if method exists
console.log('Upload exists:', typeof ca.upload);
