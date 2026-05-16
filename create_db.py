import sqlite3
import datetime

def create_db():
    conn = sqlite3.connect('brain.db')
    cursor = conn.cursor()

    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS knowledge (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS business (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS brand_voice (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Insert sample data
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    knowledge_data = [
        ("Bài học từ khách hàng", "Khách hàng luôn thích sự đơn giản và rõ ràng.", now),
        ("Insight thị trường", "Nhu cầu sử dụng AI đang tăng cao trong năm nay.", now)
    ]
    cursor.executemany("INSERT INTO knowledge (title, content, created_at) VALUES (?, ?, ?)", knowledge_data)
    
    business_data = [
        ("Sản phẩm khóa học AI", "Giúp người mới bắt đầu ứng dụng AI vào công việc.", now),
        ("Khách hàng mục tiêu", "Dân văn phòng, người kinh doanh online.", now)
    ]
    cursor.executemany("INSERT INTO business (title, content, created_at) VALUES (?, ?, ?)", business_data)
    
    brand_voice_data = [
        ("Tone chung", "Gần gũi, thực tế, dễ hiểu.", now),
        ("Từ vựng thường dùng", "Đơn giản thôi, bắt đầu ngay, không cần phức tạp.", now)
    ]
    cursor.executemany("INSERT INTO brand_voice (title, content, created_at) VALUES (?, ?, ?)", brand_voice_data)

    conn.commit()
    conn.close()
    print("Database created and sample data inserted successfully.")

if __name__ == '__main__':
    create_db()
