// File: db/models/AiTraining.js

const { DataTypes } = require('sequelize');
const sequelize = require('../mysql');

const AiTraining = sequelize.define('AiTraining', {
    tenant_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    question: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
});

module.exports = AiTraining;
