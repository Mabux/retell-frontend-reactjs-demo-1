require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = 8080;

// Apply CORS with default options first
app.use(cors({
  origin: 'http://localhost:3000', // React's default port
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware to parse JSON bodies
app.use(express.json());

app.post("/create-web-call", async (req, res) => {
  const { agent_id, metadata, retell_llm_dynamic_variables } = req.body;

  // Prepare the payload for the API request
  const payload = { agent_id };

  // Conditionally add optional fields if they are provided
  if (metadata) {
    payload.metadata = metadata;
  }

  if (retell_llm_dynamic_variables) {
    payload.retell_llm_dynamic_variables = retell_llm_dynamic_variables;
  }

  try {
    console.log('Sending request to Retell API with payload:', JSON.stringify(payload, null, 2));
    const response = await axios.post(
      "https://api.retellai.com/v2/create-web-call",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log('Received response from Retell API:', JSON.stringify(response.data, null, 2));
    
    // Ensure we have the call_id from the response
    if (!response.data.call_id) {
      console.warn('No call_id received in Retell API response');
    }

    // Include both the access token and call ID in the response
    const responseData = {
      access_token: response.data.access_token,
      call_id: response.data.call_id
    };
    
    console.log('Sending response to client:', JSON.stringify(responseData, null, 2));
    res.status(201).json(responseData);
  } catch (error) {
    console.error(
      "Error creating web call:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to create web call" });
  }
});

// New endpoint to get call details
app.get("/get-call/:callId", async (req, res) => {
  const { callId } = req.params;
  
  try {
    const response = await axios.get(
      `https://api.retellai.com/v2/get-call/${callId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error fetching call details:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch call details" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
