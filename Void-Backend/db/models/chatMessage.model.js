// /db/models/chatMessage.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    sender: {
        type: DataTypes.STRING,
        allowNull: false, // 'user' or 'ai'
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users', // Name of the User table
            key: 'id',
        },
        allowNull: false,
    }
});

module.exports = ChatMessage;