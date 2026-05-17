const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./_resend');
const { EMAIL_ORDER_CONFIRMATION } = require('./_templates');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const orderId = req.query.orderId || (req.body && req.body.orderId);

  if (!orderId) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin orderId' });
  }

  try {
    // 1. Tải thông tin đơn hàng đầy đủ
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, customers(*), products(*)')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng trong hệ thống' });
    }

    const customerEmail = order.customers?.email;
    if (!customerEmail) {
      return res.status(400).json({ success: false, error: 'Khách hàng của đơn hàng này không có Email để nhận thông báo' });
    }

    // 2. Điền thông tin vào template email
    let htmlContent = EMAIL_ORDER_CONFIRMATION;
    htmlContent = htmlContent.replace('{{product_name}}', order.products?.name || 'Vật phẩm phong thủy');
    htmlContent = htmlContent.replace('{{amount}}', Number(order.amount).toLocaleString());
    htmlContent = htmlContent.replace('{{order_code}}', order.order_code || order.id.substring(0,8).toUpperCase());

    // 3. Gửi email qua Resend
    const result = await sendEmail({
      to: customerEmail,
      subject: `[NTPT] Xác nhận đơn hàng thành công #${order.order_code || order.id.substring(0,8).toUpperCase()}`,
      html: htmlContent
    });

    return res.status(200).json({
      success: true,
      message: 'Đã gửi email xác nhận đơn hàng thành công!',
      data: result
    });

  } catch (error) {
    console.error('Lỗi khi gửi mail xác nhận đơn hàng:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
