// models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], required: true }, // GeoJSON type
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    state: { type: String, required: true },
    district: { type: String, required: true },
    taluk: { type: String, required: true },
    panchayat: { type: String, required: true },
    pinCode: { type: String, required: true },
    photo: { type: String }, // URL or path to the uploaded photo
    status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ' }, // Associate report with user
    createdAt: { type: Date, default: Date.now }
});

// Create a geospatial index on the location field
reportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Report', reportSchema);