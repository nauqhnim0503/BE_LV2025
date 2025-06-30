const { Discount_codes } = require('../models');

// Lấy danh sách mã giảm giá
const danhSachDiscount_codes = async (req, res) => {
  try {
    const danhsach = await Discount_codes.findAll();
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách mã giảm giá thành công",
      data: danhsach,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm mã giảm giá
const themDiscount_code = async (req, res) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      min_order_value,
      usage_limit,
      used_count,
      start_date,
      end_date,
      is_active
    } = req.body;
    const existingDiscout = await Discount_codes.findOne({ where: { code } });
    if (existingDiscout) {
      return res.status(400).json({ message: 'Tên ma giam gia đã tồn tại' });
    }
    const newCode = await Discount_codes.create({
      code,
      discount_type,
      discount_value,
      min_order_value,
      usage_limit,
      used_count,
      start_date,
      end_date,
      is_active
    });

    return res.status(201).json({
      success: true,
      message: "Thêm mã giảm giá thành công",
      data: newCode,
    });
  } catch (error) {
    console.error(error); // 👈 để debug thêm
    res.status(500).json({ success: false, message: error.message });
  }
};
const getDiscountById = async (req, res) => {
    try {
      const { id } = req.params;
      const code = await Discount_codes.findByPk(id);
  
      if (!code) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy code giảm giá"
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết code thành công",
        data: code
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
// Sửa mã giảm giá
const suaDiscount_code = async (req, res) => {
  try {
    const { id } = req.params;
    const code = await Discount_codes.findByPk(id);
    if (!code) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã giảm giá",
      });
    }

    // Kiểm tra nếu người dùng gửi `code` mới và nó bị trùng với bản ghi khác
    if (req.body.code && req.body.code !== code.code) {
      const existing = await Discount_codes.findOne({
        where: { code: req.body.code }
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Mã giảm giá đã tồn tại. Vui lòng chọn mã khác.",
        });
      }
    }

    await code.update(req.body);

    return res.status(200).json({
      success: true,
      message: "Cập nhật mã giảm giá thành công",
      data: code,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xoá mã giảm giá
const xoaDiscount_code = async (req, res) => {
  try {
    const { id } = req.params;
    const code = await Discount_codes.findByPk(id);
    if (!code) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mã giảm giá",
      });
    }

    await code.destroy();

    return res.status(200).json({
      success: true,
      message: "Xoá mã giảm giá thành công",
    });
  } catch (error) {
res.status(500).json({ success: false, message: error.message });
  }
};
//trang thai discount
const trangThaiDiscout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const [affectedRows] = await Discount_codes.update(
      { is_active },
      { where: { id } }
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        status: 'false',
        message: 'ma giam gia không tồn tại',
      });
    }

    const updatedDiscout = await Discount_codes.findByPk(id);

    return res.status(200).json({
      status: true,
      message: 'Cập nhật trạng thái ma giam gia thành công',
      data: updatedDiscout,
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  danhSachDiscount_codes,
  themDiscount_code,
  suaDiscount_code,
  getDiscountById,
  xoaDiscount_code,
  trangThaiDiscout
};
