// core node modules

// 3rd party modules
const mongoose = require('mongoose');

// internal modules

const { Schema } = mongoose;

const ConsultationSchema = Schema({
  id: String,
  doctorId: String,
  roomId: String,
  begin: Date,
  end: Date,
});

module.exports = mongoose.model('Consultation', ConsultationSchema);
