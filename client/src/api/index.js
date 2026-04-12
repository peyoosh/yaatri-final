const express = require('express');
const cors = require('cors'); // Essential for Frontend-Backend talk
const app = express();

app.use(cors()); 
app.use(express.json());

// Match this to your api/index.js 'fetchDestinations' call
app.get('/destinations', (req, res) => {
    // For now, send a dummy array to test the connection
    res.json([
        { id: 1, name: "Ghalegaun", region: "Lamjung", description: "Authentic homestay experience." }
    ]);
});

app.listen(5000, () => console.log("Server running on port 5000"));