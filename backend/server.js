const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGODB_URL || 5000;

if (!mongoUri) {
  console.error('Missing required MONGO_URL (or MONGODB_URL) environment variable. Please set it in your .env file.');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });


// Routes
app.use('/api/modules', require('./routes/modules'));
app.use('/api/specializations', require('./routes/specializations'));
app.use('/api/calculate', require('./routes/calculate'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});