// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Define a route for the root URL
app.get('/', (req, res) => {
    res.send('index.ejs'); // Simple text response
});

// Alternatively, if you want to render an EJS file
// app.get('/', (req, res) => {
//     res.render('index'); // Make sure you have an index.ejs file in the views folder
// });

// Define a route for the login page
app.get('/login', (req, res) => {
    res.render('login'); // This will render views/login.ejs
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});