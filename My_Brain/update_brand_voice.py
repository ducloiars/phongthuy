import sqlite3
import datetime
import os

def insert_brand_voice():
    # Paths to databases (both the local copy in My_Brain and the active copy in the root directory)
    db_paths = ['brain.db', '../brain.db']
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    data = [
        ("Tone của tôi", "điềm tĩnh, gần gũi", now),
        ("Từ vựng thường dùng", "biết ơn, đơn giản, cuộc đời, số mệnh", now),
        ("Từ vựng không bao giờ dùng", "vl, đcm", now),
        ("Đối tượng độc giả", "trung niên, người có gia đình, thích suy ngẫm về cuộc đời", now),
        ("Ví dụ văn phong (Bài 1)", """Ở đời…
người thật sự tốt không cần nói quá nhiều về sự tử tế của mình.
🙂 Vì cái tâm…
không nằm ở lời nói hay đến đâu.
Mà nằm ở cách đối xử khi không ai nhìn thấy.
Có người nói chuyện rất hay.
Miệng lúc nào cũng đạo lý, nghĩa tình.
Nhưng khi đụng chuyện…
lại sống ích kỷ và lạnh lùng.
Ngược lại…
Có những người không giỏi nói lời đẹp.
Không khéo thể hiện.
Nhưng lúc mình khó khăn, họ âm thầm giúp.
Lúc mình mệt mỏi, họ thật lòng quan tâm.
🌿 Cuộc đời này nghe lời nói thì dễ…
nhìn vào hành động mới biết lòng người.
Bởi tốt bằng miệng thì ai cũng nói được.
Nhưng tốt bằng cái tâm…
phải là sự tử tế được giữ trong cách sống mỗi ngày.
Người sống có tâm thường không thích hơn thua.
Không thích làm tổn thương ai.
Và càng không cần phải chứng minh mình tốt với cả thế giới.
🙂 Vì thứ khiến một người được trân trọng lâu dài…
không phải họ nói gì về bản thân.
Mà là sau tất cả, họ đã sống như thế nào với người khác.
 #suyngam #songtichcuc #baihoccuocsong #longtot""", now),
        ("Ví dụ văn phong (Bài 2)", """Càng lớn…  
người ta càng hiểu rằng:
Không phải chuyện gì cũng cần lên tiếng.  
Không phải điều gì cũng nên đem ra bàn tán.
🌿 Chuyện chưa rõ đúng sai…  
đừng vội phán xét.
🌿 Chuyện không liên quan đến mình…  
đừng thêm thắt bằng vài câu nói vô tình.
🌿 Chuyện làm người khác tổn thương…  
im lặng đôi khi lại là một loại tử tế.
Có những vết thương không đến từ hành động…  
mà đến từ lời nói của người ngoài cuộc.
Một câu nói sau lưng có thể nhẹ với người nói,  
nhưng lại rất nặng với người nghe.
Người càng từng trải càng nói ít hơn.  
Không phải vì họ không biết chuyện…  
mà vì họ hiểu:
Có những điều giữ trong lòng còn có phúc hơn nói ra.
🙂 Ở đời,  
biết chuyện không khó…  
khó là biết chuyện nào nên nói và chuyện nào nên im lặng.
#songtichcuc #baihoccuocsong #suyngam #songtinhte""", now)
    ]

    for db_path in db_paths:
        try:
            # Resolve db path relative to script folder
            script_dir = os.path.dirname(os.path.abspath(__file__))
            full_path = os.path.join(script_dir, db_path)
            
            conn = sqlite3.connect(full_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM brand_voice") # clear existing
            cursor.executemany("INSERT INTO brand_voice (title, content, created_at) VALUES (?, ?, ?)", data)
            conn.commit()
            conn.close()
            print(f"Updated brand voice database at: {full_path}")
        except Exception as e:
            print(f"Error updating {db_path}: {e}")

if __name__ == '__main__':
    insert_brand_voice()
