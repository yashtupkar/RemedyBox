const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/remedieaap");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        maxlength: 50,
        unique:true
    },
    email: {
        type: String,
        required: true,
        maxlength: 100,
        unique:true
    },
    password: {
        type: String,
    },
    bio:{
        type:String,
       
    },
    handel:{
        type:String,
    },
    profileImage:{ type:String
   },
    posts: [{
         type: mongoose.Schema.Types.ObjectId,
        ref:'Post'
    }]
    
});

userSchema.plugin(plm);

module.exports = mongoose.model('User', userSchema);


