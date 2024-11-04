const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    title: String,
    description: String,
    location: String,
    state: String,
    district: String,
    taluk: String,
    panchayat: String,
    pinCode: String,
    photo: String, // Path to the uploaded photo
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ' }, // Reference to the user
    status: { type: String, default: 'pending' } // Default status
});

module.exports = mongoose.model('Report', reportSchema);