const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid'); // We'll use UUID for unique IDs

// --- Users to Create/Update ---
// You can add more users to this array to create them all at once.
const usersToManage = [
  {
    email: 'void@shigjeta.com',
    password: 'shigjeta321', // Choose a strong password
    name: 'Void Superadministrator',
    role: 'superadmin' // The new, top-level role
  },
  {
    email: 'admin@void.com',
    password: 'void123.', // The password for your existing admin
    name: 'Admin Supervisor',
    role: 'admin'
  },
  {
    email: 'voidagen@shigjeta.com',
    password: 'shigjeta321', // A password for a new agent
    name: 'Agent Void',
    role: 'agent'
  }
];

// --- Script Logic ---
const usersFilePath = path.join(__dirname, './data/users.json');

function manageUsers() {
  console.log('--- User Management Script ---');

  let users = [];
  
  // 1. Check if users.json already exists and load it
  if (fs.existsSync(usersFilePath)) {
    try {
      const fileContent = fs.readFileSync(usersFilePath, 'utf-8');
      users = JSON.parse(fileContent);
      console.log(`Loaded existing users.json with ${users.length} users.`);
    } catch (e) {
        console.error("Error parsing users.json, starting with an empty list.", e)
        users = []
    }
  }

  // 2. Iterate through the users we want to manage
  for (const userToCreate of usersToManage) {
    const { email, password, name, role } = userToCreate;
    
    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const existingUserIndex = users.findIndex(u => u.email === email);
    
    if (existingUserIndex !== -1) {
      // If user exists, update their details
      console.log(`Updating user: ${email}`);
      users[existingUserIndex] = {
        ...users[existingUserIndex], // Keep existing ID
        name,
        passwordHash, // Update the hash in case the password changed
        role,
      };
    } else {
      // If user does not exist, create a new one
      console.log(`Creating new user: ${email}`);
      users.push({
        id: uuidv4(), // Generate a unique ID for the new user
        email,
        passwordHash,
        name,
        role,
      });
    }
  }
  
  // 3. Write the updated user list back to the file
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  console.log(`✅ Successfully updated 'data/users.json'.`);
  console.log('----------------------------');
}

// --- Dependencies Check ---
try {
    require.resolve('uuid');
    // Run the main function if dependencies are met
    manageUsers();
} catch (e) {
    console.error("Dependency 'uuid' not found. Please run 'npm install uuid' first, then run this script again.");
}