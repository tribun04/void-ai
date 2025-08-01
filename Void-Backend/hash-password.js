// hash-password.js
const bcrypt = require('bcryptjs');

const plainPassword = process.argv[2]; // Get the password from the command line

if (!plainPassword) {
    console.error('Please provide a password to hash.');
    console.log('Usage: node hash-password.js "your_password_here"');
    process.exit(1);
}

const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(plainPassword, salt);

console.log('Your plain password:', plainPassword);
console.log('Your HASHED password (copy this):', hashedPassword);