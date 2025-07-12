// const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

exports.sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 2525,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2. Define mail options
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3. Send the email
  await transporter.sendMail(mailOptions);
};

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// exports.sendEmail = async (options) => {
//   try {
//     // Email options object
//     const mailOptions = {
//       from: process.env.EMAIL_FROM || 'noreply@natour-app.com',
//       to: options.email,
//       subject: options.subject,
//       text: options.message,
//       html: options.html || options.message, // Use HTML if provided, otherwise use text
//     };

//     // Send email using SendGrid
//     const response = await sgMail.send(mailOptions);
//     console.log('Email sent successfully:', response[0].statusCode);
//   } catch (error) {
//     console.error('Error sending email:', error);

//     // Handle specific SendGrid errors
//     if (error.response) {
//       const {
//         message,
//         code,
//         response: { body },
//       } = error;

//       console.error('SendGrid API Error:', {
//         message,
//         code,
//         errors: body.errors,
//       });
//     }

//     throw new Error(`Failed to send email: ${error.message}`);
//   }
// };
