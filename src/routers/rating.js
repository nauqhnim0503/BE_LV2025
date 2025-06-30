const {Router}= require('express');

const {danhSachRating,themdanhgia, capnhattrangthaidanhgia}=require('../controllers/ratingController')
const loaiRatingRouter=Router();
loaiRatingRouter.get('/',danhSachRating)
loaiRatingRouter.post('/',themdanhgia)
loaiRatingRouter.patch('/',capnhattrangthaidanhgia)

module.exports=loaiRatingRouter;