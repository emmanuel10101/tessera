import hashlib
from flask import Flask, jsonify, make_response, request
import sqlite3
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# This function returns a connection to the database which can be used to send SQL commands to the database
def get_db_connection():
  conn = sqlite3.connect('../database/tessera.db')
  conn.row_factory = sqlite3.Row
  return conn

# Endpoint for getting events, with optional date filtering
@app.route('/events', methods=['GET'])
def get_events():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Start with the base SQL query
    query = 'SELECT * FROM Events'
    params = []
    
    # Check if the 'afterDate' parameter is provided in the query string
    after_date = request.args.get('afterDate')
    if after_date:
        query += ' WHERE date > ?'
        params.append(after_date)
    
    # Execute the query with or without the date filter
    cursor.execute(query, params)
    events = cursor.fetchall()
    
    # Convert the rows to dictionaries to make them serializable
    events_list = [dict(event) for event in events]
    
    conn.close()
    
    return jsonify(events_list)

# Endpoint for creating a new user
@app.route('/user', methods=['POST'])
def create_user():
    # Extract email, username, and password from the JSON payload
    email = request.json.get('email')
    username = request.json.get('username')
    password = request.json.get('password')

    # Basic validation to ensure all fields are provided
    if not email or not username or not password:
        return jsonify({'error': 'All fields (email, username, and password) are required.'}), 400

    # Hash the password
    hashed_password = hashlib.sha256(password.encode()).hexdigest() # not using generate_password_hash here to test why its not matching

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Attempt to insert the new user into the Users table
        cursor.execute('INSERT INTO Users (email, username, password_hash) VALUES (?, ?, ?)',
                       (email, username, hashed_password))
        conn.commit()  # Commit the changes to the database

        # Retrieve the user_id of the newly created user to confirm creation
        cursor.execute('SELECT user_id FROM Users WHERE username = ?', (username,))
        new_user_id = cursor.fetchone()

        conn.close()

        return jsonify({'message': 'User created successfully', 'user_id': new_user_id['user_id']}), 201

    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email already exists.'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint for user login
@app.route('/user', methods=['GET'])
def user_login():
    username = request.json.get('username')
    password = request.json.get('password')

    # Basic validation to ensure all fields are provided
    if not username or not password:
        return jsonify({'error': 'All fields (username and password) are required.'}), 400

    # Hash the password
    hashed_password_input = hashlib.sha256(password.encode()).hexdigest() # not using generate_password_hash here to test why its not matching

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if username exists
        cursor.execute('SELECT username FROM Users WHERE username = ?', (username,))

        # Retrieve hashed password from the database
        cursor.execute('SELECT password_hash from Users WHERE username = ?',(username,))
        hash_from_db = cursor.fetchone()

        conn.close()
        if hashed_password_input == hash_from_db['password_hash']: # not using check_password_hash here to test why its not matching
            return jsonify({'message': 'Login successful'}), 200
        else:
            return jsonify({'error': 'Invalid password.'}), 401

    except Exception as e:
        print(e)
        return jsonify({'error': "Username not found"}), 500

@app.route('/user', methods=['PUT'])
def change_username_or_password():
    return jsonify({'message': 'Alter user endpoint - to be implemented'}), 200

@app.route('/user', methods=['DELETE'])
def delete_user():
    return jsonify({'message': 'Delete user endpoint - to be implemented'}), 200

@app.route('/event', methods=['POST'])
def create_event():
    return jsonify({'message': 'Create event endpoint - to be implemented'}), 200

@app.route('/emails', methods=['GET'])
def get_emails():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Start with the base SQL query and fill emails list
    query = 'SELECT email FROM Users'
    params = []
    cursor.execute(query, params)
    emails = cursor.fetchall()
    
    # Convert the rows to dictionaries to make them serializable
    emails_list = [dict(email) for email in emails]
    conn.close()
    
    return jsonify(emails_list), 200

@app.route('/award_ticket', methods=['POST'])
def award_ticket():
    return jsonify({'message': 'Award ticket endpoint - to be implemented'}), 200

if __name__ == '__main__':
    app.run(debug=True)