require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initSchema } = require('./db');
const { Pool } = require('pg');
const multer = require('multer');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/favicon.ico', (req, res) => res.status(204).end());

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'music_blog',
  password: process.env.DB_PASSWORD || 'password', 
  port: process.env.DB_PORT || 5432,
});

// --- AWS S3 CONFIGURATION ---
const upload = multer({ storage: multer.memoryStorage() });
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

function calculateReadingTime(markdownString) {
  if (!markdownString || markdownString.trim() === '') return '1 min read';

  const totalWords = markdownString.trim().split(/\s+/).length;

  const wpm = 200;
  const minutes = Math.ceil(totalWords / wpm);
  return `${minutes} min read`;
}

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

// ----------------------------------------------------
// ARTICLE ROUTES
// ----------------------------------------------------

app.get('/api/articles', async (req, res) => {
  const { published } = req.query;
  try {
    let query = 'SELECT * FROM cms_articles ORDER BY id DESC';
    if (published === 'true') {
      query = 'SELECT * FROM cms_articles WHERE published = true ORDER BY id DESC';
    }

    const result = await pool.query(query);
    
    const articles = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      theme: row.theme,
      placement: row.placement || 'none',
      keywords: row.keywords,
      description: row.description,
      date: row.publish_date,
      image: row.image,
      readingTime: row.reading_time,
      views: row.views,
      likes: row.likes,
      // Map the DB snake_case to the Frontend camelCase
      markdownContent: row.markdown_content, 
      published: row.published
    }));
    
    res.json({ articles });
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM cms_articles WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Article not found' });
    
    // Increment view count
    pool.query('UPDATE cms_articles SET views = views + 1 WHERE id = $1', [id]);

    const row = result.rows[0];
    res.json({
      id: row.id,
      title: row.title,
      theme: row.theme,
      placement: row.placement || 'none',
      keywords: row.keywords,
      description: row.description,
      date: row.publish_date,
      image: row.image,
      readingTime: row.reading_time,
      views: row.views + 1, // Optimistic view count
      likes: row.likes,
      // Pass the markdown string
      markdownContent: row.markdown_content, 
      published: row.published
    }); 
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    // Notice we inject markdown_content here as an empty string instead of empty JSON
    const result = await pool.query(`
      INSERT INTO cms_articles (title, theme, published, views, likes, markdown_content) 
      VALUES ('Untitled Draft', 'Music', false, 0, 0, '') 
      RETURNING *;
    `);

    const row = result.rows[0];
    
    const newArticle = {
      id: row.id,
      title: row.title,
      theme: row.theme,
      placement: row.placement || 'none',
      keywords: row.keywords,
      description: row.description,
      date: row.publish_date,
      image: row.image,
      readingTime: row.reading_time,
      views: row.views,
      likes: row.likes,
      markdownContent: row.markdown_content, // Map it back
      published: row.published
    };

    res.status(201).json(newArticle);
  } catch (err) {
    console.error('Error creating draft:', err);
    res.status(500).json({ error: 'Failed to create new article draft' });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM cms_articles WHERE id = $1', [id]);
    
    // rowCount tells us if a row was actually found and deleted
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  const b = req.body;
  const placement = b.placement || 'none';
  
  // Pass the new markdown string to our updated calculator function
  const calculatedReadingTime = calculateReadingTime(b.markdownContent);

  try {
    if (placement === 'main') {
      await pool.query(`UPDATE cms_articles SET placement = 'none' WHERE placement = 'main' AND id != $1`, [id]);
    } else if (placement === 'side') {
      await pool.query(`UPDATE cms_articles SET placement = 'none' WHERE placement = 'side' AND id != $1`, [id]);
    }
    
    // Notice $6 is now markdown_content instead of content_blocks
    const result = await pool.query(
      `UPDATE cms_articles SET 
        title = $1, 
        theme = $2,               
        keywords = $3, 
        description = $4, 
        image = $5, 
        markdown_content = $6,    /* <-- Injecting the string */
        published = $7,
        reading_time = $8,
        placement = $9,           
        publish_date = CASE WHEN $7 = true AND publish_date IS NULL THEN CURRENT_DATE ELSE publish_date END,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *`,
      [
        b.title || 'Untitled Draft', 
        b.theme || 'Music',       
        b.keywords || '',
        b.description || '',
        b.image || '',
        b.markdownContent || '',  // <-- Taking the string from Angular
        Boolean(b.published),
        calculatedReadingTime,
        placement,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Article not found in DB' });
    }

    res.json({ message: 'Article updated successfully' });
    
  } catch (err) {
    console.error('❌ Error updating article:', err);
    res.status(500).json({ error: 'Failed to update database' });
  }
});

app.put('/api/articles/:id/like', async (req, res) => {
    const { id } = req.params;
    const { isLiked } = req.body; // true if adding like, false if removing
    
    try {
        const query = isLiked 
            ? 'UPDATE cms_articles SET likes = likes + 1 WHERE id = $1 RETURNING likes'
            : 'UPDATE cms_articles SET likes = GREATEST(likes - 1, 0) WHERE id = $1 RETURNING likes';
            
        const result = await pool.query(query, [id]);
        res.json({ likes: result.rows[0].likes });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update likes' });
    }
});

// ----------------------------------------------------
// REVIEWS ROUTES
// ----------------------------------------------------

// GET Route: Fetch reviews
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

// GET Route: Single Review
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

// POST Route: Image Upload & Compression
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Compress to WebP format
    const compressedImageBuffer = await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const bucketName = process.env.S3_BUCKET_NAME;
    const uniqueFileName = `${Date.now()}-image.webp`; 

    const params = {
      Bucket: bucketName,
      Key: `blog-images/${uniqueFileName}`, 
      Body: compressedImageBuffer,
      ContentType: 'image/webp'
    };

    // Send to S3
    await s3Client.send(new PutObjectCommand(params));

    const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/blog-images/${uniqueFileName}`;

    res.status(200).json({ url: imageUrl });
  } catch (error) {
    console.error("Compression/Upload Error:", error);
    res.status(500).json({ error: 'Failed to process and upload image' });
  }
});

// --- NEW AUDIO UPLOAD ROUTE ---
// Limit audio files to 15MB to protect your AWS bill
const audioUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } 
});

app.post('/api/upload-audio', audioUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    // Optional: Check mime type to ensure it's actually audio
    if (!req.file.mimetype.startsWith('audio/')) {
      return res.status(400).json({ error: 'File must be an audio format.' });
    }

    const bucketName = process.env.S3_BUCKET_NAME;
    // Keep the original extension, but make the filename unique
    const extension = req.file.originalname.split('.').pop();
    const uniqueFileName = `${Date.now()}-track.${extension}`; 

    const params = {
      Bucket: bucketName,
      Key: `blog-audio/${uniqueFileName}`, 
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    // Send straight to S3
    await s3Client.send(new PutObjectCommand(params));

    const audioUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/blog-audio/${uniqueFileName}`;

    res.status(200).json({ url: audioUrl });
  } catch (error) {
    console.error("Audio Upload Error:", error);
    res.status(500).json({ error: 'Failed to upload audio' });
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
        country = $13,
        
        -- MAGIC DATE LOGIC: Stamps today's date ONLY the first time it is published
        publish_date = CASE WHEN $2 = true AND publish_date IS NULL THEN TO_CHAR(NOW(), 'YYYY-MM-DD') ELSE publish_date END,
        
        updated_at = NOW()
      WHERE id = $14`,
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
        b.country || '',          
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

// --- 4. SERVER START ---
const startServer = async () => {
  try {
    console.log('⏳ Connecting to PostgreSQL and verifying schema...');
    
    // Pause the server startup until the tables are successfully created!
    await initSchema(pool);
    console.log('✅ Database schema is fully initialized and ready.');

    // ONLY start accepting Angular requests AFTER the database is ready
    app.listen(port, () => {
      console.log(`\n🚀 Backend Server is officially running!`);
      console.log(`📡 Listening for Angular on: http://localhost:${port}\n`);
    });
    
  } catch (err) {
    console.error('❌ CRITICAL ERROR: Failed to initialize database schema on startup.', err);
    process.exit(1); // Kill the server if the DB fails to build, preventing zombie processes
  }
};

// Execute the startup sequence
startServer();