const {Router}= require('express');
const {createOrder,vnpayReturn,updateOrderStatus,danhSachOrder,cancelOrder}=require('../controllers/orderController');
const loaiOrderRouter=Router();
loaiOrderRouter.get('/danhsach',danhSachOrder)
loaiOrderRouter.get('/vnpay/return', vnpayReturn);
loaiOrderRouter.post('/',createOrder)
loaiOrderRouter.patch('/:id',updateOrderStatus)
loaiOrderRouter.post('/:id/cancel', cancelOrder);
module.exports=loaiOrderRouter;
