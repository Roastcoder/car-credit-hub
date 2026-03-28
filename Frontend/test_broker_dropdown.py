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
    
    # Get brokers with DSA codes (first 10 for testing)
    cursor.execute("""
        SELECT id, name, dsa_code 
        FROM brokers 
        WHERE dsa_code IS NOT NULL 
        ORDER BY CAST(dsa_code AS INTEGER) 
        LIMIT 10
    """)
    
    brokers = cursor.fetchall()
    
    print("Broker dropdown format preview:")
    print("=" * 50)
    
    for broker in brokers:
        broker_id, name, dsa_code = broker
        dropdown_text = f"{name} ({dsa_code})" if dsa_code else name
        print(f"ID: {broker_id} | Display: {dropdown_text}")
    
    print(f"\nTotal brokers with DSA codes: {len(brokers)}")
    
    # Check total count
    cursor.execute("SELECT COUNT(*) FROM brokers WHERE dsa_code IS NOT NULL")
    total_count = cursor.fetchone()[0]
    print(f"Total brokers with DSA codes in database: {total_count}")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")