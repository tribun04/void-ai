const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// --- Configuration ---
const adminEmail = 'admin@bank.com';
const adminPassword = 'voidpass123.'; // The password you want to use
const adminName = 'Void Admin';
const adminRole = 'admin';

// --- Script Logic ---
const usersFilePath = path.join(__dirname, './data/users.json');

function createAdminUser() {
  console.log('--- Creating Admin User ---');

  // 1. Hash the password securely
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(adminPassword, salt);
  console.log(`Password hashed successfully.`);

  // 2. Define the new admin user object
  const adminUser = {
    id: 'admin001',
    email: adminEmail,
    passwordHash: passwordHash, // Store the HASH, not the plain password
    name: adminName,
    role: adminRole,
  };

  let users = [];
  
  // 3. Check if users.json already exists
  if (fs.existsSync(usersFilePath)) {
    const fileContent = fs.readFileSync(usersFilePath, 'utf-8');
    users = JSON.parse(fileContent);
    console.log(`Found existing users.json with ${users.length} users.`);
  }

  // 4. Check if the admin user already exists to avoid duplicates
  const existingAdminIndex = users.findIndex(u => u.email === adminEmail);
  if (existingAdminIndex !== -1) {
    // If admin exists, update their details
    console.log(`Admin with email ${adminEmail} already exists. Updating details...`);
    users[existingAdminIndex] = adminUser;
  } else {
    // If admin does not exist, add them to the list
    console.log(`Admin with email ${adminEmail} not found. Adding new admin...`);
    users.push(adminUser);
  }
  
  // 5. Write the updated user list back to the file
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  console.log(`✅ Successfully created/updated admin user in 'data/users.json'.`);
  console.log('-------------------------');
}

// Run the function
createAdminUser();