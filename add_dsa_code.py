import psycopg2
from urllib.parse import unquote

# Database connection
password = unquote("Mehar%406378110608")

try:
    conn = psycopg2.connect(
        host="187.77.187.120",
        port=5431,
        database="meh",
        user="mehar",
        password=password
    )
    
    cursor = conn.cursor()
    
    # Add dsa_code column
    cursor.execute("ALTER TABLE brokers ADD COLUMN dsa_code VARCHAR(50)")
    conn.commit()
    
    print("Successfully added dsa_code column to brokers table")
    
    # Verify the column was added
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'brokers'
        ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    print("\nUpdated table structure:")
    for col in columns:
        print(f"  {col[0]}: {col[1]}")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")