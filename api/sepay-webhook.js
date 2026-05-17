const { createClient } = require('@supabase/supabase-js');

// Khởi tạo Supabase client dùng Service Role Key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // GET handler for testing connectivity
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'active', 
      message: 'SePay Webhook (CommonJS) is ready' 
    });
  }

  // POST handler for SePay
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = req.body;
    const content = data.content || '';
    const orderIdMatch = content.match(/NTPT\d+/i);
    
    if (orderIdMatch) {
      const orderIdPart = orderIdMatch[0].toUpperCase();
      
      const { data: order, error: findError } = await supabase
        .from('orders')
        .select('*, customers(email), products(name)')
        .eq('order_code', orderIdPart)
        .eq('status', 'pending')
        .single();

      if (order) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'success' })
          .eq('id', order.id);

        if (updateError) {
          return res.status(500).json({ success: false, error: 'Database update failed' });
        }

        // Gửi email xác nhận tự động qua Resend
        if (order.customers?.email) {
          try {
            const { sendEmail } = require('./_resend');
            const { EMAIL_ORDER_CONFIRMATION } = require('./_templates');
            
            let htmlContent = EMAIL_ORDER_CONFIRMATION;
            htmlContent = htmlContent.replace('{{product_name}}', order.products?.name || 'Vật phẩm phong thủy');
            htmlContent = htmlContent.replace('{{amount}}', Number(order.amount).toLocaleString());
            htmlContent = htmlContent.replace('{{order_code}}', order.order_code || order.id.substring(0,8).toUpperCase());

            await sendEmail({
              to: order.customers.email,
              subject: `[NTPT] Xác nhận thanh toán thành công đơn hàng #${order.order_code}`,
              html: htmlContent
            });
          } catch (mailErr) {
            console.error('Lỗi khi gửi email xác nhận tự động:', mailErr.message);
          }
        }

        return res.status(200).json({ success: true, message: 'Order updated to success and confirmation email sent' });
      }
    }
    return res.status(200).json({ success: false, message: 'No matching order found' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
