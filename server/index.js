import express from 'express';
import cors from 'cors';
import { pool, initSchema } from './db.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const API_BASE = process.env.API_BASE_PATH || '/api';

app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

function rowToReview(row) {
  return {
    id: row.id,
    slug: row.slug || undefined,
    album: row.album,
    artist: row.artist,
    image: row.image || '',
    releaseDate: row.release_date,
    label: row.label || '',
    genre: row.genre || '',
    description: row.description || '',
    context: row.context || '',
    introduction: row.introduction || '',
    breakdown: Array.isArray(row.breakdown) ? row.breakdown : (row.breakdown && typeof row.breakdown === 'object' ? row.breakdown : []),
    conclusion: row.conclusion || '',
    similarAlbums: Array.isArray(row.similar_albums) ? row.similar_albums : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
  };
}

function rowToListMeta(row) {
  return {
    id: row.id,
    album: row.album,
    artist: row.artist,
    year: row.year,
    image: row.image || '',
    description: row.description || '',
    date: row.date || '',
    genres: row.genres || '',
    subgenres: row.subgenres || '',
    country: row.country || '',
  };
}

app.get(`${API_BASE}/reviews`, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cms_reviews ORDER BY id ASC'
    );
    const reviews = result.rows.map(rowToReview);
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get(`${API_BASE}/reviews/list`, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.review_id AS id, m.album, m.artist, m.year, m.image, m.description, m.date, m.genres, m.subgenres, m.country
      FROM cms_list_meta m
      ORDER BY m.review_id ASC
    `);
    const listMeta = result.rows.map(rowToListMeta);
    res.json(listMeta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get(`${API_BASE}/reviews/:id`, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const result = await pool.query('SELECT * FROM cms_reviews WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rowToReview(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post(`${API_BASE}/reviews`, async (req, res) => {
  const b = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO cms_reviews (
        slug, album, artist, image, release_date, label, genre,
        description, context, introduction, breakdown, conclusion,
        similar_albums, comments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        b.slug || null,
        b.album || '',
        b.artist || '',
        b.image || '',
        b.releaseDate != null ? Number(b.releaseDate) : null,
        b.label || '',
        b.genre || '',
        b.description || '',
        b.context || '',
        b.introduction || '',
        JSON.stringify(b.breakdown || []),
        b.conclusion || '',
        JSON.stringify(b.similarAlbums || []),
        JSON.stringify(b.comments || []),
      ]
    );
    const review = rowToReview(result.rows[0]);
    await pool.query(
      `INSERT INTO cms_list_meta (review_id, album, artist, year, image, description, date, genres, subgenres, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (review_id) DO UPDATE SET
         album = EXCLUDED.album, artist = EXCLUDED.artist, year = EXCLUDED.year,
         image = EXCLUDED.image, description = EXCLUDED.description, date = EXCLUDED.date,
         genres = EXCLUDED.genres, subgenres = EXCLUDED.subgenres, country = EXCLUDED.country`,
      [
        review.id,
        review.album,
        review.artist,
        review.releaseDate != null ? Number(review.releaseDate) : new Date().getFullYear(),
        review.image,
        review.description.slice(0, 500),
        new Date().toISOString().slice(0, 10),
        review.genre,
        '',
        '',
      ]
    );
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put(`${API_BASE}/reviews/:id`, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const b = req.body;
  try {
    const result = await pool.query(
      `UPDATE cms_reviews SET
        slug = COALESCE($2, slug),
        album = COALESCE($3, album),
        artist = COALESCE($4, artist),
        image = COALESCE($5, image),
        release_date = COALESCE($6, release_date),
        label = COALESCE($7, label),
        genre = COALESCE($8, genre),
        description = COALESCE($9, description),
        context = COALESCE($10, context),
        introduction = COALESCE($11, introduction),
        breakdown = COALESCE($12, breakdown),
        conclusion = COALESCE($13, conclusion),
        similar_albums = COALESCE($14, similar_albums),
        comments = COALESCE($15, comments),
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [
        id,
        b.slug,
        b.album,
        b.artist,
        b.image,
        b.releaseDate != null ? Number(b.releaseDate) : null,
        b.label,
        b.genre,
        b.description,
        b.context,
        b.introduction,
        b.breakdown != null ? JSON.stringify(b.breakdown) : null,
        b.conclusion,
        b.similarAlbums != null ? JSON.stringify(b.similarAlbums) : null,
        b.comments != null ? JSON.stringify(b.comments) : null,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const review = rowToReview(result.rows[0]);
    await pool.query(
      `INSERT INTO cms_list_meta (review_id, album, artist, year, image, description, date, genres, subgenres, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (review_id) DO UPDATE SET
         album = EXCLUDED.album, artist = EXCLUDED.artist, year = EXCLUDED.year,
         image = EXCLUDED.image, description = EXCLUDED.description, date = EXCLUDED.date,
         genres = EXCLUDED.genres, subgenres = EXCLUDED.subgenres, country = EXCLUDED.country`,
      [
        review.id,
        review.album,
        review.artist,
        review.releaseDate != null ? Number(review.releaseDate) : new Date().getFullYear(),
        review.image,
        (review.description || '').slice(0, 500),
        new Date().toISOString().slice(0, 10),
        review.genre,
        '',
        '',
      ]
    );
    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete(`${API_BASE}/reviews/:id`, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const result = await pool.query('DELETE FROM cms_reviews WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get(`${API_BASE}/cms`, async (req, res) => {
  try {
    const [reviewsRes, listRes] = await Promise.all([
      pool.query('SELECT * FROM cms_reviews ORDER BY id ASC'),
      pool.query('SELECT * FROM cms_list_meta ORDER BY id ASC'),
    ]);
    const reviews = reviewsRes.rows.map(rowToReview);
    const listMeta = listRes.rows.map((r) => ({
      id: r.review_id,
      album: r.album,
      artist: r.artist,
      year: r.year,
      image: r.image || '',
      description: r.description || '',
      date: r.date || '',
      genres: r.genres || '',
      subgenres: r.subgenres || '',
      country: r.country || '',
    }));
    res.json({ reviews, listMeta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CMS API running at http://localhost:${PORT}${API_BASE}`);
    });
  })
  .catch((err) => {
    console.error('DB init failed:', err);
    process.exit(1);
  });