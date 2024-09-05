const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../../config.env' });

const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

// eslint-disable-next-line prettier/prettier

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('connection estabilshed');
  });

//here check the route..you may need to either change this rout or add more cd in terminal
const tours = JSON.parse(fs.readFileSync('./tours.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync('./reviews.json', 'utf-8'));

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave : false})
    await Review.create(reviews)
    console.log('Data successfully imported');
} catch (err) {
    console.log(err);
}
process.exit(); //stops the running connection to database so the terminal stops and we get command line without ctrl + c
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data succesfully deleted');
} catch (err) {
    console.log(err);
}
process.exit();
};

//taking input from command line to either call import or delete functions
if (process.argv[2] === '--import') importData();
else if (process.argv[2] === '--delete') deleteData();
