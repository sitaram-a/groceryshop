const { BrevoClient } = require('@getbrevo/brevo');
const { welcomeTemplate, orderConfirmationTemplate, orderStatusTemplate } = require('./emailTemplates');

const sendMail = async ({ to, subject, html }) => {
  const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

  const info = await client.transactionalEmails.sendTransacEmail({
    sender:      { name: process.env.EMAIL_FROM_NAME || 'GroceryShop', email: process.env.EMAIL_FROM },
    to:          [{ email: to }],
    subject,
    htmlContent: html,
  });

  console.log('✅ Email sent:', info.messageId);
  return info;
};

const sendWelcomeEmail = ({ name, email }) =>
  sendMail({ to: email, subject: 'Welcome to GroceryShop!', html: welcomeTemplate({ name }) });

const sendOrderConfirmationEmail = ({ email, name, orderNumber, items, grandTotal, deliveryAddress }) =>
  sendMail({ to: email, subject: `Order Confirmed - #${orderNumber}`, html: orderConfirmationTemplate({ name, orderNumber, items, grandTotal, deliveryAddress }) });

const sendOrderStatusEmail = ({ email, name, orderNumber, status }) =>
  sendMail({ to: email, subject: `Order Update - #${orderNumber}`, html: orderStatusTemplate({ name, orderNumber, status }) });

module.exports = { sendWelcomeEmail, sendOrderConfirmationEmail, sendOrderStatusEmail };