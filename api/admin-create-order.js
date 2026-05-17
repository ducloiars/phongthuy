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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { customerName, customerPhone, customerEmail, productId, amount, address, ghiChu, status } = req.body;

    if (!customerName || !customerPhone || !customerEmail || !productId || !amount) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đầy đủ thông tin: Tên, SĐT, Email, Sản phẩm, Số tiền.' });
    }

    // 1. Tìm hoặc tạo khách hàng dựa trên Email hoặc SĐT
    let customerId;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();

    const cleanPhone = customerPhone.replace(/[\s\-\.]/g, '');

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Cập nhật SĐT nếu thay đổi
      await supabase
        .from('customers')
        .update({ name: customerName, phone: cleanPhone })
        .eq('id', customerId);
    } else {
      const { data: newCustomer, error: custErr } = await supabase
        .from('customers')
        .insert([{ name: customerName, phone: cleanPhone, email: customerEmail }])
        .select()
        .single();
      
      if (custErr) throw custErr;
      customerId = newCustomer.id;
    }

    // 2. Tạo mã đơn hàng ngẫu nhiên dạng NTPT + timestamp
    const orderCode = 'NTPT' + Math.floor(Date.now() / 1000);

    // 3. Tạo đơn hàng mới
    const { data: newOrder, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        order_code: orderCode,
        customer_id: customerId,
        product_id: productId,
        amount: parseFloat(amount),
        address: address || 'Tạo bởi Admin',
        ghi_chu: ghiChu || 'Tạo thủ công từ Admin Panel',
        status: status || 'pending'
      }])
      .select('*, products(*)')
      .single();

    if (orderErr) throw orderErr;

    // 4. Nếu đơn hàng tạo ở trạng thái 'success' hoặc 'pending', gửi Email xác nhận luôn
    let emailResult = null;
    try {
      let htmlContent = EMAIL_ORDER_CONFIRMATION;
      htmlContent = htmlContent.replace('{{product_name}}', newOrder.products?.name || 'Vật phẩm phong thủy');
      htmlContent = htmlContent.replace('{{amount}}', Number(newOrder.amount).toLocaleString());
      htmlContent = htmlContent.replace('{{order_code}}', newOrder.order_code);

      emailResult = await sendEmail({
        to: customerEmail,
        subject: `[NTPT] Xác nhận đơn hàng thành công #${newOrder.order_code}`,
        html: htmlContent
      });
    } catch (mailErr) {
      console.error('Lỗi khi gửi email xác nhận:', mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Tạo đơn hàng mới và gửi email xác nhận thành công!',
      order: newOrder,
      emailResult
    });

  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng từ admin:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
