import hashlib
from flask import Flask, jsonify, make_response, request
import sqlite3
from datetime import datetime, timedelta, date
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt

app = Flask(__name__)
CORS(app)
app.config["JWT_SECRET_KEY"] = "shhhhh"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=14)
app.config["JWT_VERIFY_SUB"] = False
jwt = JWTManager(app)

# Returns a connection to the database which can be used to send SQL commands to the database
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
  query_conditions = []
  
  # Check for the 'afterDate' filter
  after_date = request.args.get('afterDate')
  if after_date:
      query_conditions.append('date > ?')
      params.append(after_date)
  # Check for the 'location' filter
  location = request.args.get('location')
  if location:
      query_conditions.append('location = ?')
      params.append(location)

  # Add WHERE clause if conditions are present
  if query_conditions:
      query += ' WHERE ' + ' AND '.join(query_conditions)
  
  # Execute the query with the specified conditions
  cursor.execute(query, params)
  events = cursor.fetchall()
  
  # Convert the rows to dictionaries to make them serializable
  events_list = [dict(event) for event in events]
  conn.close()
  
  return jsonify(events_list)

# Endpoint for getting seat availability for an event
@app.route('/events/<int:event_id>/seats', methods=['GET'])
def get_event_seats(event_id):
  try:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all available tickets for the event
    cursor.execute('''
      SELECT rowName, seatNumber, status
      FROM Tickets
      WHERE event_id = ?
      ORDER BY rowName, seatNumber
    ''', (event_id,))
    
    available_tickets = cursor.fetchall()
    
    # Get all sold tickets for the event
    cursor.execute('''
      SELECT rowName, seatNumber
      FROM TicketSales
      WHERE event_id = ?
      ORDER BY rowName, seatNumber
    ''', (event_id,))
    
    sold_seats = cursor.fetchall()
    conn.close()
    
    # Convert sold seats to a set for quick lookup
    sold_set = set((dict(seat)['rowName'], dict(seat)['seatNumber']) for seat in sold_seats)
    
    # Organize seats by row
    seats_by_row = {}
    for ticket in available_tickets:
      row = ticket['rowName']
      seat_num = ticket['seatNumber']
      is_sold = (row, seat_num) in sold_set
      
      if row not in seats_by_row:
        seats_by_row[row] = []
      
      seats_by_row[row].append({
        'seatNumber': seat_num,
        'status': 'SOLD' if is_sold else 'AVAILABLE'
      })
    
    return jsonify(seats_by_row), 200
    
  except Exception as e:
    return jsonify({'error': str(e)}), 500

# Endpoint for getting seat availability with prices for an event
@app.route('/events/<int:event_id>/seats-with-prices', methods=['GET'])
def get_event_seats_with_prices(event_id):
  try:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all tickets with their price tier information
    cursor.execute('''
      SELECT t.rowName, t.seatNumber, t.status, pt.priceCents
      FROM Tickets t
      JOIN PriceTiers pt ON t.priceTierId = pt.id
      WHERE t.event_id = ?
      ORDER BY t.rowName, t.seatNumber
    ''', (event_id,))
    
    tickets = cursor.fetchall()
    
    # Get all sold tickets to mark them as SOLD
    cursor.execute('''
      SELECT rowName, seatNumber
      FROM TicketSales
      WHERE event_id = ?
    ''', (event_id,))
    
    sold_seats = cursor.fetchall()
    conn.close()
    
    # Convert sold seats to a set
    sold_set = set((dict(seat)['rowName'], dict(seat)['seatNumber']) for seat in sold_seats)
    
    # Organize seats by row with prices
    seats_by_row = {}
    for ticket in tickets:
      row = ticket['rowName']
      seat_num = ticket['seatNumber']
      is_sold = (row, seat_num) in sold_set
      
      if row not in seats_by_row:
        seats_by_row[row] = []
      
      seats_by_row[row].append({
        'seatNumber': seat_num,
        'status': 'SOLD' if is_sold else ticket['status'],
        'priceCents': ticket['priceCents']
      })
    
    return jsonify(seats_by_row), 200
    
  except Exception as e:
    return jsonify({'error': str(e)}), 500

# Endpoint for creating a new user
@app.route('/users', methods=['POST'])
def create_user():
    # Extract email, username, and password from the JSON payload
    email = request.json.get('email')
    username = request.json.get('username')
    password = request.json.get('password')

    # Basic validation to ensure all fields are provided
    if not email or not username or not password:
        return jsonify({'error': 'All fields (email, username, and password) are required.'}), 400

    # Hash the password
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
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
        return jsonify({'error': 'An account with that username or email already exists.'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint for user login
@app.route('/login', methods=['POST'])
def user_login():
    username = request.json.get('username')
    password = request.json.get('password')
    if not username or not password:
        return jsonify({'error': 'All fields (username and password) are required.'}), 400

    # Hash the password
    hashed_password_input = hashlib.sha256(password.encode()).hexdigest()

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Retrieve hashed password, user_id, and admin status from the database
        cursor.execute('SELECT password_hash, user_id, admin FROM Users WHERE username = ?', (username,))
        user_data = cursor.fetchone()
        if user_data is None:
            conn.close()
            return jsonify({'error': 'Username not found'}), 401

        if hashed_password_input == user_data['password_hash']:
            access_token = create_access_token(
                identity=user_data['user_id'],
                additional_claims={"admin": user_data['admin']})
            conn.close()
            return jsonify(access_token=access_token), 200
        else:
            conn.close()
            return jsonify({'error': 'Invalid password.'}), 401

    except Exception as e:
        print(e)
        return jsonify({'error': "An error occurred during login"}), 500

# Endpoint for changing user password
@app.route('/users', methods=['PUT'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    old_password = request.json.get('old_password')
    new_password = request.json.get('new_password')
    print(current_user_id)

    if not old_password or not new_password:
        return jsonify({'error': 'old_password and new_password are required'}), 400

    # Hash passwords
    hashed_old = hashlib.sha256(old_password.encode()).hexdigest()
    hashed_new = hashlib.sha256(new_password.encode()).hexdigest()

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get user data for the current user
        cursor.execute('SELECT password_hash, username FROM Users WHERE user_id = ?', (current_user_id,))
        user_data = cursor.fetchone()
        print(user_data)

        if user_data is None:
            conn.close()
            return jsonify({'error': 'User not found'}), 404

        # Verify old password
        if hashed_old != user_data['password_hash']:
            conn.close()
            return jsonify({'error': 'Old password is incorrect'}), 400

        # Check if new password is different
        if hashed_new == user_data['password_hash']:
            conn.close()
            return jsonify({'error': 'New password cannot be the same as current password'}), 400

        # Update password
        cursor.execute('UPDATE Users SET password_hash = ? WHERE user_id = ?',
                       (hashed_new, current_user_id))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        print(e)
        return jsonify({'error': 'An error occurred while changing password'}), 500

# Endpoint for deleting a user
@app.route('/users', methods=['DELETE'])
def delete_user():
    username = request.json.get('username')
    password = request.json.get('password')

    # Hash the new password
    hashed_password_input = hashlib.sha256(password.encode()).hexdigest()

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Retrieve current password from the database
        cursor.execute('SELECT password_hash from Users WHERE username = ?',(username,))
        hash_from_db = cursor.fetchone()

        if hashed_password_input != hash_from_db['password_hash']:
            return jsonify({'error': 'Password does not match'}), 400
        else:
            cursor.execute('DELETE FROM Users WHERE username = ?', (username,))
            conn.commit()
            conn.close()
            return jsonify({'message': 'User deleted successfully'}), 201
    
    except Exception as e:
        print(e)
        return jsonify({'error': "you dont exist or sumn"}), 500

# Endpoint for getting all user emails
@app.route('/emails', methods=['GET'])
def get_emails():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Start with the base SQL query and fill emails list
    query = 'SELECT email FROM Users'
    cursor.execute(query)
    emails = cursor.fetchall()
    
    # Convert the rows to dictionaries to make them serializable
    emails_list = [dict(email) for email in emails]
    conn.close()
    
    return jsonify(emails_list), 200

# Endpoint for reserving seats before payment
@app.route('/reserve_seats', methods=['POST'])
@jwt_required()
def reserve_seats():
    event_id = request.json.get('event_id')
    seats = request.json.get('seats')  # List of {rowName, seatNumber} objects

    if not event_id or not seats or not isinstance(seats, list):
        return jsonify({'error': 'event_id and seats list are required'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Reserve each seat by updating its status to RESERVED
        for seat in seats:
            row_name = seat.get('rowName')
            seat_number = seat.get('seatNumber')
            
            if not row_name or seat_number is None:
                conn.close()
                return jsonify({'error': 'Invalid seat format. rowName and seatNumber are required'}), 400

            # Check if seat is already reserved or sold
            cursor.execute('''
                SELECT status FROM Tickets 
                WHERE event_id = ? AND rowName = ? AND seatNumber = ?
            ''', (event_id, row_name, seat_number))
            
            existing_ticket = cursor.fetchone()
            
            if not existing_ticket:
                conn.close()
                return jsonify({'error': f'Seat {row_name}{seat_number} does not exist'}), 404
            
            if existing_ticket['status'] != 'AVAILABLE':
                conn.close()
                return jsonify({'error': f'Seat {row_name}{seat_number} is not available'}), 400

            # Update the seat status to RESERVED
            cursor.execute('''
                UPDATE Tickets 
                SET status = 'RESERVED' 
                WHERE event_id = ? AND rowName = ? AND seatNumber = ?
            ''', (event_id, row_name, seat_number))

        conn.commit()
        conn.close()

        return jsonify({'message': f'{len(seats)} seats reserved successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint for awarding a user a ticket
@app.route('/award_ticket', methods=['POST'])
@jwt_required()
def award_ticket():
    event_id = request.json.get('event_id')
    current_user = get_jwt_identity()

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('INSERT INTO Tickets (event_id, user_id, purchase_date, price) VALUES (?, ?, ?, ?)', 
                       (event_id, current_user, date.today(), 0.0))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Ticket awarded successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint for getting all tickets for the current user
@app.route('/profile', methods=['GET'])
@jwt_required()
def get_user_tickets():
    current_user_id = get_jwt_identity()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all ticket sales for the current user with event details
        cursor.execute('''
            SELECT ts.id, ts.event_id, ts.rowName, ts.seatNumber, ts.barcode, ts.purchasedAt, 
                   e.name, e.date, e.time, e.location, e.description, e.imageUrl
            FROM TicketSales ts
            JOIN Events e ON ts.event_id = e.event_id
            WHERE ts.userId = ?
            ORDER BY e.date
        ''', (current_user_id,))
        
        tickets = cursor.fetchall()
        conn.close()
        
        # Convert rows to dictionaries
        tickets_list = [dict(ticket) for ticket in tickets]
        
        return jsonify(tickets_list), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint for admins to create events
@app.route('/admin/events', methods=['POST'])
@jwt_required()
def create_event():
    name = request.json.get('name')
    description = request.json.get('description')
    date = request.json.get('date')
    time = request.json.get('time')
    location = request.json.get('location')
    imageUrl = request.json.get('imageUrl')
    claims = get_jwt()

    if claims.get("admin") != 1:
        return {"msg": "Admins only"}, 403

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO Events (name, description, date, time, location, imageUrl) VALUES (?, ?, ?, ?, ?, ?)', 
                       (name, description, date, time, location, imageUrl))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Event created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint for purchasing reserved seats
@app.route('/purchase_seats', methods=['POST'])
@jwt_required()
def purchase_seats():
    current_user_id = get_jwt_identity()
    event_id = request.json.get('event_id')
    seats = request.json.get('seats')  # List of {rowName, seatNumber} objects

    if not event_id or not seats or not isinstance(seats, list):
        return jsonify({'error': 'event_id and seats list are required'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Process each seat
        for seat in seats:
            row_name = seat.get('rowName')
            seat_number = seat.get('seatNumber')
            
            if not row_name or seat_number is None:
                conn.close()
                return jsonify({'error': 'Invalid seat format. rowName and seatNumber are required'}), 400

            # Check if seat is RESERVED
            cursor.execute('''
                SELECT status FROM Tickets 
                WHERE event_id = ? AND rowName = ? AND seatNumber = ?
            ''', (event_id, row_name, seat_number))
            
            existing_ticket = cursor.fetchone()
            
            if not existing_ticket:
                conn.close()
                return jsonify({'error': f'Seat {row_name}{seat_number} does not exist'}), 404
            
            if existing_ticket['status'] != 'RESERVED':
                conn.close()
                return jsonify({'error': f'Seat {row_name}{seat_number} is not reserved'}), 400

            # Generate barcode (event_id + row + seat number)
            barcode = f'{event_id}{row_name}{seat_number}'

            # Create entry in TicketSales
            cursor.execute('''
                INSERT INTO TicketSales (event_id, rowName, seatNumber, userId, barcode, purchasedAt)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (event_id, row_name, seat_number, current_user_id, barcode, datetime.now()))

            # Update the ticket status to SOLD
            cursor.execute('''
                UPDATE Tickets 
                SET status = 'SOLD'
                WHERE event_id = ? AND rowName = ? AND seatNumber = ?
            ''', (event_id, row_name, seat_number))

        conn.commit()
        conn.close()

        return jsonify({'message': f'{len(seats)} seats purchased successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)