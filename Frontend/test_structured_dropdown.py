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
    
    # Get brokers with DSA codes sorted by DSA code
    cursor.execute("""
        SELECT id, name, dsa_code 
        FROM brokers 
        WHERE dsa_code IS NOT NULL 
        ORDER BY CAST(dsa_code AS INTEGER) 
        LIMIT 20
    """)
    
    brokers = cursor.fetchall()
    
    print("NEW STRUCTURED BROKER DROPDOWN FORMAT:")
    print("=" * 60)
    print("Format: DSA-XXX | Broker Name")
    print("=" * 60)
    
    for broker in brokers:
        broker_id, name, dsa_code = broker
        # Format: DSA-001 | Broker Name
        formatted_dsa = f"DSA-{str(dsa_code).zfill(3)}"
        dropdown_text = f"{formatted_dsa} | {name}"
        print(f"{dropdown_text}")
    
    print("\n" + "=" * 60)
    
    # Show some higher numbers too
    cursor.execute("""
        SELECT id, name, dsa_code 
        FROM brokers 
        WHERE dsa_code IS NOT NULL 
        AND CAST(dsa_code AS INTEGER) > 100
        ORDER BY CAST(dsa_code AS INTEGER) 
        LIMIT 10
    """)
    
    high_brokers = cursor.fetchall()
    print("SAMPLE HIGH DSA CODES:")
    print("-" * 40)
    
    for broker in high_brokers:
        broker_id, name, dsa_code = broker
        formatted_dsa = f"DSA-{str(dsa_code).zfill(3)}"
        dropdown_text = f"{formatted_dsa} | {name}"
        print(f"{dropdown_text}")
    
    # Check total count
    cursor.execute("SELECT COUNT(*) FROM brokers WHERE dsa_code IS NOT NULL")
    total_count = cursor.fetchone()[0]
    print(f"\nTotal brokers with DSA codes: {total_count}")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")