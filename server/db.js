require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : false,
});

const initSchema = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_reviews (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255),
        album VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        image TEXT,
        release_date INT,
        label VARCHAR(255),
        genre VARCHAR(255),
        subgenres VARCHAR(255),
        description TEXT,
        context TEXT,
        introduction TEXT,
        breakdown JSONB DEFAULT '[]',
        conclusion TEXT,
        similar_albums JSONB DEFAULT '[]',
        comments JSONB DEFAULT '[]',
        score NUMERIC DEFAULT NULL,
        published BOOLEAN DEFAULT FALSE,
        tracklist JSONB DEFAULT '[]',
        total_duration VARCHAR(50),
        producer VARCHAR(255),
        recorded_at VARCHAR(255),
        country VARCHAR(100),
        publish_date VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_list_meta (
        id SERIAL PRIMARY KEY,
        review_id INT NOT NULL REFERENCES cms_reviews(id) ON DELETE CASCADE,
        album VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        year INT NOT NULL,
        image TEXT,
        description TEXT,
        date VARCHAR(50),
        genres VARCHAR(255),
        subgenres VARCHAR(255),
        country VARCHAR(100),
        score NUMERIC DEFAULT NULL,
        published BOOLEAN DEFAULT FALSE,
        UNIQUE(review_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_articles (
        id SERIAL PRIMARY KEY,
        publish_date DATE,
        reading_time VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        theme VARCHAR(100),
        keywords VARCHAR(255),
        description TEXT,
        image TEXT,
        content_blocks JSONB DEFAULT '[]',
        published BOOLEAN DEFAULT FALSE,
        placement VARCHAR(50) DEFAULT 'none',
        views INT DEFAULT 0,
        likes INT DEFAULT 0,
        comments JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Database schema verified/created successfully.');
  } finally {
    client.release();
  }
};

module.exports = { pool, initSchema };
