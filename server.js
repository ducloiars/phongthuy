const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kiểm tra xem các biến môi trường của Supabase đã được load chưa
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ CẢNH BÁO: SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình trong file .env');
}

// Import và gắn webhook handler của SePay cùng các API endpoints khác
const sepayWebhookHandler = require('./api/sepay-webhook');
app.all('/api/sepay-webhook', sepayWebhookHandler);

app.all('/api/waitlist', require('./api/waitlist'));
app.all('/api/admin-create-order', require('./api/admin-create-order'));
app.all('/api/send-order-confirmation', require('./api/send-order-confirmation'));
app.all('/api/test-resend', require('./api/test-resend'));
app.all('/api/cron-send-emails', require('./api/cron-send-emails'));

// Phục vụ (serve) các file giao diện tĩnh từ thư mục hiện tại
app.use(express.static(__dirname));

// Route định tuyến cho các trang HTML tĩnh (Clean URLs)
app.get('/san-pham/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'product-landing.html'));
});
app.get('/san-pham/:slug/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'product-checkout.html'));
});
app.get('/san-pham/:slug/cam-on', (req, res) => {
  res.sendFile(path.join(__dirname, 'product-thankyou.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('/sanpham', (req, res) => {
  res.sendFile(path.join(__dirname, 'sanpham.html'));
});
app.get('/san-pham', (req, res) => {
  res.sendFile(path.join(__dirname, 'sanpham.html'));
});
app.get('/thanh-toan', (req, res) => {
  res.sendFile(path.join(__dirname, 'thanh-toan.html'));
});
app.get('/thank-you', (req, res) => {
  res.sendFile(path.join(__dirname, 'thank-you.html'));
});
app.get('/thank-you-mua-hang', (req, res) => {
  res.sendFile(path.join(__dirname, 'thank-you-mua-hang.html'));
});

// Endpoint tải file PDF sản phẩm số an toàn (sau khi đã thanh toán)
app.get('/download', async (req, res) => {
  const { orderId } = req.query;
  if (!orderId) {
    return res.status(400).send('Thiếu mã đơn hàng (orderId)');
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Kiểm tra đơn hàng trong DB
    const { data: order, error } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).send('Không tìm thấy đơn hàng!');
    }

    if (order.status !== 'success') {
      return res.status(403).send('Đơn hàng chưa được thanh toán thành công!');
    }

    const filePath = path.join(__dirname, 'EbookQuytrinhadsthoitrang.pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="EbookQuytrinhadsthoitrang.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);

  } catch (err) {
    console.error('Lỗi khi tải file:', err);
    res.status(500).send('Lỗi máy chủ hệ thống');
  }
});

// Route mặc định dẫn về index.html cho các đường dẫn lạ
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Khởi chạy server Express
app.listen(PORT, () => {
  console.log('==================================================');
  console.log(`🚀 WEB SERVER ĐANG CHẠY TRÊN PORT: ${PORT}`);
  console.log(`📂 Đang phục vụ files giao diện từ: ${__dirname}`);
  console.log(`🔗 Endpoint Webhook SePay: http://localhost:${PORT}/api/sepay-webhook`);
  console.log('==================================================');
});
