# Retell Frontend Demo using our JS Web Client SDK (React/Node.js)

## Context

This demo illustrates a quick setup for integrating a frontend with a backend
using React and Node.js. It showcases using **our [JS Client SDK](https://github.com/adam-team/retell-client-js-sdk)**.

## Setup Tutorial

Check out our [doc](https://docs.retellai.com/make-calls/web-call) for a
step-by-step guide on setting up Web Call.

## Run this Demo

Step 1: Step up example backend

1. Go to backend folder

2. `pnpm i`

3. Create a `.env` file in the example_backend folder (or copy from `.env.example`) and set your API key:
   ```
   RETELL_API_KEY=your_api_key_here
   ```

4. `pnpm node index.js` or `node index.js`


Step 2: Step up frontend

1. go to demo folder

2. `pnpm i`

3. Create a `.env` file in the frontend folder (or copy from `.env.example`) and set your agent ID:
   ```
   REACT_APP_AGENT_ID=your_agent_id_here
   ```

4. `pnpm start`
