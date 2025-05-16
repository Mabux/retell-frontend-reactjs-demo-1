import React, { useEffect, useState } from "react";
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
  const [logs, setLogs] = useState<LogEntry[]>([]); // Array of log entries
  // Track last transcript for each role
  const [lastTranscripts, setLastTranscripts] = useState<Record<string, string>>({});
  // Track the last logged content to avoid duplicates
  const [lastLoggedContent, setLastLoggedContent] = useState<Record<string, string>>({});
  // State for detailed log toggle
  const [showDetailedLog, setShowDetailedLog] = useState(false);

  const updateLog = (role: string, content: string) => {
    // Check if this content is exactly the same as what we last logged for this role
    if (lastLoggedContent[role] === content) {
      return; // Skip duplicate content
    }
    
    // Get current date-time with seconds (for sorting only)
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
    
    // Compare with last transcript to detect if it's a new sentence
    const lastContent = lastTranscripts[role] || '';
    
    // Check if this is a new sentence or continuation
    // A new sentence starts if the new content is shorter than the previous
    // or if it doesn't start with the previous content
    const isNewSentence = content.length < lastContent.length || 
                        !content.startsWith(lastContent.substring(0, Math.min(lastContent.length, 10)));
    
    setLogs(prevLogs => {
      // Find the last log entry for this role
      const roleEntries = prevLogs.filter(entry => entry.role === role);
      const lastRoleEntry = roleEntries.length > 0 ? roleEntries[roleEntries.length - 1] : null;
      
      if (!lastRoleEntry || isNewSentence) {
        // No previous entry for this role or it's a new sentence
        // Add a new log entry
        return [...prevLogs, {
          timestamp,
          sortTime: sortTimestamp,
          role,
          content,
          isEvent: false
        }];
      } else {
        // It's a continuation, update the existing entry
        return prevLogs.map(entry => {
          if (entry === lastRoleEntry) {
            return {
              ...entry,
              timestamp,
              sortTime: sortTimestamp,
              content
            };
          }
          return entry;
        });
      }
    });
    
    // Update the last transcript for this role
    setLastTranscripts(prev => ({ ...prev, [role]: content }));
    
    // Update the last logged content for this role
    setLastLoggedContent(prev => ({ ...prev, [role]: content }));
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
    
    // Only add to UI logs if it's not an event log or if detailed logging is enabled
    if (!isEventLog || showDetailedLog) {
      // Add the log entry
      setLogs(prevLogs => [
        ...prevLogs,
        {
          timestamp,
          sortTime: sortTimestamp,
          role: 'system',
          content: message,
          isEvent: isEventLog
        }
      ]);
    }
  };

  // Initialize the SDK
  useEffect(() => {
    retellWebClient.on("call_started", () => {
      const message = "call started";
      console.log(message);
      addLog(message, true);
    });

    retellWebClient.on("call_ended", () => {
      const message = "call ended";
      console.log(message);
      addLog(message, true);
      setIsCalling(false);
    });

    // When agent starts talking for the utterance
    // useful for animation
    retellWebClient.on("agent_start_talking", () => {
      const message = "agent_start_talking";
      console.log(message);
      addLog(message, true);
    });

    // When agent is done talking for the utterance
    // useful for animation
    retellWebClient.on("agent_stop_talking", () => {
      const message = "agent_stop_talking";
      console.log(message);
      addLog(message, true);
      // Force a line break for the next agent message by clearing the last transcript
      setLastTranscripts(prev => ({ ...prev, agent: '' }));
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
        
        // Update logs with only the latest content for each role
        Object.entries(latestByRole).forEach(([role, content]) => {
          console.log(`${role}: ${content}`);
          updateLog(role, content);
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
      setLogs([]); // Clear logs when starting a new call
      setLastTranscripts({}); // Clear last transcripts
      setLastLoggedContent({}); // Clear last logged content
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
          id="btnStartStop"
          onClick={toggleConversation}
        >
          {isCalling ? <FaPhoneSlash /> : <FaPhone />} {/* Icon changes based on state */}
          {isCalling ? "End call" : "Begin call"}
        </button>
        <div className="logs-container">
          <h3>Call Logs</h3>
          <div className="log-controls">
            <label className="detailed-log-toggle">
              <input 
                type="checkbox" 
                checked={showDetailedLog} 
                onChange={(e) => setShowDetailedLog(e.target.checked)} 
              />
              Detailed log
            </label>
          </div>
          <div className="logs">
            {logs
              .filter(entry => !entry.isEvent || showDetailedLog)
              .sort((a, b) => a.sortTime - b.sortTime)
              .map((entry, index) => (
                <div key={index} className="log-entry">
                  {entry.role === 'system' ? entry.content : `${entry.role}: ${entry.content}`}
                </div>
              ))}
          </div>
        </div>
      </header>
    </div>
  );
};

export default App;
