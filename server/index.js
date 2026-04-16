require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const sharp = require('sharp');
const jwt = require('jsonwebtoken');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { pool, initSchema } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:4200'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- AUTH MIDDLEWARE ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  jwt.verify(token, process.env.JWT_SECRET, (err) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    next();
  });
}

// --- AUTH ROUTE ---
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password.' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
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

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function uniqueSlug(pool, table, baseSlug, excludeId = null) {
  let slug = baseSlug;
  let count = 1;
  while (true) {
    const query = excludeId
      ? `SELECT id FROM ${table} WHERE slug = $1 AND id != $2`
      : `SELECT id FROM ${table} WHERE slug = $1`;
    const params = excludeId ? [slug, excludeId] : [slug];
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return slug;
    slug = `${baseSlug}-${count++}`;
  }
}

function calculateReadingTime(contentBlocks) {
  if (!contentBlocks || contentBlocks.length === 0) return '1 min read';
  
  let totalWords = 0;
  contentBlocks.forEach(block => {
    if ((block.type === 'paragraph' || block.type === 'heading') && block.content) {
      // Split by spaces to count words
      totalWords += block.content.trim().split(/\s+/).length;
    }
  });

  const wpm = 200; // Average words per minute
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

function rowToArticle(row) {
  return {
    id: row.id,
    slug: row.slug,
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
    contentBlocks: row.content_blocks,
    published: row.published
  };
}

app.get('/api/articles', async (req, res) => {
  const { published } = req.query;
  try {
    let query = 'SELECT * FROM cms_articles ORDER BY id DESC';
    if (published === 'true') {
      query = 'SELECT * FROM cms_articles WHERE published = true ORDER BY id DESC';
    }
    const result = await pool.query(query);
    res.json({ articles: result.rows.map(rowToArticle) });
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Supports both slug and legacy numeric id — numeric id returns 301 redirect to slug URL
app.get('/api/articles/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const isNumeric = /^\d+$/.test(slug);
    const query = isNumeric
      ? 'SELECT * FROM cms_articles WHERE id = $1'
      : 'SELECT * FROM cms_articles WHERE slug = $1';
    const result = await pool.query(query, [slug]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Article not found' });

    const row = result.rows[0];

    // Redirect old numeric-id URLs to slug URL
    if (isNumeric && row.slug) {
      return res.redirect(301, `/api/articles/${row.slug}`);
    }

    pool.query('UPDATE cms_articles SET views = views + 1 WHERE id = $1', [row.id]);
    res.json({ ...rowToArticle(row), views: row.views + 1 });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/articles', authenticateToken, async (req, res) => {
  try {
    const baseSlug = await uniqueSlug(pool, 'cms_articles', 'untitled-draft');
    const result = await pool.query(`
      INSERT INTO cms_articles (title, slug, theme, published, views, likes, content_blocks)
      VALUES ('Untitled Draft', $1, 'Music', false, 0, 0, '[]'::jsonb)
      RETURNING *;
    `, [baseSlug]);

    res.status(201).json(rowToArticle(result.rows[0]));
  } catch (err) {
    console.error('Error creating draft:', err);
    res.status(500).json({ error: 'Failed to create new article draft' });
  }
});

app.delete('/api/articles/:id', authenticateToken, async (req, res) => {
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

app.put('/api/articles/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const b = req.body;
  const placement = b.placement || 'none';
  const calculatedReadingTime = calculateReadingTime(b.contentBlocks);

  try {
    const newSlug = await uniqueSlug(pool, 'cms_articles', generateSlug(b.title || 'untitled-draft'), id);

    if (placement === 'main') {
      await pool.query(`UPDATE cms_articles SET placement = 'none' WHERE placement = 'main' AND id != $1`, [id]);
    } else if (placement === 'side') {
      await pool.query(`UPDATE cms_articles SET placement = 'none' WHERE placement = 'side' AND id != $1`, [id]);
    }
    const result = await pool.query(
      `UPDATE cms_articles SET
        title = $1,
        slug = $2,
        theme = $3,
        keywords = $4,
        description = $5,
        image = $6,
        content_blocks = $7::jsonb,
        published = $8,
        reading_time = $9,
        placement = $10,
        publish_date = CASE WHEN $8 = true AND publish_date IS NULL THEN CURRENT_DATE ELSE publish_date END,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *`,
      [
        b.title || 'Untitled Draft',
        newSlug,
        b.theme || 'Music',
        b.keywords || '',
        b.description || '',
        b.image || '',
        JSON.stringify(b.contentBlocks || []),
        Boolean(b.published),
        calculatedReadingTime,
        placement,
        id
      ]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Article not found in DB' });
    res.json({ message: 'Article updated successfully', slug: result.rows[0].slug });
  } catch (err) {
    console.error('Error updating article:', err);
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

// GET Route: Single Review — supports slug and legacy numeric id (numeric → 301 redirect to slug)
app.get('/api/reviews/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const isNumeric = /^\d+$/.test(slug);
    const query = isNumeric
      ? 'SELECT * FROM cms_reviews WHERE id = $1'
      : 'SELECT * FROM cms_reviews WHERE slug = $1';
    const result = await pool.query(query, [slug]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Review not found' });

    const row = result.rows[0];
    if (isNumeric && row.slug) {
      return res.redirect(301, `/api/reviews/${row.slug}`);
    }
    res.json(rowToReview(row));
  } catch (err) {
    console.error('Error fetching single review:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST Route: Image Upload & Compression
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

app.post('/api/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.' });
    }
    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
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

app.put('/api/reviews/:id', authenticateToken, async (req, res) => {
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

// --- SITEMAP ---
app.get('/sitemap.xml', async (req, res) => {
  const baseUrl = process.env.SITE_URL || 'https://isaia.com.br';
  try {
    const [articles, reviews] = await Promise.all([
      pool.query(`SELECT slug, updated_at FROM cms_articles WHERE published = true AND slug IS NOT NULL`),
      pool.query(`SELECT slug, updated_at FROM cms_reviews WHERE published = true AND slug IS NOT NULL`)
    ]);

    const articleUrls = articles.rows.map(row => `
  <url>
    <loc>${baseUrl}/articles/${row.slug}</loc>
    <lastmod>${new Date(row.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    const reviewUrls = reviews.rows.map(row => `
  <url>
    <loc>${baseUrl}/reviews/${row.slug}</loc>
    <lastmod>${new Date(row.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/articles-page</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/collection-page</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${articleUrls}${reviewUrls}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('Failed to generate sitemap');
  }
});

// --- 4. SERVER START ---
app.listen(port, () => {
  console.log(`\n🚀 Backend Server is officially running!`);
  console.log(`📡 Listening for Angular on: http://localhost:${port}\n`);
});

// Init DB schema in background — does not block server startup
initSchema()
  .then(() => console.log('✅ DB schema verified.'))
  .catch((err) => console.error('⚠️  DB schema init failed (DB may be unreachable locally):', err.message));