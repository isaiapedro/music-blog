import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'music-app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
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
        description TEXT,
        context TEXT,
        introduction TEXT,
        breakdown JSONB DEFAULT '[]',
        conclusion TEXT,
        similar_albums JSONB DEFAULT '[]',
        comments JSONB DEFAULT '[]',
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
        UNIQUE(review_id)
      );
    `);
  } finally {
    client.release();
  }
};

export { pool, initSchema };
