const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  jobId: String,
  description: String,
  location: String,    // Hospital, etc for gig

  profession: String,  // * Physician
  specialty: String,  // * InternalMedicine, EmergencyMedicine, Hospitalist
  state: String,       // Must match state_licenses
  days: String,        // * Mon/Tue/Wed/Thu/Fri/Sat/Sun
}, { timestamps: true });

const Gig = mongoose.model('Gig', gigSchema);

module.exports = Gig;
