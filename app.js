require('dotenv').config();
const express = require('express');
const yup = require('yup');
const monk = require('monk');
const path = require('path');
const helmet = require('helmet');
const { customAlphabet } = require('nanoid');
const rateLimit = require('express-rate-limit');

const app = express();
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

app.use(helmet());
app.use(express.json());
app.use(express.static('public'));
app.set('trust proxy', 1);

const db = monk(process.env.MONGO_URI);
const urls = db.get('urls');
urls.createIndex({ slug: 1 }, { unique: true });

const schema = yup.object().shape({
  url: yup.string().trim().url().required(),
  slug: yup.string().trim().max(15).matches(/^[\w\-]+$/i)
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  headers: true,
  message: {
    error: 'too many requests - try again in 15 mins'
  },
  keyGenerator: (req, res) => req.headers['x-real-ip']
});

app.post('/', apiLimiter, async (req, res, next) => {
  let { url, slug } = req.body;
  slug = slug.trim().toLowerCase();

  // if no slug provided, generate one
  if (!slug) slug = nanoid();

  try {
    await schema.validate({ url, slug });
    const slugExists = await urls.findOne({ slug });
    if (slugExists) return res.status(400).json({
      error: 'slug in use - try another'
    });
    const created = await urls.insert({ url, slug });
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

app.get('/:slug', async (req, res, next) => {
  const { slug } = req.params;
  const { url } = await urls.findOne({ slug }) || {};
  if (url) return res.redirect(301, url);
  return res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') err.status = 400;
  const { status = 500, message } = err;
  res.status(status).json({
    error: message
  });
});

const port = process.env.PORT || 5555;

app.listen(port, () => console.log(`Listening for requests on port ${port}`));
