const nodemailer = require("nodemailer");
require('dotenv').config()


const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: "contato@joelmo.tech",
    pass: process.env.EMAIL_PASSWORD,
  },
});



module.exports = { transporter}