import dotenv from 'dotenv';
// require('dotenv').config({path:'./env'})
import dbConnect from './db/index.js';

dotenv.config({
    path: './.env'
})

dbConnect();