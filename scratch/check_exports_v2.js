const convertapi = require('convertapi');
console.log('ConvertAPI type:', typeof convertapi.ConvertApi);
console.log('ConvertAPI (all caps) type:', typeof convertapi.ConvertAPI);
console.log('default type:', typeof convertapi.default);
const inst = new convertapi.ConvertApi('test');
console.log('Instance created with ConvertApi');
