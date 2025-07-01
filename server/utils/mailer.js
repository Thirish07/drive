// const nodemailer = require('nodemailer');
// require('dotenv').config();

// const sendOTP = async (email, otp) => {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASSWORD,
//     },
//   });

//   const htmlTemplate = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <style>
//         body {
//           font-family: 'Segoe UI', sans-serif;
//           background-color: #f4f4f4;
//           margin: 0;
//           padding: 0;
//         }
//         .container {
//           background-color: #ffffff;
//           margin: 30px auto;
//           padding: 30px;
//           max-width: 500px;
//           border-radius: 10px;
//           box-shadow: 0px 0px 15px rgba(0,0,0,0.1);
//         }
//         h2 {
//           color: #333333;
//         }
//         .otp {
//           font-size: 24px;
//           font-weight: bold;
//           color: #007BFF;
//           margin: 20px 0;
//         }
//         p {
//           font-size: 16px;
//           color: #555555;
//         }
//         .footer {
//           font-size: 12px;
//           color: #999999;
//           margin-top: 30px;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
        
//         <p>Hi there,</p>
//         <p>Your OTP for registration is:</p>
//         <div class="otp">${otp}</div>
//         <p>This OTP is valid for 1 hour. Please do not share it with anyone.</p>
//         <div class="footer">
          
//         </div>
//       </div>
//     </body>
//     </html>
//   `;

//   const mailOptions = {
//     from: `Your App <${process.env.SMTP_USER}>`,
//     to: email,
//     subject: 'Verify Your Email - OTP Code',
//     html: htmlTemplate, 
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log('OTP sent successfully');
//   } catch (error) {
//     console.error('Error sending OTP:', error);
//   }
// };

// module.exports = { sendOTP };
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// OTP email (already present)
const sendOTP = async (email, otp) => {
  const htmlTemplate = `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <div style="background: #fff; padding: 20px; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2>Email Verification</h2>
          <p>Your OTP is:</p>
          <div style="font-size: 24px; font-weight: bold; color: #007bff;">${otp}</div>
          <p>It will expire in 1 hour. Do not share it with anyone.</p>
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: `Drive Printing System <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email - OTP Code',
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ OTP sent');
  } catch (err) {
    console.error('❌ OTP email error:', err.message);
  }
};

// ✅ NEW: Generic email sender
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `Drive Printing System <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log('✅ Email sent to', to);
  } catch (err) {
    console.error('❌ Email sending error:', err.message);
  }
};

module.exports = { sendOTP, sendEmail };
