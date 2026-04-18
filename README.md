# 🌍 Travel Buddy Matcher with Trust Score

A full-stack web app to find trusted travel companions. Users create trips, join others, chat in real-time, and build reputation through a dynamic trust score.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + TailwindCSS + React Router |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.io |
| Auth | JWT + Bcrypt |
| Email OTP | Nodemailer |
| Images | Cloudinary + Multer |
| Architecture | MVC (Models / Controllers / Routes) |

---

## 📁 Project Structure

```
travel-buddy/
├── backend/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── cloudinary.js       # Image upload config
│   ├── models/
│   │   ├── User.js             # User schema (trust score, interests, etc.)
│   │   ├── Trip.js             # Trip schema (members, requests, etc.)
│   │   ├── Review.js           # Review/rating schema
│   │   └── Message.js          # Chat message schema
│   ├── controllers/
│   │   ├── authController.js   # Signup, login, OTP verify
│   │   ├── userController.js   # Profile, matching, notifications
│   │   ├── tripController.js   # Create, edit, delete, complete trip
│   │   ├── requestController.js # Join request accept/reject
│   │   ├── reviewController.js  # Submit and fetch reviews
│   │   └── messageController.js # Fetch chat history
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── tripRoutes.js
│   │   ├── requestRoutes.js
│   │   ├── reviewRoutes.js
│   │   └── messageRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT protect middleware
│   ├── utils/
│   │   ├── sendEmail.js        # Nodemailer OTP email
│   │   ├── trustScore.js       # Trust score update logic
│   │   └── socket.js           # Socket.io event handlers
│   ├── server.js               # Entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx       # Top nav with notifications
    │   │   ├── TripCard.jsx     # Trip preview card
    │   │   ├── TrustBadge.jsx   # Visual trust score badge
    │   │   ├── StarRating.jsx   # Interactive star rating
    │   │   └── Modal.jsx        # Reusable modal
    │   ├── pages/
    │   │   ├── HomePage.jsx         # Trip feed + filters
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── OTPPage.jsx          # Email OTP verification
    │   │   ├── ProfilePage.jsx      # My profile with tabs
    │   │   ├── EditProfilePage.jsx  # Edit profile + image upload
    │   │   ├── CreateTripPage.jsx   # Create new trip
    │   │   ├── TripDetailPage.jsx   # Trip detail + join request + reviews
    │   │   ├── ChatPage.jsx         # Real-time group chat
    │   │   ├── MyTripsPage.jsx      # User's created/joined trips
    │   │   └── UserProfilePage.jsx  # Public user profile
    │   ├── context/
    │   │   ├── AuthContext.jsx   # Global auth state
    │   │   └── SocketContext.jsx # Socket.io connection
    │   ├── services/
    │   │   └── api.js           # Axios with JWT interceptor
    │   └── App.jsx              # Routing
    ├── index.html
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account (free tier)
- Gmail account (for OTP emails)

---

### Step 1: Clone & Navigate

```bash
git clone <your-repo>
cd travel-buddy
```

---

### Step 2: Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/travel-buddy
JWT_SECRET=your_long_random_secret_string

# Gmail SMTP (enable "App Passwords" in Google account)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary (from cloudinary.com dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev    # development (nodemon)
# or
npm start      # production
```

Backend runs on: `http://localhost:5000`

---

### Step 3: Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 🎯 Feature Walkthrough

### Auth Flow
1. User signs up → OTP sent to email → Verify OTP → Automatically logged in
2. JWT token stored in `localStorage`, attached to all API requests
3. Protected routes redirect to `/login` if no valid token

### Trust Score System
Starts at **50** for every user. Changes:
| Event | Change |
|---|---|
| Email verified | +5 |
| Profile completed | +5 |
| Trip completed | +10 |
| Positive rating (4-5★) | +2 |
| Negative rating (1-2★) | -2 |
| Cancelled after joining | -15 |
| Reported by others | -20 |

### Join Request Flow
1. User sees a trip → clicks "Request to Join" → optionally adds a message
2. Host receives real-time notification → reviews request in Trip Detail page
3. Host accepts or rejects → user gets real-time notification
4. If accepted, user can access group chat

### Group Chat (Socket.io)
- Each trip has a unique room: `roomId = tripId`
- Only members can send/receive messages
- Messages persist in MongoDB (history loaded on page open)
- Real-time: new messages appear instantly for all members

### Rating System
- Only after a trip is marked "completed" can members rate each other
- Rating 4-5★ = +2 trust score for rated user
- Rating 1-2★ = -2 trust score
- Each pair can only review each other once per trip

---

## 🔌 API Reference

### Auth
```
POST /api/auth/signup         { name, email, password }
POST /api/auth/login          { email, password }
POST /api/auth/verify-otp     { userId, otp }
POST /api/auth/resend-otp     { userId }
```

### Users (Protected)
```
GET  /api/users/me
PUT  /api/users/me            multipart/form-data { name, age, bio, interests, profileImage }
GET  /api/users/:id
GET  /api/users/matches       ?budget=15000
GET  /api/users/notifications
PUT  /api/users/notifications/read
```

### Trips
```
GET  /api/trips               ?destination=&maxBudget=&startDate=
POST /api/trips               multipart/form-data
GET  /api/trips/my-trips      (protected)
GET  /api/trips/:id
PUT  /api/trips/:id           (creator only)
DELETE /api/trips/:id         (creator only)
POST /api/trips/:id/complete  (creator only)
POST /api/trips/:id/cancel    (member cancels self)
```

### Requests
```
POST /api/requests/:tripId/request          { message? }
PUT  /api/requests/:tripId/accept/:userId   (creator only)
PUT  /api/requests/:tripId/reject/:userId   (creator only)
```

### Reviews
```
POST /api/reviews             { toUserId, tripId, rating, comment }
GET  /api/reviews/user/:userId
```

### Messages
```
GET  /api/messages/:tripId    (members only)
```

---

## ⚡ Socket Events

| Event | Direction | Payload |
|---|---|---|
| `join_room` | Client → Server | `{ tripId, userId }` |
| `leave_room` | Client → Server | `{ tripId }` |
| `send_message` | Client → Server | `{ tripId, senderId, senderName, senderImage, text }` |
| `receive_message` | Server → Client | `{ _id, text, senderId, senderName, senderImage, createdAt }` |
| `join_notifications` | Client → Server | `{ userId }` |
| `notification_event` | Server → Client | `{ message, type, tripId }` |

---

## 🧪 Testing the App

1. Create 2 accounts (use different emails)
2. Account 1: Create a trip
3. Account 2: Request to join
4. Account 1: Accept the request (check notifications)
5. Both: Open group chat → send messages
6. Account 1: Mark trip as completed
7. Both: Rate each other → watch trust scores update

---

## 📝 Notes

- For production: use MongoDB Atlas, deploy backend to Railway/Render, frontend to Vercel/Netlify
- Image uploads go to Cloudinary (free 25GB storage)
- OTP emails via Gmail require enabling "App Passwords" (2FA must be on)
- Socket.io connections auto-reconnect on disconnect
