const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const toursModel = require('../../models/tourModels');

dotenv.config({ path: './config.env' });

mongoose
  .connect(process.env.DATABASE, {
    dbName: 'natours-app',
  })
  .then((res) => {
    console.log('Connected to database...');
  });

const addData = async () => {
  try {
    await toursModel.create(
      JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')),
    );
    console.log('Data successfully loaded');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

const deleteTour = async () => {
  try {
    await toursModel.deleteMany();
    console.log('Data successfully deleted');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

if (process.argv[2] === '--import') {
  addData();
} else if (process.argv[2] === '--delete') {
  deleteTour();
}
