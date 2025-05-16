import React, { useEffect, useState } from "react";
// Add the following import to polyfill process
import process from "process";
import { RetellWebClient } from "retell-client-js-sdk";
import { FaPhone, FaPhoneSlash } from "react-icons/fa"; // Import phone icons
import "./App.scss";

// Get agentId from environment variable with fallback for development
const agentId = process.env.REACT_APP_AGENT_ID || "";

interface RegisterCallResponse {
  access_token: string;
}

// Interface for transcript items
interface TranscriptItem {
  role: string;
  content: string;
}

// Interface for log entries
interface LogEntry {
  timestamp: string;
  sortTime: number;
  role: string;
  content: string;
  isEvent: boolean;
}

const retellWebClient = new RetellWebClient();

const App = () => {
  const [isCalling, setIsCalling] = useState(false);
  // Removed logs state as we're not showing logs in UI anymore
  // Removed transcript tracking states as we're not showing logs in UI anymore
  // State for detailed log toggle
  // Removed showDetailedLog state as we're not showing logs in UI anymore

  // Log transcript updates to console
  const updateLog = (role: string, content: string) => {
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    console.debug(`[${timestamp}] ${role}: ${content}`);
  };
  
  // For non-transcript logs
  const addLog = (message: string, isEventLog = false) => {
    // Get current date-time with seconds
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Create a timestamp for sorting (milliseconds since epoch)
    const sortTimestamp = now.getTime();
    
    // Just log to console.debug, no UI updates
    console.debug(`[${timestamp}] ${message}`);
  };

  // Initialize the SDK
  useEffect(() => {
    retellWebClient.on("call_started", () => {
      const message = "call started";
      console.debug(message);
      addLog(message, true);
    });

    retellWebClient.on("call_ended", () => {
      const message = "call ended";
      console.debug(message);
      addLog(message, true);
      setIsCalling(false);
    });

    // When agent starts talking for the utterance
    retellWebClient.on("agent_start_talking", () => {
      const message = "agent_start_talking";
      console.debug(message);
      addLog(message, true);
    });

    // When agent is done talking for the utterance
    retellWebClient.on("agent_stop_talking", () => {
      const message = "agent_stop_talking";
      console.debug(message);
      addLog(message, true);
    });

    // Real time pcm audio bytes being played back, in format of Float32Array
    // only available when emitRawAudioSamples is true
    retellWebClient.on("audio", (audio) => {
      // console.log(audio);
    });

    // Update message such as transcript
    // You can get transcript with update.transcript
    // Please note that transcript only contains last 5 sentences to avoid the payload being too large
    retellWebClient.on("update", (update) => {
      // Process each transcript item - use the last item only to avoid duplicates
      if (update.transcript && update.transcript.length > 0) {
        // Get only the latest transcript for each role to avoid duplicates
        const latestByRole: Record<string, string> = {};
        
        // Collect the latest transcript for each role
        update.transcript.forEach((item: TranscriptItem) => {
          latestByRole[item.role] = item.content;
        });
        
        // Log the latest content for each role
        Object.entries(latestByRole).forEach(([role, content]) => {
          console.debug(`${role}: ${content}`);
        });
      }
    });

    retellWebClient.on("metadata", (metadata) => {
      // console.log(metadata);
    });

    retellWebClient.on("error", (error) => {
      const message = `An error occurred: ${error}`;
      console.error(message);
      // Always show errors regardless of detailed log setting
      addLog(message);
      // Stop the call
      retellWebClient.stopCall();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleConversation = async () => {
    if (isCalling) {
      retellWebClient.stopCall();
    } else {
      console.debug('Starting new call...');
      const registerCallResponse = await registerCall(agentId);
      if (registerCallResponse.access_token) {
        retellWebClient
          .startCall({
            accessToken: registerCallResponse.access_token,
          })
          .catch(error => console.error('Error starting call:', error));
        setIsCalling(true);
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
          id="btnStartStop"
          onClick={toggleConversation}
        >
          {isCalling ? <FaPhoneSlash /> : <FaPhone />} {/* Icon changes based on state */}
          {isCalling ? "End call" : "Begin call"}
        </button>
        {/* Logs are now only visible in browser console */}
      </header>
    </div>
  );
};

export default App;
