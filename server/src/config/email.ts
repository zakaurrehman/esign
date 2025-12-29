import nodemailer from 'nodemailer';

export const emailConfig = {
  host: 'mail.hiredbillingsupport.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'onboarding@hiredbillingsupport.com',
    pass: '12292025.OB-HBS!'
  }
};

// Create reusable transporter
export const transporter = nodemailer.createTransport(emailConfig);

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});
