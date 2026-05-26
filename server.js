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

// --- BẮT ĐẦU CẤU HÌNH DEPLOY KẾ HOẠCH KINH DOANH ---
const fs = require('fs');

function renderMarkdown(title, markdown) {
  let htmlContent = '';
  const lines = markdown.split('\n');
  let inList = false;
  let inTable = false;
  let tableHeaders = [];
  
  for (let line of lines) {
    let trimmed = line.trim();
    
    // Xuất thẳng các thẻ HTML và comment mà không bọc trong thẻ p
    if (trimmed.startsWith('<') || trimmed.startsWith('<!--')) {
      htmlContent += parseInline(trimmed) + '\n';
      continue;
    }
    
    // Xử lý Table
    if (trimmed.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        htmlContent += '<div class="table-wrapper"><table>';
      }
      
      const cells = trimmed.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
      if (trimmed.includes('---')) {
        continue;
      }
      
      if (!tableHeaders.length) {
        tableHeaders = cells;
        htmlContent += '<thead><tr>';
        for (let cell of cells) {
          htmlContent += `<th>${parseInline(cell)}</th>`;
        }
        htmlContent += '</tr></thead><tbody>';
      } else {
        htmlContent += '<tr>';
        for (let cell of cells) {
          htmlContent += `<td>${parseInline(cell)}</td>`;
        }
        htmlContent += '</tr>';
      }
      continue;
    } else if (inTable) {
      inTable = false;
      tableHeaders = [];
      htmlContent += '</tbody></table></div>';
    }
    
    // Đóng danh sách nếu dòng tiếp theo không phải bullet point
    if (!trimmed.startsWith('-') && !trimmed.startsWith('*') && !trimmed.startsWith('•') && !/^\d+\.\s+/.test(trimmed)) {
      if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }
    }
    
    // Headers
    if (trimmed.startsWith('# ')) {
      htmlContent += `<h1>${parseInline(trimmed.substring(2))}</h1>`;
    } else if (trimmed.startsWith('## ')) {
      htmlContent += `<h2>${parseInline(trimmed.substring(3))}</h2>`;
    } else if (trimmed.startsWith('### ')) {
      htmlContent += `<h3>${parseInline(trimmed.substring(4))}</h3>`;
    } else if (trimmed.startsWith('#### ')) {
      htmlContent += `<h4>${parseInline(trimmed.substring(5))}</h4>`;
    } else if (trimmed.startsWith('>') || trimmed.startsWith('▸')) {
      let content = trimmed.startsWith('>') ? trimmed.substring(1).trim() : trimmed.substring(1).trim();
      htmlContent += `<blockquote>${parseInline(content)}</blockquote>`;
    } else if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
      if (!inList) {
        htmlContent += '<ul>';
        inList = true;
      }
      let content = trimmed.substring(1).trim();
      if (content.startsWith('[ ]')) {
        htmlContent += `<li class="todo-item"><input type="checkbox" disabled> ${parseInline(content.substring(3))}</li>`;
      } else if (content.startsWith('[x]')) {
        htmlContent += `<li class="todo-item"><input type="checkbox" checked disabled> ${parseInline(content.substring(3))}</li>`;
      } else {
        htmlContent += `<li>${parseInline(content)}</li>`;
      }
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList) {
        htmlContent += '<ol>';
        inList = true;
      }
      let content = trimmed.replace(/^\d+\.\s+/, '');
      htmlContent += `<li>${parseInline(content)}</li>`;
    } else if (trimmed === '---' || trimmed === '══════════════════════════════════════════════════' || trimmed === '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' || trimmed === '═══════════════════════════════════════════════════') {
      htmlContent += '<hr>';
    } else if (trimmed === '') {
      htmlContent += '<p class="empty-line"></p>';
    } else {
      htmlContent += `<p>${parseInline(trimmed)}</p>`;
    }
  }
  
  if (inList) {
    htmlContent += '</ul>';
  }
  if (inTable) {
    htmlContent += '</tbody></table></div>';
  }
  
  function parseInline(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, (match, p1, p2) => {
        let url = p2;
        if (url.includes('ke-hoach-kinh-doanh/')) {
          url = '/ke-hoach/' + url.split('ke-hoach-kinh-doanh/')[1];
        } else if (url.startsWith('file:///')) {
          url = '/ke-hoach/' + url.substring(url.lastIndexOf('/') + 1);
        }
        return `<a href="${url}">${p1}</a>`;
      });
  }
  
  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title.replace('.md', '')} — Đức Lợi AI</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --color-bg-dark: #090d16;
            --color-bg-card: #121824;
            --color-text-primary: #f8fafc;
            --color-text-secondary: #94a3b8;
            --color-primary: #6366f1;
            --color-accent-green: #10b981;
            --color-accent-orange: #f59e0b;
            --color-accent-red: #ef4444;
            --glass-border: rgba(255, 255, 255, 0.08);
        }
        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--color-bg-dark);
            color: var(--color-text-primary);
            line-height: 1.8;
            padding: 3rem 1.5rem;
            max-width: 900px;
            margin: 0 auto;
        }
        a.back-btn {
            display: inline-flex;
            align-items: center;
            color: var(--color-primary);
            text-decoration: none;
            font-weight: 600;
            margin-bottom: 2rem;
            font-size: 0.95rem;
            transition: transform 0.2s;
        }
        a.back-btn:hover {
            transform: translateX(-3px);
        }
        h1 {
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            line-height: 1.2;
            margin-bottom: 1.5rem;
            background: linear-gradient(135deg, #ffffff, #a5b4fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            border-bottom: 1px solid var(--glass-border);
            padding-bottom: 1rem;
        }
        h2 {
            font-family: 'Playfair Display', serif;
            font-size: 1.7rem;
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            color: #e2e8f0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding-bottom: 0.5rem;
        }
        h3 {
            font-size: 1.25rem;
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: var(--color-primary);
        }
        h4 {
            font-size: 1.1rem;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            color: var(--color-text-primary);
        }
        p {
            color: var(--color-text-secondary);
            margin-bottom: 1rem;
        }
        p.empty-line {
            margin: 0;
            height: 0.5rem;
        }
        ul, ol {
            margin-bottom: 1.5rem;
            padding-left: 1.5rem;
        }
        li {
            color: var(--color-text-secondary);
            margin-bottom: 0.5rem;
        }
        li strong {
            color: var(--color-text-primary);
        }
        div li, div li strong {
            color: inherit;
        }
        li.todo-item {
            list-style: none;
            padding-left: 0;
        }
        li.todo-item input[type="checkbox"] {
            margin-right: 0.5rem;
        }
        blockquote {
            background: rgba(99, 102, 241, 0.05);
            border-left: 4px solid var(--color-primary);
            padding: 1rem 1.5rem;
            margin: 1.5rem 0;
            border-radius: 0 12px 12px 0;
            font-style: italic;
        }
        blockquote p {
            color: #a5b4fc;
            margin-bottom: 0;
        }
        hr {
            border: 0;
            height: 1px;
            background: var(--glass-border);
            margin: 2.5rem 0;
        }
        code {
            font-family: monospace;
            background: rgba(255, 255, 255, 0.08);
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.9rem;
            color: #fca5a5;
        }
        a {
            color: var(--color-primary);
            text-decoration: none;
            transition: color 0.2s;
        }
        a:hover {
            color: #818cf8;
            text-decoration: underline;
        }
        .table-wrapper {
            overflow-x: auto;
            margin: 2rem 0;
            border-radius: 12px;
            border: 1px solid var(--glass-border);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.95rem;
        }
        th, td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid var(--glass-border);
        }
        th {
            background-color: var(--color-bg-card);
            color: var(--color-text-primary);
            font-weight: 600;
        }
        td {
            color: var(--color-text-secondary);
        }
        tr:last-child td {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <a href="/ke-hoach" class="back-btn">← Quay lại trang kế hoạch</a>
    <div class="content">
        ${htmlContent}
    </div>
</body>
</html>`;
}

// Phục vụ trang kế hoạch chính và tự động redirect nếu thiếu dấu gạch chéo
app.get('/ke-hoach', (req, res) => {
  if (!req.path.endsWith('/')) {
    return res.redirect(301, '/ke-hoach/');
  }
  res.sendFile(path.join(__dirname, 'ke-hoach-kinh-doanh', 'index.html'));
});

// Phục vụ các tài liệu chi tiết (MD hoặc HTML)
app.get('/ke-hoach/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'ke-hoach-kinh-doanh', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.redirect('/ke-hoach/');
  }
  
  if (filename.endsWith('.md')) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Lỗi đọc file tài liệu.');
      res.send(renderMarkdown(filename, data));
    });
  } else {
    res.sendFile(filePath);
  }
});
// --- KẾT THÚC CẤU HÌNH DEPLOY KẾ HOẠCH KINH DOANH ---

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
