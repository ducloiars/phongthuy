const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
  host: '103.97.126.246',
  port: 2018,
  username: 'root',
  password: 'HH2OmBWN'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('=== Đã kết nối SSH thành công ===');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    // Đảm bảo thư mục ke-hoach-kinh-doanh tồn tại trên VPS
    sftp.mkdir('/opt/my-website/ke-hoach-kinh-doanh', (mkdirErr) => {
      // Bỏ qua lỗi nếu thư mục đã tồn tại
      
      const filesToUpload = [
        { local: 'server.js', remote: '/opt/my-website/server.js' }
      ];
      
      const localDir = path.join(__dirname, 'ke-hoach-kinh-doanh');
      const filesInDir = fs.readdirSync(localDir);
      
      for (let file of filesInDir) {
        // Chỉ upload các file (bỏ qua thư mục con nếu có)
        const stats = fs.statSync(path.join(localDir, file));
        if (stats.isFile()) {
          // Normalize paths for SFTP (must use forward slashes on Linux VPS)
          filesToUpload.push({
            local: path.join('ke-hoach-kinh-doanh', file),
            remote: '/opt/my-website/ke-hoach-kinh-doanh/' + file
          });
        }
      }
      
      let uploadCount = 0;
      
      function uploadNext() {
        if (uploadCount >= filesToUpload.length) {
          console.log('=== Đã upload thành công tất cả các file ===');
          restartServer();
          return;
        }
        
        const file = filesToUpload[uploadCount];
        console.log(`Đang upload: ${file.local} -> ${file.remote}...`);
        
        sftp.fastPut(file.local, file.remote, (uploadErr) => {
          if (uploadErr) {
            console.error(`Lỗi khi upload file ${file.local}:`, uploadErr.message);
            conn.end();
            return;
          }
          console.log(`Đã xong: ${file.local}`);
          uploadCount++;
          uploadNext();
        });
      }
      
      uploadNext();
    });
  });
}).connect(config);

function restartServer() {
  console.log('Đang khởi động lại dịch vụ mywebsite trên VPS...');
  
  conn.exec('systemctl restart mywebsite', (err, stream) => {
    if (err) {
      console.error('Lỗi khi chạy lệnh restart:', err.message);
      conn.end();
      return;
    }
    
    stream.on('close', (code, signal) => {
      console.log(`Systemd service restart finished with code ${code}`);
      console.log('=== QUY TRÌNH DEPLOY HOÀN TẤT THÀNH CÔNG ===');
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.error('STDERR: ' + data);
    });
  });
}
