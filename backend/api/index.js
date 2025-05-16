const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Configure CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://retell-demo-1-frontend-b6janbsnk-mabuxs-projects.vercel.app',
  'https://retell-demo-1-frontend.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.post('/api/create-web-call', async (req, res) => {
  const { agent_id, metadata, retell_llm_dynamic_variables } = req.body;
  const payload = { agent_id };

  if (metadata) payload.metadata = metadata;
  if (retell_llm_dynamic_variables) payload.retell_llm_dynamic_variables = retell_llm_dynamic_variables;

  try {
    const response = await axios.post(
      'https://api.retellai.com/v2/create-web-call',
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    res.status(201).json({
      access_token: response.data.access_token,
      call_id: response.data.call_id
    });
  } catch (error) {
    console.error('Error creating web call:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create web call' });
  }
});

app.get('/api/get-call/:callId', async (req, res) => {
  const { callId } = req.params;
  
  try {
    const response = await axios.get(
      `https://api.retellai.com/v2/get-call/${callId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching call details:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch call details' });
  }
});

// Handle all other routes
app.all('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;
