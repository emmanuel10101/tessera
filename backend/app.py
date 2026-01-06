from flask import Flask, jsonify, make_response
import sqlite3
 
app = Flask(__name__)
 
def get_db_connection():
    conn = sqlite3.connect('../database/tessera.db')
    conn.row_factory = sqlite3.Row
    return conn
 
@app.route('/names')
def names():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM demo')
    names = cur.fetchall()
    conn.close()
    names_list = [name['names'] for name in names]
    
    # Create a response object and set CORS headers
    response = make_response(jsonify(names_list))
    response.headers['Access-Control-Allow-Origin'] = '*'  # Allow all domains
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST'  # Specify methods to allow
    return response
 
 
if __name__ == '__main__':
    app.run(debug=True)