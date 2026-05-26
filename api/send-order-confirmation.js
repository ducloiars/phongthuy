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
      const host = req.headers.host || 'aikiemtien.online';
      let cleanHost = host;
      if (cleanHost.includes('localhost') || cleanHost.includes('127.0.0.1')) {
        cleanHost = 'aikiemtien.online';
      }
      const protocol = (cleanHost === 'aikiemtien.online') ? 'https' : 'http';
      const downloadLink = `${protocol}://${cleanHost}/download?orderId=${order.id}`;
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
        } catch (readErr) {
          console.error("Lỗi khi đọc file đính kèm:", readErr.message);
        }
      }
    } else {
      subject = `[NTPT] Xác nhận đơn hàng thành công #${order.order_code || order.id.substring(0,8).toUpperCase()}`;
      htmlContent = EMAIL_ORDER_CONFIRMATION;
      htmlContent = htmlContent.replace('{{product_name}}', order.products?.name || 'Vật phẩm phong thủy');
      htmlContent = htmlContent.replace('{{amount}}', Number(order.amount).toLocaleString());
      htmlContent = htmlContent.replace('{{order_code}}', order.order_code || order.id.substring(0,8).toUpperCase());
    }

    // 3. Gửi email qua Resend
    const result = await sendEmail({
      to: customerEmail,
      subject,
      html: htmlContent,
      attachments
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
