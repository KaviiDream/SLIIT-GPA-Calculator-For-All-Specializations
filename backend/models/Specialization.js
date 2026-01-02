const mongoose = require('mongoose');

const SpecializationSchema = new mongoose.Schema({

    specializationNamme:{
        type:String,
        required:true,
        unique:true
    },

    year3Modules:{
        type:[String],
        default:[]
    },
    year4Modules:{
        type:[String],
        default:[]
    },
})


module.exports = mongoose.model('Specialization',SpecializationSchema);