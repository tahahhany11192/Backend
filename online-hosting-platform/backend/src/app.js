const express = require('express');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/sessions', sessionRoutes);

module.exports = app;