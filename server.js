const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const User = require('./models/User');
const Report = require('./models/Report');

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

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append the file extension
    }
});

const upload = multer({ storage });

// Route for the home page
app.get('/', (req, res) => {
    res.render('index');
});

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

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
        return res.send('Invalid username or password.');
    }

    // Check the password
    const match = await bcrypt.compare(password, user.password);
    if (match) {
        req.session.userId = user._id; // Store user ID in session
        res.send('Login successful!');
    } else {
        res.send('Invalid username or password.');
    }
});

// Route to handle report submission
app.post('/submit-report', upload.single('photo'), async (req, res) => {
    // Check if the user is logged in
    if (!req.session.userId) {
        return res.status(403).send('You must be logged in to submit a report.');
    }

    // Prepare report data
    const reportData = {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        state: req.body.state,
        district: req.body.district,
        taluk: req.body.taluk,
        panchayat: req.body.panchayat,
        pinCode: req.body['pin-code'],
        photo: req.file ? req.file.path : null, // Save the path to the uploaded photo
        userId: req.session.userId // Associate the report with the logged-in user
    };

    // Create and save the report
    const report = new Report(reportData);
    try {
        await report.save();
        res.send('Report submitted successfully!');
    } catch (error) {
        console.error('Error saving report:', error);
        res.status(500).send('Error saving report.');
    }
});

// Route to track reports submitted by the logged-in user
app.get('/my-reports', async (req, res) => {
    if (!req.session.userId) {
        return res.status(403).send('You must be logged in to view your reports.');
    }

    try {
        const reports = await Report.find({ userId: req.session.userId });
        res.render('my-reports', { reports }); // Render a view to display reports
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).send('Error fetching reports.');
    }
});

// Route to log out the user
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/'); // Redirect to home after logout
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});