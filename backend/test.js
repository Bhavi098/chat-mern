require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB Atlas connected successfully!');
  process.exit(0);
})
.catch(err => {
  console.error('MongoDB Atlas connection error:', err);
  process.exit(1);
});
