# Tessera

A modern event ticketing platform built with React and Flask, featuring interactive seat selection, user authentication, and ticket management.

## 🎯 Features

- **Event Browsing**: Browse and search upcoming events with filtering by date and location
- **Interactive Seat Selection**: Visual seat picker with real-time availability and pricing
- **User Authentication**: Secure signup, login, and password management with JWT tokens
- **Ticket Management**: Reserve seats before purchase, complete checkout, and view purchased tickets
- **User Profile**: View all purchased tickets with event details and barcodes
- **Admin Features**: Create and manage events (admin-only endpoints)
- **Real-time Availability**: Live seat status updates (Available, Reserved, Sold)

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Chakra UI** - Component library
- **React Router** - Client-side routing
- **Custom Seat Picker** - Interactive seat selection component

### Backend
- **Flask** - Python web framework
- **SQLite** - Database
- **Flask-JWT-Extended** - JWT authentication
- **Flask-CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
tessera/
├── backend/
│   ├── app.py          # Flask API server with all endpoints
│   └── script.py       # Utility script for creating events with tickets
├── database/
│   └── tessera.db      # SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable components (Navbar, EventCard)
│   │   ├── pages/      # Page components (Events, EventDetail, Login, etc.)
│   │   ├── App.jsx     # Main app component with routing
│   │   └── main.jsx    # Entry point
│   ├── public/         # Static assets
│   └── package.json    # Frontend dependencies
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.7+** with pip
- **Node.js 16+** and npm
- **SQLite 3**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tessera
   ```

2. **Set up the backend**
   ```bash
   cd backend
   pip install flask flask-cors flask-jwt-extended werkzeug
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `frontend/` directory:
   ```env
   REACT_APP_BASE_URL=http://localhost:8080
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   python app.py
   ```
   The API will be available at `http://localhost:8080`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (or the port Vite assigns)

3. **Access the application**
   - Open your browser and navigate to the frontend URL
   - Sign up for a new account or log in with existing credentials

## 📡 API Endpoints

### Authentication
- `POST /users` - Create a new user account
- `POST /login` - User login (returns JWT token)
- `PUT /users` - Change password (requires authentication)
- `DELETE /users` - Delete user account

### Events
- `GET /events` - Get all events (supports `?afterDate=YYYY-MM-DD` and `?location=...` filters)
- `GET /events/<id>/seats` - Get seat availability for an event
- `GET /events/<id>/seats-with-prices` - Get seats with pricing information
- `POST /admin/events` - Create a new event (admin only)

### Tickets
- `POST /reserve_seats` - Reserve seats before purchase (requires authentication)
- `POST /purchase_seats` - Purchase reserved seats (requires authentication)
- `GET /profile` - Get all tickets for the current user (requires authentication)
- `POST /award_ticket` - Award a free ticket to a user (requires authentication)

### Other
- `GET /emails` - Get all user emails

## 🗄️ Database

The application uses SQLite with the following main tables:
- **Users** - User accounts and authentication
- **Events** - Event information
- **Tickets** - Seat inventory and status
- **TicketSales** - Purchased tickets with barcodes
- **PriceTiers** - Pricing tiers for seats

### Creating Events with Tickets

Use the `script.py` utility to create events with automatically generated seats:

```bash
cd backend
python script.py
```

Follow the prompts to:
1. Enter event name
2. Specify number of rows
3. Specify seats per row

The script will create the event and generate tickets with a default price tier.

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Tokens expire after 14 days
- Include the token in the `Authorization` header: `Bearer <token>`
- Tokens are stored in `localStorage` on the frontend

## 🎨 Frontend Features

- **Responsive Design**: Works on desktop and mobile devices
- **Event Search**: Filter events by name
- **Date Filtering**: Only shows upcoming events by default
- **Seat Visualization**: Interactive seat map with color-coded status
- **Price Calculation**: Real-time total price calculation
- **Protected Routes**: Login required for ticket purchase and profile access

## 🛡️ Security Notes

- Passwords are hashed using SHA-256
- JWT tokens are used for secure API authentication
- Admin endpoints require admin privileges
- CORS is enabled for cross-origin requests

## 📝 Development

### Building for Production

```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`.


---

**Note**: Make sure to update the JWT secret key in `backend/app.py` for production use. The current key is for development only.
