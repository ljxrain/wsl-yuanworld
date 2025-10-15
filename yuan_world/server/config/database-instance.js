const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbConfig = {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'yuan_world',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    logging: console.log,
};

const sequelize = new Sequelize(dbConfig);

module.exports = { sequelize };










