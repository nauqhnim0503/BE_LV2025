const {Router}= require('express');
const {danhSachDiscount_codes,danhSachDiscount_codes_user,themDiscount_code,suaDiscount_code,xoaDiscount_code,getDiscountById,trangThaiDiscout}=require('../controllers/discount_codesController');
const loaiDiscount_code=Router();
loaiDiscount_code.get('/',danhSachDiscount_codes);
loaiDiscount_code.get('/home',danhSachDiscount_codes_user);
loaiDiscount_code.post('/', themDiscount_code);
loaiDiscount_code.get('/:id',getDiscountById);
loaiDiscount_code.put('/:id', suaDiscount_code);
loaiDiscount_code.patch('/:id',trangThaiDiscout)
loaiDiscount_code.delete('/:id', xoaDiscount_code);
module.exports=loaiDiscount_code