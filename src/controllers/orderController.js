// Import các thư viện cần thiết
const crypto = require('crypto'); // Thư viện mã hóa dùng để tạo chữ ký bảo mật
const moment = require('moment'); // Thư viện xử lý thời gian
const qs = require('qs'); // Thư viện để xử lý chuỗi query
const { Orders_detail, Orders, Product_variants,Products, sequelize ,Sizes,Colors,Discount_codes} = require('../models'); // Import model từ Sequelize
const { includes } = require('lodash');

// Cấu hình thông tin VNPAY
const VNPAY = {
    tmnCode: 'Y23UTK8D', // Mã terminal được VNPAY cung cấp
    hashSecret: 'ZQ7X0L2ETEVQ8WQJRAT3B15TNEO7XMXT', // Secret key để tạo chữ ký
    url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', // URL trang thanh toán sandbox
    returnUrl: 'http://localhost:3000/orders/vnpay/return', // URL callback sau khi thanh toán
};

// Bộ nhớ tạm để lưu đơn hàng chờ thanh toán (production nên dùng Redis)
const pendingOrders = new Map();

// Hàm kiểm tra tồn kho
const validateStock = async (items, transaction) => {
    for (const item of items) {
        const variant = await Product_variants.findByPk(item.product_variant_id, { transaction });
        if (!variant) {
            throw new Error(`Không tìm thấy sản phẩm với ID: ${item.product_variant_id}`);
        }
        if (variant.stock_quantity < item.quantity) {
            throw new Error(`Sản phẩm không đủ số lượng. Còn lại: ${variant.stock_quantity}`);
        }
    }
};

// Hàm trừ số lượng tồn kho
const decrementStock = async (items, transaction) => {
    await Promise.all(items.map(item =>
        Product_variants.decrement('stock_quantity', {
            by: item.quantity,
            where: { id: item.product_variant_id },
            transaction
        })
    ));
};

// Tạo bản ghi đơn hàng và chi tiết đơn hàng
const createOrderRecord = async (orderId, orderData, items, status, transaction, extraFields = {}) => {
    const order = await Orders.create({
        id: orderId,
        ...orderData,
        status,
        ...extraFields
    }, { transaction });

    await Orders_detail.bulkCreate(
        items.map(item => ({ order_id: orderId, ...item })),
        { transaction }
    );

    return order;
};

// Sắp xếp object và encode theo yêu cầu VNPAY
const sortObject = (obj) => {
    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
        sorted[encodeURIComponent(key)] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    });
    return sorted;
};

// Tạo chữ ký HMAC SHA512 từ dữ liệu đầu vào
const createSignature = (data) => {
    return crypto.createHmac('sha512', VNPAY.hashSecret)
        .update(Buffer.from(data, 'utf-8'))
        .digest('hex');
};

// Lấy IP của client
const getClientIP = (req) => {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
};

// Tạo URL thanh toán VNPAY
const createVNPayUrl = (orderId, amount, ipAddr) => {
    let params = {vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: VNPAY.tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: 'other',
        vnp_Amount: amount * 100,
        vnp_ReturnUrl: VNPAY.returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
    };

    params = sortObject(params);
    const signData = qs.stringify(params, { encode: false });
    params.vnp_SecureHash = createSignature(signData);

    return `${VNPAY.url}?${qs.stringify(params, { encode: false })}`;
};

// Xử lý thanh toán COD (thanh toán khi nhận hàng)
const handleCODPayment = async (orderId, orderData, items, res) => {
    const t = await sequelize.transaction();
    try {
        await validateStock(items, t);
        const order = await createOrderRecord(orderId, orderData, items, 'Chờ xác nhận', t);
        if (orderData.discount_code_id) {
          await Discount_codes.increment('used_count', {
            by: 1,
            where: { id: orderData.discount_code_id },
            transaction: t
          });
        }
        await decrementStock(items, t);
        await t.commit();
        return res.json({ success: true, message: 'Đặt hàng thành công', data: order });
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

// Xử lý thanh toán qua VNPAY
const handleVNPayPayment = async (orderId, orderData, items, req, res) => {
    const t = await sequelize.transaction();
    try {
        await validateStock(items, t);
        await t.commit();

        pendingOrders.set(orderId, { ...orderData, items, created_at: Date.now() });
        setTimeout(() => pendingOrders.delete(orderId), 15 * 60 * 1000); // Xóa sau 15 phút

        const paymentUrl = createVNPayUrl(orderId, orderData.total_amount, getClientIP(req));
        return res.json({
            success: true,
            message: 'Vui lòng thanh toán để hoàn tất đơn hàng',
            payment_url: paymentUrl,
            order_id: orderId
        });
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

// Controller chính để tạo đơn hàng
const createOrder = async (req, res) => {
  console.log('🔥 Order body:', req.body);
    try {
        const {
            user_id, name, address, phone, discount_code_id,
            subtotal, discount_amount, total_amount, payment_method, items
        } = req.body;

        const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const orderData = {
            user_id, name, address, phone,
            discount_code_id: discount_code_id || null,
            subtotal, discount_amount, total_amount, payment_method
        };

        if (payment_method === 'COD') {
          console.log("➡️ COD payment được chọn");
            return await handleCODPayment(orderId, orderData, items, res);
        }

        if (payment_method === 'VNPAY') {
          console.log("➡️ VNPAY payment được chọn");
            return await handleVNPayPayment(orderId, orderData, items, req, res);
        }
        console.warn("⚠️ Không khớp phương thức thanh toán:", payment_method);
        return res.status(400).json({ success: false, message: 'Phương thức thanh toán không hợp lệ' });
    } catch (error) {
        console.error('🔥 Lỗi khi đặt hàng:', error.message);

        // Kiểm tra lỗi liên quan đến tồn kho
        if (error.message.includes('không đủ số lượng')) {
          return res.status(400).json({ success: false, message: error.message });
        }
      
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
      }
};

// Xử lý callback từ VNPAY sau thanh toán
const vnpayReturn = async (req, res) => {
  console.log('📥 VNPAY callback nhận được:', req.query);
    try {
        const params = { ...req.query };
        const secureHash = params.vnp_SecureHash;
        delete params.vnp_SecureHash;
        delete params.vnp_SecureHashType;

        const sortedParams = sortObject(params);
        const signData = qs.stringify(sortedParams, { encode: false });
        const signature = createSignature(signData);

        const frontendUrl = 'http://localhost:8080/vnpay-return';

        if (secureHash !== signature) {
          return res.redirect(`${frontendUrl}?status=fail&message=Chữ+ký+không+hợp+lệ`);
        }

        const orderId = params.vnp_TxnRef;
        const isSuccess = params.vnp_ResponseCode === '00';

        if (!isSuccess) {
          pendingOrders.delete(orderId);
          return res.redirect(`${frontendUrl}?status=fail&vnp_TxnRef=${orderId}&message=Thanh+toán+thất+bại`);

        }

        const orderData = pendingOrders.get(orderId);
        if (!orderData) {
          return res.redirect(`${frontendUrl}?status=fail&vnp_TxnRef=${orderId}&message=Không+tìm+thấy+thông+tin+đơn+hàng`);
        }

        const t = await sequelize.transaction();
        try {
            await validateStock(orderData.items, t);
            const order = await createOrderRecord(
                orderId,
                orderData,
                orderData.items,
                'Đã xác nhận',
                t,
                {
                    payment_method: 'VNPAY',
                    payment_date: new Date(),
                    vnpay_transaction_id: params.vnp_TransactionNo
                }
            );
            if (orderData.discount_code_id) {
              await Discount_codes.increment('used_count', {
                by: 1,
                where: { id: orderData.discount_code_id },
                transaction: t
              });
            }

            await decrementStock(orderData.items, t);
            await t.commit();

            pendingOrders.delete(orderId);

            return res.redirect(`${frontendUrl}?status=success&vnp_TxnRef=${orderId}&message=Thanh+toán+thành+công`);
        } catch (error) {
          await t.rollback();
          return res.redirect(`${frontendUrl}?status=fail&vnp_TxnRef=${orderId}&message=Lỗi+hệ+thống`);
        }

    } catch (error) {
      console.error('🔥 Toàn bộ lỗi vnpayReturn:', error);
      return res.redirect(`${frontendUrl}?status=fail&vnp_TxnRef=${orderId}&message=Lỗi+hệ+thống`);
    }
};
//get danh sach order
const danhSachOrder = async (req, res) => {
  try {
    const danhsach = await Orders.findAll({
      include: [
        {
          model: Orders_detail,
          as: 'orderItems',
          include: [
            {
              model: Product_variants,
              as: 'product_variant',
              attributes: ['id', 'product_id', ],
              include: [
            {
              model: Products,
              as: 'product',
              attributes: ['name'],
            },
            {
              model: Sizes,
              as: 'sizes',
              attributes: ['name'], 
            },
            {
              model: Colors,
              as: 'colors',
              attributes: ['name'], 
            },
          ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách order thành công",
      data: danhsach
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const status = req.body?.status || req.query?.status;
    const allowedStatus = ['Chờ xác nhận', 'Đã xác nhận', 'Đang vận chuyển', 'Đã giao', 'Đã hủy', 'Thanh toán thất bại'];

    if (!allowedStatus.includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    try {
        const order = await Orders.findByPk(id);
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

        order.status = status;
        await order.save();

        res.json({ success: true, message: 'Cập nhật trạng thái thành công', data: order });
    } catch (error) {res.status(500).json({ success: false, error: error.message });
    }
};
const cancelOrder = async (req, res) => {
  const order_id = req.params.id; // ✅ Lấy ID đơn hàng từ URL params, ví dụ: /orders/:id/cancel
  const t = await sequelize.transaction(); // 🔁 Bắt đầu một transaction để đảm bảo thao tác CSDL diễn ra an toàn

  try {
    // 🔍 Tìm đơn hàng theo ID, đồng thời lấy danh sách sản phẩm chi tiết trong đơn
    const order = await Orders.findByPk(order_id, {
      include: [{ model: Orders_detail, as: 'orderItems' }],
      transaction: t
    });

    // ❌ Nếu không tìm thấy đơn hàng
    if (!order) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }

    // ⚠️ Chỉ cho huỷ đơn khi đơn còn ở trạng thái "Chờ xác nhận"
    if (order.status !== 'Chờ xác nhận') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Đơn hàng không thể huỷ ở trạng thái hiện tại: ${order.status}`
      });
    }

    // ♻️ Duyệt từng sản phẩm trong đơn để hoàn trả số lượng về kho
    for (const item of order.orderItems) {
      console.log("Huỷ đơn → hoàn kho:", {
        variantId: item.product_variant_id,
        quantity: item.quantity
      });

      // 🔄 Tăng tồn kho của biến thể sản phẩm tương ứng
      await Product_variants.increment(
        { stock_quantity: item.quantity },
        { where: { id: item.product_variant_id }, transaction: t }
      );
    }

    // ✅ Cập nhật trạng thái đơn hàng thành "Đã huỷ"
    order.status = 'Đã hủy';
    await order.save({ transaction: t });

    // 💾 Commit transaction nếu không có lỗi
    await t.commit();
    return res.json({ success: true, message: 'Đã huỷ đơn hàng thành công' });

  } catch (error) {
    // ❗ Có lỗi xảy ra → rollback
    await t.rollback();
    console.error("Lỗi huỷ đơn:", error);
    return res.status(500).json({ success: false, message: 'Lỗi khi huỷ đơn hàng' });
  }
};
// Export các controller
module.exports =
{
    createOrder,
    vnpayReturn,
    danhSachOrder,
    updateOrderStatus,
    cancelOrder
};