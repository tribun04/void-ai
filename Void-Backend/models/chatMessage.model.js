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
        type: DataTypes.ENUM('user', 'agent', 'system', 'ai'),
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id',
        },
        allowNull: false,
    },
    tenantId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Tenants',
            key: 'id',
        },
        allowNull: false,
    },
    sessionId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'ChatSessions',
            key: 'id',
        },
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'chat_messages',
    timestamps: false // because we manually set createdAt
});

module.exports = ChatMessage;
