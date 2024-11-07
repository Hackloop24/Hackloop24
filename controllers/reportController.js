// controllers/reportController.js
const Report = require('../models/Report');

// Existing functions...

// Function to handle report tracking
exports.trackReport = async (req, res) => {
    const reportId = req.params.id;

    try {
        const report = await Report.findById(reportId).populate('userId', 'username'); // Populate user details if needed
        if (report) {
            res.render('track-report', { report }); // Render a view to display the report details
        } else {
            res.status(404).send('Report not found');
        }
    } catch (error) {
        console.error('Error tracking report:', error);
        res.status(500).send('Error tracking report.');
    }
};