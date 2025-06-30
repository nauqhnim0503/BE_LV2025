const {Router}=require('express')
const{homeDS,productAll}=require('../controllers/homeController')
const homeRouter=Router()
homeRouter.get('/',homeDS)
homeRouter.get('/productall',productAll)
module.exports=homeRouter