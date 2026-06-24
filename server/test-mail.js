require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_APP_PASS:', process.env.GMAIL_APP_PASS ? '✅ set' : '❌ missing');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  }
});

transporter.sendMail({
  from: process.env.GMAIL_USER,
  to: process.env.GMAIL_USER,
  subject: 'GroceryShop Test Mail',
  text: 'Mail is working!'
}, (err, info) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else {
    console.log('✅ Mail sent:', info.response);
  }
});