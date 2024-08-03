const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");
require('dotenv').config(); // Load environment variables from .env file

// Configure the mail transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'Gmail', // or another email service provider
  auth: {
    user: process.env.EMAIL_USER, // Use environment variable
    pass: process.env.EMAIL_PASS, // Use environment variable
  },
});

// Function to send emails
async function mailSender(to, subject, html) {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Use environment variable
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
}

// Define the OTP schema
const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5, // Document automatically deleted after 5 minutes
  },
});

// Define a function to send verification emails
async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await mailSender(
      email,
      "Verification Email",
      emailTemplate(otp)
    );
    console.log("Email sent successfully: ", mailResponse.response);
  } catch (error) {
    console.error("Error occurred while sending email: ", error);
    throw error;
  }
}

// Define a pre-save hook to send email after the document has been saved
OTPSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      await sendVerificationEmail(this.email, this.otp);
    } catch (error) {
      return next(error); // Pass the error to the next middleware
    }
  }
  next();
});

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;
