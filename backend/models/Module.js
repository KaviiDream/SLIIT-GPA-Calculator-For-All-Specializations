const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({

    moduleCode:{
        type:String,
        required:true,
        unique:true
    },
    moduleName:{
        type:String,
        required:true,
    
    },
    credits:{
        type:Number,
        required:true,
        min:1,
        max:16
    },
    year:{
        type:Number,
        required:true,
        enum:[1,2,3,4]
    },
    semester:{
        type:Number,
        required:true,
        enum:[1,2]
    },
    
    specialization:{
        type:String,
        ref:'Specialization'
    }

})


module.exports = mongoose.model('Module',ModuleSchema);