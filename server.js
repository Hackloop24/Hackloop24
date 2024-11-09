const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
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

// Initialize session middleware
app.use(session({
    secret: 'your_secret_key', // Change this to a secure key
    resave: false,
    saveUninitialized: false
}));

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
app.get('/', async (req, res) => {
    const successMessage = req.session.successMessage || null; // Get success message from session
    const errorMessage = req.session.errorMessage || null; // Get error message from session
    req.session.successMessage = null; // Clear the message after displaying it
    req.session.errorMessage = null; // Clear error message

    // Fetch all reports to display on the map
    let reports = [];
    try {
        reports = await Report.find(); // Fetch all reports
    } catch (error) {
        console.error('Error fetching reports:', error);
    }

    res.render('index', { successMessage, errorMessage, reports, userId: req.session.userId }); // Pass userId to the template
});

// Route to serve reports.html (if you want to keep it)
app.get('/reports', (req, res) => {
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
        req.session.errorMessage = 'Username and password are required.'; // Set error message
        return res.redirect('/signup'); // Redirect back to signup
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser  = new User({ username, password: hashedPassword });
        await newUser .save();
        req.session.successMessage = `Signup successful for ${username}!`; // Set success message
        res.redirect('/login'); // Redirect to login page
    } catch (error) {
        console.error('Error saving user:', error);
        req.session.errorMessage = 'Error saving user: ' + error.message; // Set error message
        res.redirect('/signup'); // Redirect back to signup
    }
});

// Handle login form submission
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Log the incoming credentials for debugging (remove in production)
    console.log('Login attempt:', { username, password });

    try {
        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            console.log('User  not found:', username);
            req.session.errorMessage = 'Invalid username or password.'; // Set error message
            return res.redirect('/login'); // Redirect back to login
        }

        // Check the password
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.successMessage = 'Login successful!'; // Set success message in session
            return res.redirect('/'); // Redirect to home page
        } else {
            console.log('Password mismatch for user:', username);
            req.session.errorMessage = 'Invalid username or password.'; // Set error message
            return res.redirect('/login'); // Redirect back to login
        }
    } catch (error) {
        console.error('Error during login:', error);
        req.session.errorMessage = 'An error occurred during login: ' + error.message; // Set error message
        return res.redirect('/login'); // Redirect back to login
    }
});

// Route to handle report submission
app.post('/submit-report', upload.single('photo'), async (req, res) => {
    // Check if the user is logged in
    if (!req.session.userId) {
        return res.status(403).send('You must be logged in to submit a report.');
    }

    // Retrieve longitude and latitude from the request body
    const { longitude, latitude } = req.body;

    // Parse longitude and latitude into numbers, default to null if not provided
    const parsedLongitude = longitude ? parseFloat(longitude) : null;
    const parsedLatitude = latitude ? parseFloat(latitude) : null;

    // Validate coordinates if they are provided
    if (longitude && isNaN(parsedLongitude)) {
        return res.status(400).send('Invalid longitude. Longitude must be a valid number.');
    }
    if (latitude && isNaN(parsedLatitude)) {
        return res.status(400).send('Invalid latitude. Latitude must be a valid number.');
    }

    // Prepare report data
    const reportData = {
        title: req.body.title,
        description: req.body.description,
        location: {
            type: "Point",
            coordinates: [parsedLongitude, parsedLatitude] // Use parsed float values, can be null
        },
        state: req.body.state,
        district: req.body.district,
        taluk: req.body.taluk,
        panchayat: req.body.panchayat,
        pinCode: req.body['pin-code'],
        photo: req.file ? req.file.path : null, // Save the path to the uploaded photo
        userId: req.session.userId
    };

    // Create and save the report
    const report = new Report(reportData);
    try {
        await report.save();
        // Redirect to the home page after successful submission
        req.session.successMessage = 'Report submitted successfully!'; // Set success message
        res.redirect('/'); // Redirect to the home page
    } catch (error) {
        console.error('Error saving report:', error);
        req.session.errorMessage = 'Error saving report: ' + error.message; // Set error message
        res.redirect('/'); // Redirect back to home
    }
});

// Route to track reports submitted by the logged-in user
app.get('/track-report', async (req, res) => {
    // Check if the user is logged in
    if (!req.session.userId) {
        return res.status(403).send('You must be logged in to track reports.');
    }

    try {
        // Fetch reports associated with the logged-in user
        const reports = await Report.find({ userId: req.session.userId });
        res.render('track-report', { reports }); // Render a view to display tracked reports
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).send('Error fetching reports: ' + error.message); // Provide more context
    }
});

// Route to view a specific report
app.get('/report/:id', async (req, res) => {
    const reportId = req.params.id;

    try {
        // Fetch the report by ID
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).send('Report not found.');
        }
        res.render('report-detail', { report }); // Render a view to display report details
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).send('Error fetching report: ' + error.message); // Provide more context
    }
});

// Route to log out the user
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        req.session.successMessage = 'You have been logged out successfully.'; // Set logout message
        res.redirect('/'); // Redirect to home after logout
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});