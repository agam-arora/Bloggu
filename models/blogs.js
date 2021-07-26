const mongoose =require('mongoose')
const schema =mongoose.Schema;
const blogs =new schema({
    title : { 
        type : String,
        required:true
    },
    
    content : { 
        type : String,
        required:true
    },
    user: {
        type: schema.Types.ObjectId,
        ref: 'User'
    },
    likes: {
        type: Number,
        default:0
    },
    likedby: [
        {
            type : schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    comment:[
        {
            type : schema.Types.ObjectId,
            ref : 'comment'
        }
    ],
    thumbnail:{
        type : String
    },

    date: {
        type: Date
    }
})


module.exports = mongoose.model('Blogs', blogs);