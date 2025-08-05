const mongoose = require('mongoose');
// const { isValidElement } = require('react');
const bcrypt=require('bcrypt');

const Schema = mongoose.Schema;

const userSchema = new Schema({
   name : {
      type : String,
      required : true,
   },
   age : {
      type : Number,
   },
   email : {
      type :String,
      required : true,
      unique :true,
   },
   mobile : {
      type : Number,
      required : true,
   },
   address : {
      type :String,
   },
   aadharCardNumber : {
      type : Number,
      required : true,
      unique : true,
   },
   password : {
      type :String,
      required : true,
   },
   role : {
      type :String,
      email : ['voter', 'admin'],
      default : 'voter',
   },
   isVoted : {
      type : Boolean,
      default :false,
   }
});

userSchema.pre('save', async function(next){
   const person = this;

   //hash the password only if it has been modified or is new
   if(!person.isModified('password')) return next();

   try{
      // hash password generation
      const salt = await bcrypt.genSalt(10);

      // hash password
      const hashedPassword = await bcrypt.hash(person.password, salt);

      // override the plain password with the hashed one
      person.password= hashedPassword;
      next();
   }catch(err){
      return next(err);
   }
})

userSchema.method.comparePassword= async function(candidatePassword){
   try{
      //use bcrypt to compare the password with the hashed password
      const isMatch = await bcrypt.compare(candidatePassword, this.password);
      return isMatch;
   }catch(err){
      throw err;
   }
}

const User = mongoose.model ("User", userSchema);
module.exports = User;
