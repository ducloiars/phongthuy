const fs = require('fs');
const path = require('path');

// Hàm đọc API Key từ env
function getApiKey() {
  return process.env.RESEND_API_KEY;
}

/**
 * Gửi email qua Resend REST API
 * @param {Object} options
 * @param {string} options.to - Địa chỉ email người nhận
 * @param {string} options.subject - Tiêu đề email
 * @param {string} options.html - Nội dung HTML của email
 * @param {string} [options.from] - Người gửi (mặc định là 'onboarding@resend.dev')
 */
async function sendEmail({ to, subject, html, from = 'Nghệ Thuật Phong Thủy <onboarding@resend.dev>', attachments }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Không tìm thấy Resend API Key trong file resend_config.txt hoặc biến môi trường.');
  }

  // Resend yêu cầu email gửi đi trong chế độ sandbox (chưa verify domain) phải gửi từ onboarding@resend.dev
  // và người nhận phải là email đã đăng ký tài khoản Resend.
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ntpt-app/1.0'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      attachments
    })
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.message || JSON.stringify(resData));
  }

  return resData;
}

module.exports = { sendEmail };
