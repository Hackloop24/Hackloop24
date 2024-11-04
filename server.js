const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const User = require('./models/User');

const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/loginSignupExample')
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Route for the home page
app.get('/', (req, res) => {
    res.render('index');
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve reports.html
app.get('/reports.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

// Route to render the login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Route to render the signup page
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Handle signup form submission
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    console.log('Received username:', username); // Debugging line
    console.log('Received password:', password); // Debugging line

    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser  = new User({ username, password: hashedPassword });
    try {
        await newUser .save();
        res.send(`Signup successful for ${username}!`);
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).send('Error saving user.');
    }
});

// Handle login form submission
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    console.log('Received username:', username); // Debugging line
    console.log('Received password:', password); // Debugging line

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
        return res.send('Invalid username or password.');
    }

    // Check the password
    const match = await bcrypt.compare(password, user.password);
    if (match) {
        res.send('Login successful!');
    } else {
        res.send('Invalid username or password.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});