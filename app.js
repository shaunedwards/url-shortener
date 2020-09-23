require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');
const rateLimit = require('express-rate-limit');

const app = express();
const URL = require('./models/url');
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

app.use(helmet());
app.use(express.json());
app.use(express.static('public'));
app.set('trust proxy', 1);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  headers: true,
  message: {
    error: 'too many requests - try again later'
  },
  keyGenerator: (req, res) => req.headers['x-real-ip']
});

async function updateShortUrl(req, res, next) {
  const { slug } = req.params;
  const url = await URL.findOne({ slug: slug.toLowerCase() });
  if (url) {
    url.hits += 1;
    await url.save();
  }
  next();
}

app.post('/', apiLimiter, async (req, res, next) => {
  let { url, slug } = req.body;
  slug = slug.trim().toLowerCase();

  // if no slug provided, generate one
  if (!slug) slug = nanoid();

  try {
    const slugExists = await URL.findOne({ slug });
    if (slugExists) return res.status(400).json({
      error: 'slug in use - try another'
    });
    const created = await URL.create({ url, slug });
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

app.get('/:slug', updateShortUrl, async (req, res, next) => {
  const { slug } = req.params;
  const { url } = await URL.findOne({ slug: slug.toLowerCase() }) || {};
  if (url) return res.redirect(301, url);
  return res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') err.status = 400;
  const [field] = err.errors ? Object.keys(err.errors) : [];
  res.status(err.status || 500).json({
    error: field ? err.errors[field].message : err.message
  });
});

const port = process.env.PORT || 5555;

app.listen(port, () => console.log(`Listening for requests on port ${port}`));
