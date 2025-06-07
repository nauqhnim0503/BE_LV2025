// Import model Categories từ thư mục models
const { Categories,Products } = require('../models');

// Hàm lấy danh sách tất cả các danh mục
const danhSachcategories = async (req, res) => {
  try {
    const danhsach = await Categories.findAll(); // Lấy toàn bộ danh mục
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách danh mục thành công",
      data: danhsach
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Hàm tạo mới một danh mục
const createdCategories = async (req, res) => {
  try {
    const { name } = req.body; // Lấy dữ liệu từ body
    const image = req.file?.path || null;
    //Kiểm tra nếu thiếu name hoặc image
    // if (!name || !image) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Tên và hình ảnh không được để trống"
    //   });
    // }
// Kiểm tra trùng tên
const existingCategori = await Categories.findOne({ where: { name } });
if (existingCategori) {
  return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
}

    const newCategory = await Categories.create({ name, image }); // Tạo mới danh mục

    return res.status(201).json({
      success: true,
      message: "Tạo danh mục thành công",
      data: newCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Hàm lấy thông tin một danh mục theo ID
const getById = async (req, res) => {
  try {
    const { id } = req.params; // Lấy id từ URL

    const loaiSPID = await Categories.findByPk(id); // Tìm danh mục theo ID

    if (!loaiSPID) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy loại sản phẩm"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy một danh mục thành công",
      data: loaiSPID
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Hàm cập nhật danh mục theo ID
const updatedcategories = async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
  
      const categories = await Categories.findByPk(id);
      if (!categories) {
        return res.status(404).json({
          success: false,
          message: "danh mục không tồn tại"
        });
      }
  
      // Nếu không có file upload mới, giữ nguyên ảnh cũ
      const image = req.file?.path || categories.image;
  
      await Categories.update({ name, image }, { where: { id } });
      const updated = await Categories.findByPk(id);
  
      return res.status(200).json({
        success: true,
        message: "Cập nhật danh mục thành công",
        data: updated
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };


const deleteCategories=async(req,res)=>{
    const{id}=req.params;
    const loaiDMById=await Categories.findByPk(id);
    if (!loaiDMById) {
      return res.status(404).json({
        success: false,
        message: "Danh mục không tồn tại"
      });
    }
      //Đếm số lượng sản phẩm liên kết với danh mục
    const categoriCount = await Products.count({ where: { category_id: id } });
    if (categoriCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục vì có ${categoriCount} sản phẩm đang liên kết`
      });
    }
    await Categories.destroy({
        where:{id}
    });
    return res.status(200).json({
        success:true,
        message:"xoa danh muc thanh cong"
    })
}
const trangThaiDanhMuc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const [affectedRows] = await Categories.update(
      { is_active },
      { where: { id } }
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        status: 'false',
        message: 'Danh mục không tồn tại',
      });
    }

    const updatedCategory = await Categories.findByPk(id);

    return res.status(200).json({
      status: true,
      message: 'Cập nhật thành công',
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

// Export các hàm controller để sử dụng ở nơi khác (router)
module.exports = {
  danhSachcategories,
  createdCategories,
  getById,
  updatedcategories,
  deleteCategories,
  trangThaiDanhMuc
};
