const bcrypt = require('bcryptjs');

// ❗ Put the password you want to use here
const password = 'voidpass123.'; 

// This will generate and print a secure hash
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('Your Hashed Password Is:');
console.log(hash);