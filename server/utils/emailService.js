const { Resend } = require('resend');
const { welcomeTemplate, orderConfirmationTemplate, orderStatusTemplate } = require('./emailTemplates');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async ({ to, subject, html }) => {
  const { data, error } = await resend.emails.send({
    from:    `${process.env.EMAIL_FROM_NAME || 'GroceryShop'} <onboarding@resend.dev>`,
    to,
    subject,
    html,
  });
  if (error) throw new Error(error.message);
  console.log('✅ Email sent:', data.id);
  return data;
};

const sendWelcomeEmail = ({ name, email }) =>
  sendMail({ to: email, subject: 'Welcome to GroceryShop!', html: welcomeTemplate({ name }) });

const sendOrderConfirmationEmail = ({ email, name, orderNumber, items, grandTotal, deliveryAddress }) =>
  sendMail({ to: email, subject: `Order Confirmed - #${orderNumber}`, html: orderConfirmationTemplate({ name, orderNumber, items, grandTotal, deliveryAddress }) });

const sendOrderStatusEmail = ({ email, name, orderNumber, status }) =>
  sendMail({ to: email, subject: `Order Update - #${orderNumber}`, html: orderStatusTemplate({ name, orderNumber, status }) });

module.exports = { sendWelcomeEmail, sendOrderConfirmationEmail, sendOrderStatusEmail };