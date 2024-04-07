const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    postImage:{
        type: String,
    },
    title: {
        type: String,
        required: true,
       
    },
    discription: {
        type: String,
        required: true,
       
    },
   ingredients: {
        type: String,
        required: true,
        
    },
    dosage: {
        type: String,
        required: true,
        
    },
    disclaimer: {
        type: String,
    
      
    },
    
    dateTime: {
        type: Date,
        default: Date.now
    },
    likes: {
        type: Number,
        default: 0
    },
    videoLink:{
        type:String
    },
});

module.exports= mongoose.model('Post', postSchema);