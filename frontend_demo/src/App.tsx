import { useEffect, useState } from "react";
// Add the following import to polyfill process
import process from "process";
import { RetellWebClient } from "retell-client-js-sdk";
import { FaPhone, FaPhoneSlash } from "react-icons/fa"; // Import phone icons
import "./App.css";

// Get agentId from environment variable with fallback for development
const agentId = process.env.REACT_APP_AGENT_ID || "";

interface RegisterCallResponse {
  access_token: string;
}

const retellWebClient = new RetellWebClient();

const App = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [logs, setLogs] = useState<string[]>([]); // State to store logs

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleString(); // Get local date-time
    setLogs((prevLogs) => [...prevLogs, `${timestamp}: ${message}`]); // Append new log with timestamp
  };

  // Initialize the SDK
  useEffect(() => {
    retellWebClient.on("call_started", () => {
      const message = "call started";
      console.log(message);
      addLog(message);
    });
    
    retellWebClient.on("call_ended", () => {
      const message = "call ended";
      console.log(message);
      addLog(message);
      setIsCalling(false);
    });
    
    // When agent starts talking for the utterance
    // useful for animation
    retellWebClient.on("agent_start_talking", () => {
      const message = "agent_start_talking";
      console.log(message);
      addLog(message);
    });
    
    // When agent is done talking for the utterance
    // useful for animation
    retellWebClient.on("agent_stop_talking", () => {
      const message = "agent_stop_talking";
      console.log(message);
      addLog(message);
    });
    
    // Real time pcm audio bytes being played back, in format of Float32Array
    // only available when emitRawAudioSamples is true
    retellWebClient.on("audio", (audio) => {
      // console.log(audio);
    });
    
    // Update message such as transcript
    // You can get transcrit with update.transcript
    // Please note that transcript only contains last 5 sentences to avoid the payload being too large
    retellWebClient.on("update", (update) => {
      // console.log(update);
    });
    
    retellWebClient.on("metadata", (metadata) => {
      // console.log(metadata);
    });
    
    retellWebClient.on("error", (error) => {
      const message = `An error occurred: ${error}`;
      console.error(message);
      addLog(message);
      // Stop the call
      retellWebClient.stopCall();
    });
  }, []);

  const toggleConversation = async () => {
    if (isCalling) {
      retellWebClient.stopCall();
    } else {
      setLogs([]); // Clear logs when starting a new call
      const registerCallResponse = await registerCall(agentId);
      if (registerCallResponse.access_token) {
        retellWebClient
          .startCall({
            accessToken: registerCallResponse.access_token,
          })
          .catch(console.error);
        setIsCalling(true); // Update button to "Stop" when conversation starts
      }
    }
  };

  async function registerCall(agentId: string): Promise<RegisterCallResponse> {
    try {
      // Update the URL to match the new backend endpoint you created
      const response = await fetch("http://localhost:8080/create-web-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: agentId, // Pass the agentId as agent_id
          // You can optionally add metadata and retell_llm_dynamic_variables here if needed
          // metadata: { your_key: "your_value" },
          // retell_llm_dynamic_variables: { variable_key: "variable_value" }
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
  
      const data: RegisterCallResponse = await response.json();
      return data;
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <button
          style={{
            marginBottom: "20px",
            padding: "15px 30px", // Bigger button
            fontSize: "18px", // Larger text
            display: "flex",
            alignItems: "center",
            gap: "10px", // Space between icon and text
          }}
          onClick={toggleConversation}
        >
          {isCalling ? <FaPhoneSlash /> : <FaPhone />} {/* Icon changes based on state */}
          {isCalling ? "End call" : "Begin call"}
        </button>
        <div
          style={{
            width: "75%", // Default width for large screens
            maxWidth: "99%", // Max width for small screens
            height: "50vh", // Fixed height of half the screen
            overflowY: "scroll",
            border: "1px solid #ccc",
            padding: "10px",
            backgroundColor: "#f9f9f9",
            color: "#333", // Darker text color for better readability
          }}
        >
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </header>
    </div>
  );
};

export default App;
