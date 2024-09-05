const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log(err)
  console.log('Uncaught exception..closing server..');

  process.exit();
});
dotenv.config({ path: './config.env' });

const app = require('./app');

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

const port = 3000;
const server = app.listen(port);

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled rejection..closing server..');
  server.close(() => {
    process.exit();
  });
});
