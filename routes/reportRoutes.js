// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const Report = require('../models/Report'); // Adjust the path as necessary

// Route to track reports
router.get('/track-report', async (req, res) => {
    try {
        // Logic to fetch and display tracked reports
        const reports = await Report.find(); // Adjust this query as needed
        res.render('track-report', { reports }); // Render a view to display the reports
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).send('Error fetching reports.');
    }
});

module.exports = router;