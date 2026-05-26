const { Client } = require('ssh2');

const config = {
  host: '103.97.126.246',
  port: 2018,
  username: 'root',
  password: 'HH2OmBWN'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('=== Đã kết nối SSH thành công ===');
  
  // List systemd services
  conn.exec('find /etc/systemd/system -name "*.service" -maxdepth 2', (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('Services:\n' + data);
    }).stderr.on('data', (data) => {
      console.error('STDERR: ' + data);
    });
  });
}).connect(config);
