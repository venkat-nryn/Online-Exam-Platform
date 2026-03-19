const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendExamCredentials = async (student, exam) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: student.email,
    subject: `Exam Schedule: ${exam.examName}`,
    html: `
      <h2>Hello ${student.name},</h2>
      <p>Your exam has been scheduled:</p>
      <ul>
        <li><strong>Exam:</strong> ${exam.examName}</li>
        <li><strong>Date:</strong> ${new Date(exam.date).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${exam.startTime}</li>
        <li><strong>Duration:</strong> ${exam.duration} minutes</li>
      </ul>
      <p>Please login to the portal to access your exam.</p>
      <p>Best regards,<br>Exam Administration</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

module.exports = {
  sendExamCredentials
};