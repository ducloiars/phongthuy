import sqlite3
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

def dump_db():
    conn = sqlite3.connect('brain.db')
    cursor = conn.cursor()
    
    print("--- BRAND VOICE ---")
    cursor.execute("SELECT * FROM brand_voice")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- BUSINESS ---")
    cursor.execute("SELECT * FROM business")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- KNOWLEDGE ---")
    cursor.execute("SELECT * FROM knowledge")
    for row in cursor.fetchall():
        print(row)
        
    conn.close()

if __name__ == '__main__':
    dump_db()

