const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const cotesRoutes = require('./routes/cotesRoutes');
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
mongoose
     .connect(process.env.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
     })
     .then(() => console.log('MongoDB connected'))
     .catch((err) => console.error(err));

// Start the server
app.listen(PORT, () => {
     console.log(`Server is running on http://localhost:${PORT}`);
});
