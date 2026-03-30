const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

/**
 * Send Society Code to Secretary
 * @param {string} toEmail - Recipient email
 * @param {string} userName - Secretary's name
 * @param {string} societyCode - Generated unique code
 * @param {string} companyName - Society/Company name
 */
const sendSocietyCodeEmail = async (toEmail, userName, societyCode, companyName) => {
  const mailOptions = {
    from: process.env.MAIL_DEFAULT_SENDER || process.env.MAIL_USERNAME,
    to: toEmail,
    subject: `Your Society Registration: ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #3b82f6;">Welcome to Society Service App!</h2>
        <p>Dear <strong>${userName}</strong>,</p>
        <p>Your society, <strong>${companyName}</strong>, has been successfully registered.</p>
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 5px solid #3b82f6; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Your Unique Society Code:</p>
          <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #1e293b; letter-spacing: 2px;">${societyCode}</p>
        </div>
        <p>Please share this code with your residents and staff so they can join your society on the app.</p>
        <br />
        <p>Best regards,<br />The Society Service Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSocietyCodeEmail,
};
