// /db/models/chatSession.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ChatSession = sequelize.define('ChatSession', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
    startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'chat_sessions',
    timestamps: false
});

module.exports = ChatSession;
