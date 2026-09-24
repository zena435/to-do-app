import express from'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
//import User from '../models/User.js';

const router = express.Router();

const users = [];

function normaliseEmail(email) {
    let userEmail = '';

    if (typeof email === 'string') {
        userEmail = email.trim().toLowerCase();
    }

    return userEmail
}

router.get('/', function(req,res) {
    res.json(users);
});

router.post('/signup', async function (req,res) { //to create a user account
    const { name, email, password} = req.body;

    let userName = '';
    const userEmail = normaliseEmail(email);

    if (typeof name === 'string') {
        userName = name.trim();
    }

    if (!userName || !userEmail || !password) {

    return res

      .status(400)

      .json({ message: 'Name, email, and password are required' });

  }

  if (!userName || !userEmail || !password) {

    return res

      .status(400)

      .json({ message: 'Name, email, and password are required' });

  }

  if (!userName || !userEmail || !password) {

    return res

      .status(400)

      .json({ message: 'Name, email, and password are required' });

  }

  if (password.length < 8) {

    return res

      .status(400)

      .json({ message: 'Password must be at least 8 characters' });

  }


    const existingUser = users.find(function (user) {
        return user.email === userEmail;
    });

    if (existingUser) {

    return res

      .status(400)

      .json({ message: 'An account with this email already exists' });


    
    }
    const saltRounds = 10; //hashingpasswords + how many times you want to hash a pw
    const hashedPassword = await bcrypt.hash(password,saltRounds);


    const userId = users.length + 1;

    users.push({

        id: userId, 
        name: userName,
        email: userEmail,
        password: hashedPassword,
    });

    res.json({ message: 'User created'});


}); 

router.post('/login', async function (req,res) {
    const {email, password} = req.body
    const userEmail = normaliseEmail(email);

    if(!userEmail || !password) {
        return res.status(400).json ({message: 'Email and password are required'})

    }

    const user = users.find(function(user) {
        return user.email === userEmail;
    });

    if(!user) {
        return res.status(401).json({ message:'Email is not found'})
    }

    const passwordMatch = await bcrypt.compare(password, user,password);

    if(!passwordMatch) {
       return res.status(401).json({ message:'Password is incorrect'}) 
    }

    res.json({ message:'Login successful'});
})

export default router;