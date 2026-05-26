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
        .select('*, customers(name, email, phone), products(name)')
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
            
            console.log("Processing order for email confirmation:", {
              order_id: order.id,
              product_id: order.product_id,
              product_name: order.products?.name,
              customer_email: order.customers?.email
            });
            
            const isDigital = ['ae2f7d29-7b56-442b-a24e-08bf4427cacf', '3753a9ee-d1da-4ea9-b687-75abff260b8f', 'eb2884be-9057-4b28-96ea-e978d9ad1f09'].includes(order.product_id) || 
                              (order.products?.name && (
                                order.products.name.includes('Ads') || 
                                order.products.name.includes('Thời Trang') || 
                                order.products.name.includes('Telegram') || 
                                order.products.name.includes('Tài liệu') ||
                                order.products.name.includes('Ebook') ||
                                order.products.name.includes('Sổ Tay') ||
                                order.products.name.includes('Cẩm Nang') ||
                                order.products.name.includes('Kịch Bản')
                              ));

            let subject, htmlContent, attachments;
            if (isDigital) {
              let host = req.headers.host || 'aikiemtien.online';
              if (host.includes('localhost') || host.includes('127.0.0.1')) {
                host = 'aikiemtien.online';
              }
              // Caddy runs HTTPS on production, so default to https
              const protocol = (host === 'aikiemtien.online') ? 'https' : 'http';
              const downloadLink = `${protocol}://${host}/download?orderId=${order.id}`;
              const supportContact = 'https://t.me/tieuphaothu_bot';

              subject = `🎉 [${order.products?.name || 'Tài liệu'}] — File của bạn đã sẵn sàng`;
              htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4af37; border-radius: 8px; background-color: #ffffff; color: #333333;">
                  <h2 style="color: #b22222; text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">TÀI LIỆU ĐÃ SẴN SÀNG</h2>
                  <p>Chào <strong>${order.customers?.name || 'bạn'}</strong>,</p>
                  <p>Cảm ơn bạn đã mua <strong>${order.products?.name || 'Tài liệu quảng cáo'}</strong>!</p>
                  <p>Bấm vào link dưới để tải file về máy:</p>
                  <p style="text-align: center; margin: 25px 0;">
                    <a href="${downloadLink}" style="background-color: #b22222; color: #ffffff; padding: 15px 30px; font-weight: bold; text-decoration: none; border-radius: 5px; font-size: 1.1rem; display: inline-block; box-shadow: 0 4px 10px rgba(178, 34, 34, 0.3);">→ TẢI FILE XUỐNG NGAY</a>
                  </p>
                  <p>Hoặc copy liên kết này dán vào trình duyệt: <a href="${downloadLink}">${downloadLink}</a></p>
                  <p>Lưu email này lại nếu cần tải lại sau nhé.</p>
                  <p>Nếu cần hỗ trợ: <a href="${supportContact}">${supportContact}</a></p>
                  <br>
                  <p><strong>Duc Loi AI</strong></p>
                  <p><a href="http://aikiemtien.online">aikiemtien.online</a></p>
                </div>
              `;

              // Đọc và đính kèm file PDF trực tiếp vào email
              const fs = require('fs');
              const path = require('path');
              const filePath = path.join(__dirname, '../EbookQuytrinhadsthoitrang.pdf');
              if (fs.existsSync(filePath)) {
                try {
                  const fileContent = fs.readFileSync(filePath);
                  attachments = [
                    {
                      filename: 'EbookQuytrinhadsthoitrang.pdf',
                      content: fileContent.toString('base64')
                    }
                  ];
                  console.log("Attached PDF to email successfully.");
                } catch (readErr) {
                  console.error("Lỗi khi đọc file đính kèm:", readErr.message);
                }
              } else {
                console.error("File PDF đính kèm không tồn tại:", filePath);
              }
            } else {
              const { EMAIL_ORDER_CONFIRMATION } = require('./_templates');
              subject = `[NTPT] Xác nhận thanh toán thành công đơn hàng #${order.order_code}`;
              htmlContent = EMAIL_ORDER_CONFIRMATION;
              htmlContent = htmlContent.replace('{{product_name}}', order.products?.name || 'Vật phẩm phong thủy');
              htmlContent = htmlContent.replace('{{amount}}', Number(order.amount).toLocaleString());
              htmlContent = htmlContent.replace('{{order_code}}', order.order_code || order.id.substring(0,8).toUpperCase());
            }

            await sendEmail({
              to: order.customers.email,
              subject,
              html: htmlContent,
              attachments
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
