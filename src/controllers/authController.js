const { Users } = require('../models')
const { Admin } = require('../models');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { omit, pick } = require('lodash')
const { OAuth2Client } = require('google-auth-library');
const { sendOTP } = require('../utils/mailer');
const { Op } = require('sequelize');
// Khởi tạo Google OAuth client
// const GOOGLE_CLIENT_ID="keyne"
const GOOGLE_CLIENT_ID="672590852123-a30l6u2g28e5a85edq87nbb8cdkm8l4s.apps.googleusercontent.com"
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const registerController = async (req, res, next) => {
    try {
        const { name, email, password, } = req.body
        const existedUser = await Users.findOne({
            where: { email }
        })
        if (existedUser) {
            return res.status(400).json({ status: 'false', message: 'Email đã tồn tại' })
        }
        console.log(existedUser)


        const data = await Users.create({
            name,
            email,
            password: bcrypt.hashSync(password, 10),
        });

        return res.status(201).json({
            status: 'true',
            message: 'Đăng ký thành công',
            data
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
}
const loginController = async (req, res, next) => {
    try {
        const { email, password } = req.body
        const existedUser = await Users.findOne({ where: { email } })
        const isMatch = bcrypt.compareSync(password, existedUser.password)
        if (!isMatch || !existedUser) {
            return res.status(400).json({
                status: 'false',
                message: 'tài khoản hoặc mật khẩu không chính xác'
            })
        }
        const users = pick(existedUser, ['id', 'name','email'])
        const token = jwt.sign({
            users 
        }, 'key', { expiresIn: '1d' }
        )
        return res.status(200).json({
            status: 'true',
            message: 'đăng nhập thành công',
            data: users,
            token
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
}

const adminLoginController = async (req, res, next) => {
    try {
        const { email, password } = req.body
        const existedUser = await Admin.findOne({ where: { email } })
        const isMatch = bcrypt.compareSync(password, existedUser.password)
        if (!isMatch || !existedUser) {
            return res.status(400).json({
                status: 'false',
                message: 'tài khoản hoặc mật khẩu không chính xác'
            })
        }
        const admins = pick(existedUser, ['id', 'name'])
        const token = jwt.sign({
            admins 
        }, 'key', { expiresIn: '1d' }
        )
        return res.status(200).json({
            status: 'true',
            message: 'đăng nhập thành công',
            data: admins,
            token
        })
} catch (error) {
        console.log(error)
        next(error)
    }
  };
  const LoginGoogle = async (req, res, next) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                status: 'false',
                message: 'Google token cần phải có'
            });
        }

        // Xác thực token từ Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name} = payload;

        if (!email) {
            return res.status(400).json({
                status: 'false',
                message: 'Email not found in Google token',
                data: payload
            });
        }

        // Kiểm tra user đã tồn tại chưa
        let existedUser = await Users.findOne({
            where: { email }
        });

        if (!existedUser) {
            // Tạo user mới nếu chưa tồn tại
            existedUser = await Users.create({
                name: name || 'Google User',
                email: email,
                password: bcrypt.hashSync(Math.random().toString(36), 10), // Random password
              
             
                google_id: payload.sub,
               
            });
        } else {
            // Cập nhật thông tin nếu cần
            
                await existedUser.update({
                   
                    google_id: payload.sub,
                    
                });
            
        }

        const users = pick(existedUser, ['id', 'name', 'email',]);
        const jwtToken = jwt.sign({
            users
        }, 'key', { expiresIn: '1d' });

        return res.status(200).json({
            status: 'true',
            message: 'Đăng nhập Google thành công',
            data: users,
            token: jwtToken
        });

    } catch (error) {
        console.log('Google Login Error:', error);
        
        if (error.message.includes('Token used too early')) {
            return res.status(400).json({
                status: 'false',
                message: 'Token Google không hợp lệ'
            });
        }
        
        if (error.message.includes('Wrong number of segments')) {
            return res.status(400).json({
                status: 'false',
                message: 'Định dạng token Google không đúng'
            });
        }

        return res.status(500).json({
            status: 'false',
            message: 'Lỗi đăng nhập Google'
        });
    }
}
const forgotPasswordController = async (req, res) => {
    try {
      const { email } = req.body;
  
      const user = await Users.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'Email không tồn tại' });
const otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 60 * 1000); // 1 phút
  
      user.otp = otp;
      user.otp_expires_at = expiresAt;
      await user.save();
  
      await sendOTP(user.email, otp);
  
      res.json({ message: 'Mã OTP đã được gửi đến email của bạn' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await Users.findOne({
      where: {
        email,
        otp
      }
    });

    // Nếu không tìm thấy user
    if (!user) {
      console.log('❌ Không tìm thấy user với email và otp');
      return res.status(400).json({ message: 'OTP không hợp lệ' });
    }

    console.log('⏳ OTP hết hạn tại:', user.otp_expires_at);
    console.log('⏱️ Thời điểm hiện tại:', new Date());

    if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      console.log('❌ OTP đã hết hạn');
      return res.status(400).json({ message: 'OTP đã hết hạn' });
    }

    res.json({ message: 'OTP hợp lệ' });

  } catch (err) {
    console.error('Lỗi khi xác thực OTP:', err);
    res.status(500).json({ error: err.message });
  }
};



// Đặt lại mật khẩu
const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    console.log('🔍 Reset password request:', { email, otp });
    const user = await Users.findOne({
      where: {
        email,
        otp,
      
      }
    });

    if (!user) {
        console.log('❌ User không tồn tại hoặc OTP không đúng');
      return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.otp = null;
    user.otp_expires_at = null;
    await user.save();

    console.log('✅ Đặt lại mật khẩu thành công cho user:', email);
    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error('❌ Lỗi khi đặt lại mật khẩu:', err);
    res.status(500).json({ error: err.message });
  }
};
module.exports = {
    registerController,
    loginController,
    adminLoginController,
    LoginGoogle,
    forgotPasswordController,
    verifyOTP,
    resetPassword
}