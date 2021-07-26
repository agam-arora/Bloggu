const mongoose =require('mongoose');
const passportLocalMongoose=require('passport-local-mongoose');

const Schema =mongoose.Schema;

const users =new Schema({
    
	email:{
		type:String,
		required:true,
		min:2,
		max:100
	}
})

users.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', users);