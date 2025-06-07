const { Products, Product_variants,Product_image, sequelize } = require('../models');
const product_image = require('../models/product_image');

const sizes = require('../models/sizes');
// Hàm lấy danh sách tất cả các danh mục
const danhSachProducts = async (req, res) => {
  try {
    const danhsach = await Products.findAll({
      include: ['category', 'brands', 'product_image', {
        model: Product_variants,
        as: 'product_variants',
        include: [
          'sizes',
          'colors'
        ]
      }]

    }); // Lấy toàn bộ danh mục
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách san pham thành công",
      data: danhsach
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
//them
const createProducts = async (req, res, next) => {
  
  const t = await sequelize.transaction();
  try {
    let { name, description, price, promotional, brand_id, category_id, is_active, variants } = req.body;

    
    // Parse variants nếu là chuỗi
    if (typeof variants === 'string') {
      variants = JSON.parse(variants);
    }
    

    // Chuyển price và promotional thành số
    price = Number(price);
    promotional = promotional ? Number(promotional) : null;

    const products = await Products.create({
      name,
      description,
      price,
      promotional,
      brand_id,
      category_id,
      is_active,
    }, { transaction: t });

    for (let variant of variants) {
       
      const { color_id, size_id, stock_quantity } = variant;
      await Product_variants.create({
        product_id: products.id,
        color_id,
        size_id,
        stock_quantity
      }, { transaction: t });
    }

    if (req.files) {
      if (req.files.url && req.files.url.length > 0) {
        
        await Product_image.create({
          product_id: products.id,
          url: req.files.url[0].path,
        }, { transaction: t });
      }
      if (req.files.sub_images && req.files.sub_images.length > 0) {
        for (const file of req.files.sub_images) {
          
          await Product_image.create({
            product_id: products.id,
            url: file.path,
          }, { transaction: t });
        }
      }
    }

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      data: products
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ Lỗi khi tạo sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo sản phẩm",
      error: error.message,
      stack: error.stack
    });
  }
};

const updatedProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      promotional,
      brand_id,
      category_id,
      is_active,
      variants,
      sub_images_url = [] // danh sách URL ảnh phụ cần giữ lại, đúng thứ tự mong muốn
    } = req.body;

    const product = await Products.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    await product.update({
      name,
      description,
      price,
      promotional,
      brand_id,
      category_id,
      is_active,
    }, { transaction: t });

    let parsedVariants = variants;
    if (typeof variants === 'string') {
      parsedVariants = JSON.parse(variants);
    }

    if (Array.isArray(parsedVariants)) {
      await Product_variants.destroy({
        where: { product_id: id },
        transaction: t
      });

      for (let variant of parsedVariants) {
        const { color_id, size_id, stock_quantity } = variant;
        await Product_variants.create({
          product_id: id,
          color_id,
          size_id,
          stock_quantity
        }, { transaction: t });
      }
    }

    // ----- XỬ LÝ ẢNH -----
    let keepSubImageUrls = sub_images_url;
    if (typeof keepSubImageUrls === 'string') {
      keepSubImageUrls = [keepSubImageUrls];
    }

    // Lấy tất cả ảnh cũ của sản phẩm
    const oldImages = await Product_image.findAll({
      where: { product_id: product.id },
      transaction: t,
    });

    // Xử lý ảnh chính
    if (req.files?.url?.length > 0) {
      // Xóa ảnh chính cũ (giả sử ảnh chính là ảnh đầu tiên trong danh sách ảnh cũ)
      const oldMainImage = oldImages[0];
      if (oldMainImage) {
        await oldMainImage.destroy({ transaction: t });
      }
      // Thêm ảnh chính mới
      await Product_image.create({
        product_id: product.id,
        url: req.files.url[0].path,
      }, { transaction: t });
    }

    // Xóa ảnh phụ không nằm trong danh sách giữ lại
    for (const image of oldImages.slice(1)) {
      if (!keepSubImageUrls.includes(image.url)) {
        await image.destroy({ transaction: t });
      }
    }

    // Thêm ảnh phụ mới nếu có (từ file upload mới)
    if (req.files?.sub_images?.length > 0) {
      for (const file of req.files.sub_images) {
        await Product_image.create({
          product_id: product.id,
          url: file.path,
        }, { transaction: t });
      }
    }

    // Lấy lại toàn bộ ảnh sau khi cập nhật
    const updatedImages = await Product_image.findAll({
      where: { product_id: product.id },
      transaction: t,
    });

    // Tách ảnh chính (đầu tiên trong DB) và ảnh phụ còn lại
    const mainImage = updatedImages.find(img => req.files?.url?.length > 0 ? img.url === req.files.url[0].path : oldImages[0]?.url);
    
    // Ảnh phụ lấy theo đúng thứ tự sub_images_url, kết hợp ảnh phụ mới (không nằm trong sub_images_url)
    const subImagesMap = new Map();
    updatedImages.forEach(img => {
      if (img.url !== (mainImage ? mainImage.url : null)) {
        subImagesMap.set(img.url, img);
      }
    });

    // Sắp xếp ảnh phụ theo thứ tự sub_images_url
    const sortedSubImages = [];
    keepSubImageUrls.forEach(url => {
      if (subImagesMap.has(url)) {
        sortedSubImages.push(subImagesMap.get(url));
        subImagesMap.delete(url);
      }
    });

    // Thêm các ảnh phụ còn lại (là ảnh mới upload mà chưa có trong sub_images_url)
    for (const img of subImagesMap.values()) {
      sortedSubImages.push(img);
    }

    // Gán lại product.product_image theo thứ tự: ảnh chính + ảnh phụ đúng thứ tự
    product.product_image = [];
    if (mainImage) product.product_image.push(mainImage);
    product.product_image.push(...sortedSubImages);

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: product,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};


const trangThaiSanPham=async(req,res)=>{
  try {
    const {id}=req.params
    const{is_active}=req.body
    const products= await Products.findByPk(id)
    if(!products){
      return res.status(404).json({
        status:'false',
        message:'san pham khong ton tai'
      })
    }
    await products.update({is_active})
    return res.status(200).json({
      status:true,
      message:'cap nhat thanh cong',
      data:products
    })

  } catch (error) {
    next(error)
  }
}
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Products.findByPk(id, {
      include: [
        'category',
        'brands',
        'product_image',
        {
          model: Product_variants,
          as: 'product_variants',
          include: ['sizes', 'colors']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    res.status(200).json({
      success: true,
      message: 'Lấy sản phẩm thành công',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  danhSachProducts,
  createProducts,
  updatedProduct,
  trangThaiSanPham,
  getProductById
}
// const danhSachOrder = async (req, res) => {
//   try {
//       const danhsach = await Orders.findAll();
//       return res.status(200).json({
//           success: true,
//           message: "Lấy danh sách order thành công",
//           data: danhsach,
//       })
//   } catch (error) {
//       res.status(500).json({
//           success: false,
//           message: error.message
//       })
//   }
// };