const SibApiV3Sdk = require('@getbrevo/brevo');
const { welcomeTemplate, orderConfirmationTemplate, orderStatusTemplate } = require('./emailTemplates');

const sendMail = async ({ to, subject, html }) => {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.sender      = { name: process.env.EMAIL_FROM_NAME || 'GroceryShop', email: process.env.EMAIL_FROM };
  sendSmtpEmail.to          = [{ email: to }];
  sendSmtpEmail.subject     = subject;
  sendSmtpEmail.htmlContent = html;

  const info = await apiInstance.sendTransacEmail(sendSmtpEmail);
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