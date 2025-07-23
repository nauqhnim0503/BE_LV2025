const express = require('express')
const app = express()
const port = 3000
const cors = require('cors');
const morgan=require('morgan');
const loaiCategoriRouter = require('./src/routers/categories');
const loaiProductsRouter = require('./src/routers/products');
const loaiBrandsRouter = require('./src/routers/brands');
const loaiSizesRouter=require('./src/routers/sizes');
const loaiColorsRouter = require('./src/routers/colors');
const loaiOrderRouter = require('./src/routers/orders');
const loaiDiscount_code=require('./src/routers/discount_codes');
const authRouter=require('./src/routers/authRouter');
const homeRouter=require('./src/routers/homeRouter');
const loaiUserRouter=require('./src/routers/users');
const loaiRatingRouter=require('./src/routers/rating');

const reelRouter = require('./src/routers/reelRouter');

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/uploads', express.static('uploads'));
app.use('/api/reels', reelRouter);

app.use('/categories',loaiCategoriRouter);
app.use('/products',loaiProductsRouter);
app.use('/brands',loaiBrandsRouter);
app.use('/sizes',loaiSizesRouter);
app.use('/colors',loaiColorsRouter);
app.use('/orders',loaiOrderRouter);
app.use('/discount_codes',loaiDiscount_code);
app.use('/auth',authRouter);
app.use('/',homeRouter);
app.use('/users',loaiUserRouter);
app.use('/rating',loaiRatingRouter)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})