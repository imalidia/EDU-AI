import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// Register API routes here

// Serve static files
app.use(express.static('public'));

// Default route with basic HTML interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Service</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
            }
            h1 {
                color: #333;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            pre {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
            }
            .container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .form-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            button {
                padding: 8px 16px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 5px;
            }
            button:hover {
                background-color: #45a049;
            }
            #result {
                margin-top: 20px;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
                display: none;
            }
        </style>
    </head>
    <body>
        <h1>API Service</h1>
        <p>Welcome to the API service. Refer to the documentation for available endpoints.</p>
        
        <div class="container">
            <h2>API Documentation</h2>
            <p>This service provides various API endpoints. Check the examples below:</p>
            
            <div id="result">
                <h3>Result</h3>
                <pre id="result-content"></pre>
            </div>
        </div>

        <script>
            // Helper function to display results
            function showResult(data) {
                document.getElementById('result').style.display = 'block';
                document.getElementById('result-content').textContent = 
                    typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
            }
        </script>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the web interface at http://localhost:${PORT}`);
}); 