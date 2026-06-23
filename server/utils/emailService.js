const nodemailer = require('nodemailer');
const { welcomeTemplate, orderConfirmationTemplate, orderStatusTemplate } = require('./emailTemplates');

// ─── Transporter ──────────────────────────────────────────────────────────────
// For localhost: uses Gmail SMTP with App Password
// For live server: switch to Brevo SMTP (host: smtp-relay.brevo.com, port:587)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,       // add GMAIL_USER to .env
      pass: process.env.GMAIL_APP_PASS,   // add GMAIL_APP_PASS to .env (16-char App Password)
    },
  });
};

const sendMail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
  console.log('Email sent:', info.messageId);
  return info;
};

// ─── Email Senders ────────────────────────────────────────────────────────────

const sendWelcomeEmail = ({ name, email }) => {
  return sendMail({
    to: email,
    subject: 'Welcome to GroceryShop!',
    html: welcomeTemplate({ name }),
  });
};

const sendOrderConfirmationEmail = ({ email, name, orderNumber, items, grandTotal, deliveryAddress }) => {
  return sendMail({
    to: email,
    subject: `Order Confirmed - #${orderNumber}`,
    html: orderConfirmationTemplate({ name, orderNumber, items, grandTotal, deliveryAddress }),
  });
};

const sendOrderStatusEmail = ({ email, name, orderNumber, status }) => {
  return sendMail({
    to: email,
    subject: `Order Update - #${orderNumber}`,
    html: orderStatusTemplate({ name, orderNumber, status }),
  });
};

module.exports = { sendWelcomeEmail, sendOrderConfirmationEmail, sendOrderStatusEmail };
