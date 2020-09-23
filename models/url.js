const { isURL } = require('validator');
const { model, Schema } = require('mongoose');

const urlSchema = new Schema({
  url: {
    type: String,
    trim: true,
    required: true,
    validate: {
      validator: function(v) {
        return isURL(v, {
          protocols: ['http', 'https']
        })
      },
      message: 'invalid URL'
    }
  },
  slug: {
    type: String,
    trim: true,
    required: true,
    validate: {
      validator: function(v) {
        return /^[\w\-]+$/.test(v)
      },
      message: 'slug must be alphanumeric'
    },
    maxlength: [15, 'slug must not exceed 15 characters']
  },
  hits: {
    type: Number,
    default: 0,
  }
});

urlSchema.pre('save', function(next) {
  if (!this.url.startsWith('http') || !this.url.startsWith('https')) {
    const url = `https://${this.url}`;
    this.url = url;
  }
  next();
});

module.exports = model('URL', urlSchema);
