const { Sequelize, DataTypes } = require('sequelize');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const isSQLite = (process.env.DB_CLIENT && process.env.DB_CLIENT.toLowerCase() === 'sqlite') || !!process.env.DB_PATH;

let sequelize;
let createDatabaseIfNotExists = async () => {};

if (isSQLite) {
    const storagePath = path.resolve(process.cwd(), process.env.DB_PATH || 'database/yuan_world.sqlite');
    fs.mkdirSync(path.dirname(storagePath), { recursive: true });

    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: storagePath,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    });
} else {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME || 'yuan_world',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
    };

    createDatabaseIfNotExists = async () => {
        const client = new Client({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.username,
            password: dbConfig.password,
            database: 'postgres'
        });

        try {
            await client.connect();
            const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbConfig.database]);

            if (result.rowCount === 0) {
                await client.query(`CREATE DATABASE ${dbConfig.database}`);
                console.log(`Database ${dbConfig.database} created`);
            } else {
                console.log(`Database ${dbConfig.database} already exists`);
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.error('Could not connect to PostgreSQL. Please ensure the service is running.');
                throw new Error('PostgreSQL service unavailable');
            }
            throw error;
        } finally {
            await client.end();
        }
    };

    sequelize = new Sequelize({
        dialect: 'postgres',
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        username: dbConfig.username,
        password: dbConfig.password,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    });
}

const ensureSqliteTemplateIdIsNullable = async () => {
    if (!isSQLite) {
        return;
    }

    const [columns] = await sequelize.query("PRAGMA table_info('generations')");
    if (!Array.isArray(columns) || columns.length === 0) {
        return;
    }

    const templateColumn = columns.find((column) => column.name === 'template_id');
    if (!templateColumn || templateColumn.notnull === 0) {
        return;
    }

    console.log('Detected NOT NULL on generations.template_id, rebuilding table to allow NULL...');

    const queryInterface = sequelize.getQueryInterface();

    const columnDefinitions = {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        template_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'templates',
                key: 'id'
            },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL'
        },
        original_image_url: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        preview_image_url: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        high_quality_image_url: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
            allowNull: false,
            defaultValue: 'pending'
        },
        generation_type: {
            type: DataTypes.ENUM('preview', 'high_quality'),
            allowNull: false
        },
        task_id: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        processing_time: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        is_paid: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        payment_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    };

    const columnList = Object.keys(columnDefinitions).join(', ');

    await sequelize.transaction(async (transaction) => {
        await sequelize.query('PRAGMA foreign_keys=OFF;', { transaction });

        try {
            await queryInterface.dropTable('_tmp_generations', { transaction });
        } catch (cleanupError) {
            // ignore
        }

        await queryInterface.createTable('_tmp_generations', columnDefinitions, { transaction });

        await sequelize.query(
            `INSERT INTO _tmp_generations (${columnList}) SELECT ${columnList} FROM generations;`,
            { transaction }
        );

        await queryInterface.dropTable('generations', { transaction });
        await queryInterface.renameTable('_tmp_generations', 'generations', { transaction });

        const recreateIndex = async (fields, name) => {
            try {
                await queryInterface.addIndex('generations', fields, { name, transaction });
            } catch (indexError) {
                console.warn(`Unable to recreate index ${name}:`, indexError.message || indexError);
            }
        };

        await recreateIndex(['user_id'], 'generations_user_id');
        await recreateIndex(['status'], 'generations_status');
        await recreateIndex(['created_at'], 'generations_created_at');

        await sequelize.query('PRAGMA foreign_keys=ON;', { transaction });
    });

    console.log('SQLite generations table rebuilt: template_id now allows NULL values.');
};

const ensureSchemaAdjustments = async () => {
    if (isSQLite) {
        return;
    }

    const queryInterface = sequelize.getQueryInterface();

    try {
        await queryInterface.changeColumn('generations', 'template_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Optional template ID for freestyle mode'
        });
    } catch (error) {
        const message = String(error && error.message ? error.message : error);
        if (!/no such table/i.test(message) && !/does not exist/i.test(message)) {
            console.warn('Unable to adjust generations.template_id column:', message);
        }
    }
};

const connectDatabase = async () => {
    try {
        if (!isSQLite) {
            await createDatabaseIfNotExists();
        }

        await sequelize.authenticate();
        console.log('Database connection established');

        if (isSQLite) {
            await ensureSqliteTemplateIdIsNullable();
        }

        const syncOptions = {};
        if (process.env.DB_SYNC_FORCE === 'true') {
            syncOptions.force = true;
        } else if (process.env.DB_AUTO_MIGRATE === 'true' || isSQLite) {
            syncOptions.alter = true;
        }

        await sequelize.sync(syncOptions);
        console.log('Database schema synced');

        await ensureSchemaAdjustments();
    } catch (error) {
        console.error('Failed to connect database:', error.message || error);
        throw error;
    }
};

module.exports = {
    sequelize,
    connectDatabase
};
