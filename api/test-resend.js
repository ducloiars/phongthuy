const { sendEmail } = require('./_resend');

module.exports = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Vui lòng cung cấp email nhận test qua query parameter. Ví dụ: /api/test-resend?email=your-email@gmail.com' 
    });
  }

  try {
    const result = await sendEmail({
      to: email,
      subject: 'Kiểm tra kết nối Resend - Nghệ Thuật Phong Thủy',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4af37; border-radius: 8px;">
          <h2 style="color: #b22222; text-align: center;">Kết Nối Resend Thành Công!</h2>
          <p>Xin chào,</p>
          <p>Đây là email tự động gửi từ hệ thống <strong>Nghệ Thuật Phong Thủy</strong> của bạn để kiểm tra kết nối với Resend.</p>
          <p>Nếu bạn nhận được email này, có nghĩa là API Key của bạn đã hoạt động hoàn hảo và website đã sẵn sàng kết nối tự động!</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8rem; color: #777; text-align: center;">Hệ thống email marketing tự động NTPT</p>
        </div>
      `
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Đã gửi email test thành công qua Resend!',
      data: result
    });
  } catch (error) {
    console.error('Lỗi gửi mail test:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
