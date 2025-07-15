const bcrypt = require('bcrypt');
const { Orders,Orders_detail,Products,Product_variants, Sizes, Colors,Product_image,Users  } = require('../models');
const getByIdOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Orders.findByPk(id, {
      include: [
        {
          model: Orders_detail,
          as: 'orderItems',
          include: [
            {
              model: Products,
              as: 'product',
              include: [
                {
                  model: Product_image,
                  as: 'product_image',
                  attributes: ['url'],
                  limit: 1,
                  order: [['createdAt', 'ASC']],
                },
              ],
            },
            {
              model: Product_variants,
              as: 'product_variant',
              attributes: ['id'], // alias phải khớp với model
              include: [
                {
                  model: Sizes,
                  as: 'sizes',
                  attributes: ['name'],
                },
                {
                  model: Colors,
                  as: 'colors',
                  attributes: ['name'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy đơn hàng thành công',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDsOrderUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const orders = await Orders.findAll({
      where: { user_id },
      include: [
        {
          model: Orders_detail,
          as: 'orderItems',
          include: [
            {
              model: Products,
              as: 'product',
              include: [
                {
                  model: Product_image,
                  as: 'product_image',
                  attributes: ['url'],
                  limit: 1,
                  order: [['createdAt', 'ASC']],
                },
              ],
            },
            {
              model: Product_variants,
              as: 'product_variant',
              attributes: ['id'], // alias phải khớp với model
              include: [
                {
                  model: Sizes,
                  as: 'sizes',
                  attributes: ['name'],
                },
                {
                  model: Colors,
                  as: 'colors',
                  attributes: ['name'],
                },
              ],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // if (!orders || orders.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Không tìm thấy đơn hàng của user',
    //   });
    // }

    return res.status(200).json({
      success: true,
      message: 'Lấy đơn hàng user thành công',
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: { exclude: ['password', 'otp', 'otp_expires_at'] }, // Ẩn các trường nhạy cảm
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách người dùng thành công',
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Users.findByPk(id, {
      attributes: { exclude: ['password', 'otp', 'otp_expires_at'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin người dùng thành công',
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const capNhatTaiKhoan = async (req, res) => {
    const { id } = req.params;
    const { name, phone, address } = req.body;
  
    try {
      const nguoiDung = await Users.findByPk(id);
  
      if (!nguoiDung) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng' });
      }
  
      // Cập nhật các trường nếu có
      if (name !== undefined) nguoiDung.name = name;
      if (phone !== undefined) nguoiDung.phone = phone;
      if (address !== undefined) nguoiDung.address = address;
  
      await nguoiDung.save();
  
      return res.status(200).json({
        message: 'Cập nhật người dùng thành công',
        user: nguoiDung
      });
    } catch (err) {
      console.error('Lỗi khi cập nhật:', err);
      return res.status(500).json({ error: 'Lỗi máy chủ' });
    }
  };
  const doiMatKhau = async (req, res) => {
    const { email, mat_khau_cu, mat_khau_moi } = req.body;
    console.log('Data nhận được:', email, mat_khau_cu, mat_khau_moi)
    // Kiểm tra thông tin đầu vào
    if (!email || !mat_khau_cu || !mat_khau_moi) {
      return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
  
    try {
      // Tìm người dùng theo email
      const nguoiDung = await Users.findOne({ where: { email } });
  
      if (!nguoiDung) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng' });
      }
  
      // So sánh mật khẩu cũ
      const hopLe = await bcrypt.compare(mat_khau_cu, nguoiDung.password);
  
      if (!hopLe) {
        return res.status(401).json({ error: 'Mật khẩu cũ không chính xác' });
      }
  
      // Hash mật khẩu mới
      const matKhauMaHoa = await bcrypt.hash(mat_khau_moi, 10);
  
      // Cập nhật mật khẩu
      nguoiDung.password = matKhauMaHoa;
      await nguoiDung.save();
  
      return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
    } catch (err) {
      console.error('Lỗi đổi mật khẩu:', err);
      return res.status(500).json({ error: 'Lỗi máy chủ' });
    }
  };
module.exports={
    getByIdOrder,
    getDsOrderUser,
    getAllUsers,
    getUserById,
    capNhatTaiKhoan,
    doiMatKhau
}