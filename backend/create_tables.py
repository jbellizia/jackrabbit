import os
import pymysql

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME", "jackrabbitrecords")  # default DB name

def get_conn(database=None):
    """Return a pymysql connection to a given database (or no database)."""
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=database,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

def create_database_if_not_exists():
    """Create the database if it doesn't exist."""
    conn = get_conn()  # connect without specifying a DB
    try:
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`;")
        print(f"Database '{DB_NAME}' ensured to exist.")
    finally:
        cursor.close()
        conn.close()

def create_tables():
    """Create tables inside the database."""
    conn = get_conn(DB_NAME)
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title TEXT,
                blurb TEXT,
                writeup TEXT,
                media_type TEXT NOT NULL,
                media_href TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_visible TINYINT DEFAULT 1
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS about (
                id INT AUTO_INCREMENT PRIMARY KEY,
                header TEXT,
                body TEXT,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("Tables created or already exist.")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_database_if_not_exists()
    create_tables()
