const { Products, Product_image, Product_variants, Colors, sequelize, Categories,Brands,Sizes } = require('../models');
const { Op } = require('sequelize');
const homeDS = async (req, res, next) => {
  try {
    const data = await Products.findAll({
    where: {is_active: true}, // lọc trạng thái vd giá price:300000//is_active: false,promotional: { [Op.ne]: null }
      attributes: ['name', 'price', 'promotional', 'createdAt',],
      include: [
        {
          model: Product_image,
          as: 'product_image',
          attributes: ['url'],
          limit: 1 // lấy 1 ảnh duy nhất
        },
        // {
        //   model: Categories,
        //   as: 'category',
        //   attributes: ['name']
        // },
         {
           model: Product_variants,
           as: 'product_variants',
           attributes: ['color_id','size_id'],
           include: [
             {
               model: Colors,
               as: 'colors',
               attributes: ['code','name']
             },
             {
               model: Sizes,
               as: 'sizes',
               attributes: ['name']
             }
           ]
         }
      ],
      //order: sequelize.literal('RAND()'), // Sắp xếp ngẫu nhiên
      order: [['createdAt', 'DESC']],//giảm dần //'ASC'tăng dần
      limit: 8 // giới hạn 8 sản phẩm mới nhất
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm thành công",
      data: data
    });

  } catch (error) {
    next(error);
    console.error("LỖI SQL:", error);
  }
};
const productAll = async (req, res, next) => {
  try {
    console.log('limit nef', req.query.limit)
    const page = parseInt(req.query.page) || 1;     // Trang hiện tại (mặc định là 1)
    const limit = parseInt(req.query.limit) || 8;  // Số item mỗi trang (mặc định là 10)
    const offset = (page - 1) * limit;
    // tìm kiếm sản phẩm theo khoảng giá// test botman page=1&limit=8&minPrice=100000&maxPrice=500000
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    const sortPrice = req.query.sortPrice; // "asc" hoặc "desc"
    const order = [];
    const keyword = req.query.keyword || ''; // Từ khóa tìm kiếm
    const categoryName = req.query.categoryName || '';
    const brandName=req.query.brandName||'';
    const colorId = req.query.colorId || null
    const size = req.query.size || null
    let sizeId = null;
    if (size) {
      const sizeObj = await Sizes.findOne({ where: { name: size.toUpperCase() } });
      sizeId = sizeObj ? sizeObj.id : null;
    }
    //const keypromotions=req.query.keypromotions ||'';
    //const keyDescription=req.query.keyDescription||'';
    const whereCondition = { is_active: true }
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      whereCondition.promotional = { [Op.between]: [minPrice, maxPrice] };
    } else if (!isNaN(minPrice)) {
      whereCondition.promotional = { [Op.gte]: minPrice };
    } else if (!isNaN(maxPrice)) {
      whereCondition.promotional = { [Op.lte]: maxPrice };
    }
    // Sắp xếp theo giá
    if (sortPrice === 'asc' || sortPrice === 'desc') {
      order.push(['promotional', sortPrice]);
    }
    // Tìm kiếm theo tên
    if (keyword) {whereCondition.name = { [Op.like]: `%${keyword}%` };
    }
    // if(keypromotions){
    //   whereCondition.promotional={[Op.like]:`%${keypromotions}`};
    // }
    // if(keyDescription){
    //   whereCondition.description={[Op.like]:`%${keyDescription}`}
    // }
    // const sortPromotional=req.query.sortPromotional;
    // if(sortPromotional==='asc'||sortPromotional==='desc'){
    //   order.push(['promotional',sortPromotional])
    // }

    const { count, rows } = await Products.findAndCountAll({
      where: whereCondition,
      attributes: ['name', 'price', 'promotional','is_active'],
      include: [
        {
          model: Product_image,
          as: 'product_image',
          attributes: ['url'],
          limit: 1
        },
         {
           model: Categories,
           as: 'category',
           attributes: ['name','image'],
           required: !!categoryName,
           where: {
             name: {
               [Op.like]: `%${categoryName}%`
             }
           }
         },
         {
           model:Brands,
           as:'brands',
           attributes: ['name','image'],
           required:!!brandName,
           where:{
             name:{
               [Op.like]: `%${brandName}%`
             }
           }
         },
         {
            model: Product_variants,
            as: 'product_variants',
            attributes: ['color_id','size_id'],
            required: !!(colorId || size),
            where: {
                      ...(colorId && { color_id: colorId }),
                      ...(sizeId && { size_id: sizeId }),
                    },
            include: [
              {
                model: Colors,
                as: 'colors',
                attributes: ['code','name']
              },
              {
                model: Sizes,
                as: 'sizes',
                attributes: ['name'],
              }
            ]
          }
      ],
      order,
      offset,
      limit,
      distinct: true 
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm thành công ",
      data: rows,
      pagination: {
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  homeDS,
  productAll
};