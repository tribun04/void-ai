// /db/models/user.model.js

const { DataTypes } = require('sequelize');
// Make sure this path correctly points to your Sequelize config file
const sequelize = require('../../config/database'); 

const User = sequelize.define('User', {
    // --- Core Fields ---
    id: {
        type: DataTypes.UUID, // Using UUID is great for tenant IDs
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    companyName: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null for enterprise inquiries if needed
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    // The model field should be named 'passwordHash' to match the controller
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('agent', 'admin', 'superadmin'),
        defaultValue: 'agent',
        allowNull: false,
    },
    
    // --- Subscription and Payment Fields ---
    planName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false,
    },

    // You can keep these other fields if they are part of your design
    activationCode: { type: DataTypes.STRING },
    is_online: { type: DataTypes.BOOLEAN, defaultValue: false }

}, {
    // This ensures your table name in the database is 'users'
    tableName: 'users',
    // This prevents Sequelize from creating createdAt and updatedAt columns if you don't need them
    timestamps: true, // Set to 'false' if you don't have createdAt/updatedAt
});

module.exports = User;