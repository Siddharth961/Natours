const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1) Create transponder
  const transponder = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    }
  });

  //2)Define the email options
  const mailOptions = {
    from: 'Siddharth Jain <abc@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  //3) Actually send the email
  await transponder.sendMail(mailOptions);
};

module.exports = sendEmail;
