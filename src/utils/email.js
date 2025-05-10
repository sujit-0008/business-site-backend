const nodemailer = require('nodemailer');
require('dotenv').config();
const transporter = nodemailer.createTransport({
    service: "gmail",
    port:465,
    secure: true, // true for 465, false for other ports
    logger:true,
    debug:true,
    secureConnection:false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls:{
        rejectUnauthorized:true
    }

})

// console.log("Email User:", process.env.EMAIL_USER); // Debug log
// console.log("Email Pass:", process.env.EMAIL_PASS);

const sendEmail = async (to, subject, text) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    })
}

module.exports = { sendEmail }