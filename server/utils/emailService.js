const { Resend } = require('resend');
const { welcomeTemplate, orderConfirmationTemplate, orderStatusTemplate } = require('./emailTemplates');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async ({ to, subject, html }) => {
  const { data, error } = await resend.emails.send({
    from:    `GroceryShop <onboarding@resend.dev>`,
    to:      process.env.RESEND_TEST_EMAIL || to, // sends to your email in test mode
    subject: `[To: ${to}] ${subject}`,            // shows original recipient in subject
    html,
  });
  if (error) throw new Error(error.message);
  console.log('✅ Email sent:', data.id);
  return data;
};