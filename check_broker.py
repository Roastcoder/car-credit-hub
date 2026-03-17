import psycopg2
from urllib.parse import unquote

# Database connection
conn_string = "postgres://mehar:Mehar%406378110608@187.77.187.120:5431/meh"
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
    
    # Check if broker table exists
    cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE '%broker%'
    """)
    tables = cursor.fetchall()
    print("Broker-related tables:", tables)
    
    # If broker table exists, show its structure and data
    if tables:
        table_name = tables[0][0]
        
        # Show table structure
        cursor.execute(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}'
        """)
        columns = cursor.fetchall()
        print(f"\n{table_name} structure:")
        for col in columns:
            print(f"  {col[0]}: {col[1]}")
        
        # Show data
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 10")
        rows = cursor.fetchall()
        print(f"\n{table_name} data ({len(rows)} rows):")
        for row in rows:
            print(row)
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")