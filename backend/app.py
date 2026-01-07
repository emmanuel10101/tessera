import hashlib
from flask import Flask, jsonify, make_response, request # Importing the Flask library and some helper functions
import sqlite3 # Library for talking to our database
from datetime import datetime # We'll be working with dates
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__) # Creating a new Flask app. This will help us create API endpoints hiding the complexity of writing network code!

# This function returns a connection to the database which can be used to send SQL commands to the database
def get_db_connection():
  conn = sqlite3.connect('../database/tessera.db')
  conn.row_factory = sqlite3.Row
  return conn

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

if __name__ == '__main__':
    app.run(debug=True)