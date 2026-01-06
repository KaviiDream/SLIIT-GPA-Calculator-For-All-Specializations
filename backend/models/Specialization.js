const mongoose = require('mongoose');

const SpecializationSchema = new mongoose.Schema({
    specializationName: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    specializationCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    year3Modules: {
        type: [String],
        default: []
    },
    year4Compulsory: {
        type: [String],
        default: []
    },
    year4Electives: {
        type: [String],
        default: []
    },
    minCreditsYear3: {
        type: Number,
        default: 30
    },
    minCreditsYear4: {
        type: Number,
        default: 30
    }
});


module.exports = mongoose.model('Specialization',SpecializationSchema);