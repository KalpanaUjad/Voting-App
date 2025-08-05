const express = require('express');
const router = express.Router();
const User = require("./../models/user");
const {jwtAuthMiddleware, generateToken} = require("../jwt");
const Candidate= require("../models/candidate");

const checkAdminRole =async (userID)=>{
   try{
      const user = await User.findById(userID);
      console.log('user :',user);
      if(user.role === 'admin'){
         return true;
      }
   }catch(err){
      return false;
   }
}

// POST route to add a candidate
router.post('/', jwtAuthMiddleware, async (req, res) =>{
    try{
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user does not have admin role'});

        const data = req.body // Assuming the request body contains the candidate data

        // Create a new User document using the Mongoose model
        const newCandidate = new Candidate(data);

        // Save the new user to the database
        const response = await newCandidate.save();
        console.log('data saved');
        res.status(200).json({response: response});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})


// Login Route
// router.post("/login" , async(req, res) => {
//    try {
//       //Extract aadharCardNumber and password from request body
//       const {aadharCardNumber, password} = req.body;

//       // find the user by aadharCardNumber
//       const user = await User.findOne({aadharCardNumber: aadharCardNumber});

//       // If user does not exist or password does not match , return error
//       if(!user || !(await user.comparePassword(password))){
//          return res.status(401).json({error: 'invalid username or password'});
//       }

//       // generate token
//       const payload= {
//          id: user.id,
//       }
//       const token = generateToken(payload);

//       // return token as response
//       res.json({token});
//    }catch(err) {
//       console.error(err);
//       res.status(500).json({error: 'Internal server error'});
//    }
// });

//Profile route
// router.get('/profile', jwtAuthMiddleware, async(req, res) => {
//    try{
//       const userData = req.user;
      
//       const userId = userData.id;
//       const user = await User.findById(userId);

//       res.status(200).json({user});
//    }catch(err){
//       console.log(err);
//       res.status(500).json({error: 'Internal server error'});
//    }
// })


router.put("/:candidateID",jwtAuthMiddleware, async(req,res) => {
   try{

      if(!checkAdminRole(req.user.id))
         return res.status(403).json({Message:"user does not have admin role"});

      const candidateID = req.params.candidateID; // Extract the id from the URL parameter
      const updatedCandidateData = req.body // Updated data dor the person

      // find the user by userId
      const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
         new:true, // return the updated document
         runValidators: true, // run mongoose validation
      });

      if(!response){
         return res.status(404).json({error: 'candidate not found'});
      }

      console.log('candidate data updated');
      res.status(200).json(response);
   }catch(err){
      console.log(err);
      res.status(500).json({error: 'Internal server error'});
   }
})


router.delete("/:candidateID",jwtAuthMiddleware, async(req,res) => {
   try{

      if(!(await checkAdminRole(req.user.id)))
         return res.status(403).json({Message:"user does not have admin role"});

      const candidateID = req.params.candidateID; // Extract the id from the URL parameter

      // find the user by userId
      const response = await Candidate.findByIdAndDelete(candidateID);

      if(!response){
         return res.status(404).json({error: 'candidate not found'});
      }

      console.log('candidate data updated');
      res.status(200).json(response);
   }catch(err){
      console.log(err);
      res.status(500).json({error: 'Internal server error'});
   }
});

// let's start voting
router.post('/vote/:candidateID', jwtAuthMiddleware,async (req, res)=>{
   // no admin can vote
   // user can only vote

   candidateID = req.params.candidateID;
   userID = req.user.id;

   try{
      const candidate = await Candidate.findById(candidateID);
      if(!candidate){
         return res.status(404).json({message: 'candidaate not found'});
      }
      const user = await User.findById(userID);
      if(!user){
         return res.status(404).json({message: 'candidaate not found'});
      }
      if(user.isVoted){
         res.status(404).json({message: "you have already voted"});
      }
      if(user.role == 'admin'){
         res.status(403).json({message:"admin is not allowed"});
      }

      // update the candidate document to record the vote

      candidate.votes.push({user : userID});
      candidate.voteCount++;
      await candidate.save();

      // update the user docuument
      user.isVoted=true;
      await user.save();

      res.status(200).json({message:"internal server erfror"});
   }catch(err){
      console.log(err);
      res.status(500).json({error:"Internal server error"});
   }
});

// vote count
router.get('/vote/count', async (req, res) => {
    try{
        // Find all candidates and sort them by voteCount in descending order
        const candidate = await Candidate.find().sort({voteCount: 'desc'});

        // Map the candidates to only return their name and voteCount
        const voteRecord = candidate.map((data)=>{
            return {
                party: data.party,
                count: data.voteCount
            }
        });

        return res.status(200).json(voteRecord);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

//get list of all candidates with only name and party fields
router.get('/', async (req, res) => {
    try {
        // Find all candidates and select only the name and party fields, excluding _id
        const candidates = await Candidate.find({}, 'name party -_id');

        // Return the list of candidates
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
module.exports = router;
