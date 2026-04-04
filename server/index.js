const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/favicon.ico', (req, res) => res.status(204).end());

const pool = new Pool({
  user: 'postgres',        // Usually 'postgres'
  host: 'localhost',
  database: 'music_blog',  // The name of your database
  password: 'password',    // Your postgres password
  port: 5432,
});

function rowToReview(row) {
  return {
    id: row.id,
    album: row.album,
    artist: row.artist,
    image: row.image,
    releaseDate: row.release_date ? String(row.release_date) : '',
    year: row.release_date,
    genre: row.genre,
    subgenres: row.subgenres,
    country: row.country || '',
    description: row.description || '',
    
    slug: row.slug,
    label: row.label,
    date: row.publish_date || '',
    tracklist: typeof row.tracklist === 'string' ? JSON.parse(row.tracklist) : (row.tracklist || []),
    totalDuration: row.total_duration || '',
    producer: row.producer || '',
    recordedAt: row.recorded_at || '',
    similarAlbums: typeof row.similar_albums === 'string' ? JSON.parse(row.similar_albums) : (row.similar_albums || []),
    
    context: row.context || '',
    introduction: row.introduction || '',
    breakdown: typeof row.breakdown === 'string' ? JSON.parse(row.breakdown) : (row.breakdown || []),
    conclusion: row.conclusion || '',
    score: row.score != null ? Number(row.score) : null,
    published: Boolean(row.published),
    
    comments: typeof row.comments === 'string' ? JSON.parse(row.comments) : (row.comments || []),
    
    
  };
}

// 5. GET Route: Fetch reviews
app.get('/api/reviews', async (req, res) => {
  const { published } = req.query;
  try {
    let query = 'SELECT * FROM cms_reviews ORDER BY id DESC';
    
    // If the frontend asks for ?published=true (like the Home Page), filter it
    if (published === 'true') {
      query = 'SELECT * FROM cms_reviews WHERE published = true ORDER BY id DESC';
    }

    const result = await pool.query(query);
    const reviews = result.rows.map(rowToReview);
    res.json({ reviews });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Database error fetching reviews' });
  }
});

app.get('/api/reviews/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM cms_reviews WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Review not found' });
    
    // Uses the rowToReview function to format it perfectly for your Angular frontend
    res.json(rowToReview(result.rows[0])); 
  } catch (err) {
    console.error('Error fetching single review:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/reviews/:id', async (req, res) => {
  const { id } = req.params;
  const b = req.body;

  try {
    await pool.query(
      `UPDATE cms_reviews SET 
        score = $1, 
        published = $2, 
        introduction = $3, 
        conclusion = $4, 
        breakdown = $5::jsonb,
        description = $6,
        image = $7,
        context = $8,
        tracklist = $9::jsonb,
        total_duration = $10,
        producer = $11,
        recorded_at = $12,
        
        -- MAGIC DATE LOGIC: Stamps today's date ONLY the first time it is published
        publish_date = CASE WHEN $2 = true AND publish_date IS NULL THEN TO_CHAR(NOW(), 'YYYY-MM-DD') ELSE publish_date END,
        
        updated_at = NOW()
      WHERE id = $13`,
      [
        b.score != null ? Number(b.score) : null,
        Boolean(b.published),
        b.introduction || '',
        b.conclusion || '',
        JSON.stringify(b.breakdown || []),
        b.description || '',
        b.image || '',
        b.context || '',
        JSON.stringify(b.tracklist || []), 
        b.totalDuration || '',             
        b.producer || '',                  
        b.recordedAt || '',                
        id
      ]
    );

    await pool.query(
      `UPDATE cms_list_meta SET 
        score = $1, 
        published = $2,
        date = (SELECT publish_date FROM cms_reviews WHERE id = $3)
       WHERE review_id = $3`,
      [
        b.score != null ? Number(b.score) : null,
        Boolean(b.published),
        id
      ]
    );

    res.json({ message: 'Review updated successfully' });
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ error: 'Failed to update database' });
  }
});

// 7. THE MISSING PIECE: Tell the server to listen!
app.listen(port, () => {
  console.log(`\n🚀 Backend Server is officially running!`);
  console.log(`📡 Listening for Angular on: http://localhost:${port}\n`);
});