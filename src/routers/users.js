const {Router}= require('express');
const {getByIdOrder,getDsOrderUser,getAllUsers,capNhatTaiKhoan,doiMatKhau,getUserById}=require('../controllers/usersController');
const loaiUserRouter=Router();
loaiUserRouter.get('/order/:user_id',getDsOrderUser)
loaiUserRouter.get('/', getAllUsers);
loaiUserRouter.get('/:id',getByIdOrder)
loaiUserRouter.get('/profile/:id',getUserById) 
loaiUserRouter.put('/change-password',doiMatKhau)
loaiUserRouter.put('/:id',capNhatTaiKhoan)
module.exports=loaiUserRouter;