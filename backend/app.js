import dns from 'node:dns';

// Force Node.js to use Google Public DNS and IPv4 resolution

dns.setServers(['8.8.8.8', '8.8.4.4']);

dns.setDefaultResultOrder('ipv4first');


// import express library
import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/tasks.js';
import authRoutes from './routes/auth.js';
import 'dotenv/config';
import mongoose from 'mongoose';

const app = express(); //initialize the express application
const PORT = process.env.PORT || 3001; // Define the port where the server will listen

//Middleware

app.use(cors()); //Cross Origin Resource Sharing- safety measure decide which valid origins can use this server
app.use(express.json()); // Convert api routes to json format

//Routes
app.use('/auth', authRoutes);
app.use('/tasks',taskRoutes);


//HTTP Methods
//GET - retrieve data/read data
//POST - create new data
//PATCH- replace a part of a response
//PUT - replacing an entire resource of data
//DELETE- removes data
//FRONTEND - SERVER/API/BACKEND - DATABASE


app.get( '/', function (req, res) {

    res.send('Hello! Your backend server is working.') // create a simple get route for the home page of the server/app
});

if(!process.env.MONGODB_URI) {
    console.log('Database connection string missing in .env')
    process.exit(1);
}

if(!process.env.JWT_SECRET) {
    console.log('Database connection string missing in .env')
    process.exit(1);

}    

try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB')


    app.listen(PORT, function () {

    console.log ('Server is running on : ',PORT);

});
} catch (error) {
    console.log('Server could not start', error.message)
    process.exit(1);

};

  



// package.json keeps track of all of yr metadata and dependencies
// package-lock .json is a core dependency for express.js
// app.js is the entry point(main js file) for express.js when you start the server and port 3000 is the end point
//NPM -Node Package Manager




