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

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng của user',
      });
    }

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
module.exports={
    getByIdOrder,
    getDsOrderUser,
    getAllUsers
}