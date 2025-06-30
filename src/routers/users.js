const {Router}= require('express');
const {getByIdOrder,getDsOrderUser,getAllUsers}=require('../controllers/usersController');
const loaiUserRouter=Router();
loaiUserRouter.get('/order/:user_id',getDsOrderUser)
loaiUserRouter.get('/', getAllUsers);
loaiUserRouter.get('/:id',getByIdOrder)
module.exports=loaiUserRouter;