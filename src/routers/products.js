const {Router}= require('express');
const {upload} =require('../utils/cloudinary')
const {danhSachProducts,createProducts,updatedProduct,trangThaiSanPham,getProductById}=require('../controllers/productController');
const loaiProductsRouter=Router();
loaiProductsRouter.get('/',danhSachProducts)
loaiProductsRouter.get('/:id', getProductById);
loaiProductsRouter.post('/',upload.fields([
  { name: 'url', maxCount: 1 },              // ảnh chính
  { name: 'sub_images', maxCount: 4 },    // ảnh phụ (mảng)
]),createProducts)
loaiProductsRouter.put('/:id',upload.fields([
  { name: 'url', maxCount: 1 },              // ảnh chính
  { name: 'sub_images', maxCount: 4 },    // ảnh phụ (mảng)
]),updatedProduct)
loaiProductsRouter.patch('/:id',trangThaiSanPham)
module.exports=loaiProductsRouter;
