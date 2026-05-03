# Yaatri Hub - Client (Frontend)

The frontend of **Yaatri Hub** is built with React, Vite, and Tailwind CSS. It provides a highly interactive and immersive user interface tailored for explorers and destination managers.

## 🚀 Yaatri Intelligence

**Yaatri Intelligence** is the core cognitive engine of the application, seamlessly bridging the gap between raw travel data and human exploration. It provides personalized, context-aware insights to elevate the travel experience in Nepal.

### Features of Yaatri Intelligence:
*   **The Authentic Guide (AI Chat):** Powered by Google's Gemini (1.5 Flash), this specialized conversational agent uses Retrieval-Augmented Generation (RAG). It actively pulls live data from the MongoDB cluster (destinations, blogs, user feedback) to answer queries with authentic, up-to-date local knowledge.
*   **Context-Aware Recommendations:** Integrates live environmental factors, such as real-time weather approximations and seasonal data, to suggest optimal travel windows for specific terrains (e.g., advising against Khumbu ascents during heavy monsoons).
*   **Behavioral Syncing:** Analyzes user history, "liked" nodes, and preferred sectors to dynamically curate the Community Blog feed and Terrain Rankings.
*   **Smart Moderation:** Proactively scans user-generated broadcasts (blogs) for anomalies, allowing admins to easily flag or purge inappropriate intelligence streams.

## 🛠️ Frontend Tech Stack
*   **Core:** React.js, Vite
*   **Styling:** Tailwind CSS (Custom 'Obsidian', 'Toxic Lime', and 'Teal Steel' aesthetics)
*   **Routing:** React Router DOM
*   **State & Fetching:** Axios with custom interceptors for foolproof session management
*   **Animations:** Framer Motion

## ⚙️ Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Ensure the `VITE_API_URL` in your `.env` points to the running backend (defaults to `http://localhost:5000/api` if omitted).
