# Yaatri Hub

Yaatri Hub is a full-stack MERN travel and destination guide application. It features real-time destination rankings, user-generated blogs, an administrative dashboard, and an integrated AI "Authentic Guide" powered by Google's Gemini.

## 🚀 Tech Stack

*   **Frontend:** React, Vite, Axios
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB, Mongoose
*   **AI Integration:** Google Generative AI (Gemini 1.5 Flash)
*   **Authentication:** JWT (JSON Web Tokens), bcryptjs

## ✨ Features

*   **AI Authentic Guide:** Chatbot that utilizes real MongoDB database context to recommend travel destinations.
*   **Dynamic Destinations:** Browse and rank travel sectors pulled directly from the database.
*   **Admin Dashboard:** Manage users, purge nodes, view live statistics, and update system marquee settings.
*   **Robust Error Handling:** Frontend UI is fortified against missing database fields to prevent rendering crashes.
*   **Dynamic Environment Routing:** Axios automatically routes to `localhost` for local development and securely routes to the live Render URL in production.

## 📂 Project Structure

*   `/client` - Contains the React (Vite) frontend application.
*   `/server` - Contains the Node.js Express backend, Mongoose models, and API routes.

## 🛠️ Setup & Commands

### Backend (Server)
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your `MONGO_URI`, `JWT_SECRET`, and `GEMINI_API_KEY`.
4. Start the server:
   ```bash
   npm start        # For production
   npm run dev      # For development (Nodemon)
   ```

### Frontend (Client)
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 📈 Recent Progress

*   Integrated Google Gemini AI for the `/chat` route with database context (RAG).
*   Added dynamic stats generation for the Admin Dashboard.
*   Created persistent MongoDB storage for Marquee settings.
*   Fixed frontend map rendering crashes caused by missing/undefined database fields (e.g., `toString()` and `.substring()` errors).
*   Updated Axios configuration for dynamic localhost vs. Render backend routing.