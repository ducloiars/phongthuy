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

    // 4. Nếu đơn hàng tạo ở trạng thái 'success', gửi Email xác nhận tự động qua Resend
    let emailResult = null;
    if (status === 'success') {
      try {
        const isDigital = ['ae2f7d29-7b56-442b-a24e-08bf4427cacf', '3753a9ee-d1da-4ea9-b687-75abff260b8f', 'eb2884be-9057-4b28-96ea-e978d9ad1f09'].includes(newOrder.product_id) || 
                          (newOrder.products?.name && (
                            newOrder.products.name.includes('Ads') || 
                            newOrder.products.name.includes('Thời Trang') || 
                            newOrder.products.name.includes('Telegram') || 
                            newOrder.products.name.includes('Tài liệu') ||
                            newOrder.products.name.includes('Ebook') ||
                            newOrder.products.name.includes('Sổ Tay') ||
                            newOrder.products.name.includes('Cẩm Nang') ||
                            newOrder.products.name.includes('Kịch Bản')
                          ));

        let subject, htmlContent, attachments;
        if (isDigital) {
          const host = req.headers.host || 'aikiemtien.online';
          let cleanHost = host;
          if (cleanHost.includes('localhost') || cleanHost.includes('127.0.0.1')) {
            cleanHost = 'aikiemtien.online';
          }
          const protocol = (cleanHost === 'aikiemtien.online') ? 'https' : 'http';
          const downloadLink = `${protocol}://${cleanHost}/download?orderId=${newOrder.id}`;
          const supportContact = 'https://t.me/tieuphaothu_bot';

          subject = `🎉 [${newOrder.products?.name || 'Tài liệu'}] — File của bạn đã sẵn sàng`;
          htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4af37; border-radius: 8px; background-color: #ffffff; color: #333333;">
              <h2 style="color: #b22222; text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">TÀI LIỆU ĐÃ SẴN SÀNG</h2>
              <p>Chào <strong>${customerName || 'bạn'}</strong>,</p>
              <p>Cảm ơn bạn đã mua <strong>${newOrder.products?.name || 'Tài liệu quảng cáo'}</strong>!</p>
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
          subject = `[NTPT] Xác nhận đơn hàng thành công #${newOrder.order_code}`;
          htmlContent = EMAIL_ORDER_CONFIRMATION;
          htmlContent = htmlContent.replace('{{product_name}}', newOrder.products?.name || 'Vật phẩm phong thủy');
          htmlContent = htmlContent.replace('{{amount}}', Number(newOrder.amount).toLocaleString());
          htmlContent = htmlContent.replace('{{order_code}}', newOrder.order_code);
        }

        emailResult = await sendEmail({
          to: customerEmail,
          subject,
          html: htmlContent,
          attachments
        });
      } catch (mailErr) {
        console.error('Lỗi khi gửi email xác nhận:', mailErr.message);
      }
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
