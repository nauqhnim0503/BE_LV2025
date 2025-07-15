const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'minhquan0503.hcm@gmail.com',
    pass: 'tnoh gcri jpmd fymm'

  }
});

const sendOTP = async (to, otp) => {
    try{
      await transporter.sendMail({
      from: '"Fashion Clothes" <minhquan0503.hcm@gmail.com>',
      to,
      subject: 'Mã OTP đặt lại mật khẩu - App Name',
      text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 1 phút.`,
      html: `<h3>Mã OTP của bạn</h3><p><b>${otp}</b></p><p>Mã này có hiệu lực trong 1 phút.</p><hr><small>Fashion Clothes</small>`
    });
    console.log(`Mail sent to ${to}`);
    } catch (error) {
      console.error('Error sending mail:', error);
    }
};

module.exports = { sendOTP };