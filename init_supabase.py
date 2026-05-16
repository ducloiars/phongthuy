import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Service role key is needed to execute SQL

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env file.")
    exit(1)

supabase: Client = create_client(url, key)

def initialize_database():
    print("Initializing Supabase tables...")
    
    # Read the SQL file
    with open('setup_database.sql', 'r') as f:
        sql = f.read()

    # In Supabase Python client, we can't directly execute arbitrary SQL via the client easily 
    # without using a PostgreSQL library or a specific RPC.
    # However, we can use the 'supabase' library to interact with tables.
    # To CREATE tables via API, it's actually better to use the SQL Editor in the Dashboard.
    
    print("\n--- ACTION REQUIRED ---")
    print("To create the tables 'ngay lập tức', please follow these steps:")
    print("1. Go to your Supabase Dashboard: https://supabase.com/dashboard")
    print("2. Select your project.")
    print("3. Click on 'SQL Editor' in the left sidebar.")
    print("4. Click 'New query'.")
    print("5. Paste the content of 'setup_database.sql' into the editor.")
    print("6. Click 'Run'.")
    print("------------------------\n")

if __name__ == "__main__":
    initialize_database()
