import React, { useEffect, useState, useRef } from "react";
// Add the following import to polyfill process
import process from "process";
import { RetellWebClient } from "retell-client-js-sdk";
import { FaPhone, FaPhoneSlash } from "react-icons/fa"; // Import phone icons
import "./App.scss";

// Get agentId from environment variable with fallback for development
const agentId = process.env.REACT_APP_AGENT_ID || "";

interface RegisterCallResponse {
  access_token: string;
  call_id?: string;
}

// Interface for transcript items
interface TranscriptItem {
  role: string;
  content: string;
}

// Interface for call details
interface CallControl {
  call_id: string;
  // Add other properties from the call control object if needed
}

interface Word {
  word: string;
  start: number;
  end: number;
}

interface TranscriptItem {
  role: string;
  content: string;
  words: Word[];
  metadata?: {
    response_id?: number;
    [key: string]: any;
  };
}

interface ToolCallInvocation {
  role: string;
  tool_call_id: string;
  name: string;
  arguments: {
    execution_message: string;
    [key: string]: any;
  };
}

interface LatencyMetrics {
  p99: number;
  min: number;
  max: number;
  p90: number;
  num: number;
  values: number[];
  p50: number;
  p95: number;
}

interface CallCost {
  total_duration_unit_price: number;
  product_costs: Array<{
    unit_price: number;
    product: string;
    cost: number;
  }>;
  combined_cost: number;
  total_duration_seconds: number;
}

interface CallDetails {
  call_id: string;
  call_type: string;
  agent_id: string;
  call_status: string;
  start_timestamp: number;
  end_timestamp: number;
  duration_ms: number;
  transcript: string;
  transcript_object: TranscriptItem[];
  transcript_with_tool_calls: Array<TranscriptItem | ToolCallInvocation>;
  recording_url: string;
  public_log_url: string;
  disconnection_reason: string;
  latency: {
    llm: LatencyMetrics;
    e2e: LatencyMetrics;
    tts: LatencyMetrics;
  };
  call_cost: CallCost;
  opt_out_sensitive_data_storage: boolean;
  opt_in_signed_url: boolean;
  access_token: string;
}

const retellWebClient = new RetellWebClient();

const App = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [callDetails, setCallDetails] = useState<CallDetails | null>(null);
  // Use a ref to always have access to the latest call ID in event handlers
  const currentCallIdRef = useRef<string | null>(null);
  
  // Keep the ref in sync with state
  useEffect(() => {
    currentCallIdRef.current = currentCallId;
  }, [currentCallId]);
  // Removed logs state as we're not showing logs in UI anymore
  // Removed transcript tracking states as we're not showing logs in UI anymore
  // State for detailed log toggle
  // Removed showDetailedLog state as we're not showing logs in UI anymore
  
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
      const callId = currentCallIdRef.current;
      const message = `call ended. Call ID: ${callId || 'none'}`;
      console.debug(message);
      addLog(message, true);
      
      setIsCalling(false);
      
      // Fetch and download call details when the call ends
      if (callId) {
        console.debug('Fetching call details for call ID:', callId);
        fetchCallDetails(callId)
          .then((callDetails) => {
            console.debug('Successfully fetched call details for:', callId);
            setCallDetails(callDetails);
          })
          .catch(error => {
            console.error('Error fetching call details:', error);
          });
      } else {
        console.warn('No call ID available to fetch call details');
      }
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

  // Simple function to log call details to console
  const logCallDetails = (callDetails: CallDetails) => {
    console.log('=== CALL DETAILS ===');
    console.log('Call ID:', callDetails.call_id || 'N/A');
    console.log('Status:', callDetails.call_status || 'N/A');
    
    if (callDetails.start_timestamp) {
      console.log('Start Time:', new Date(callDetails.start_timestamp).toLocaleString());
    }
    
    if (callDetails.end_timestamp) {
      console.log('End Time:', new Date(callDetails.end_timestamp).toLocaleString());
    }
    
    if (callDetails.duration_ms) {
      const minutes = Math.floor(callDetails.duration_ms / 60000);
      const seconds = Math.floor((callDetails.duration_ms % 60000) / 1000);
      console.log(`Duration: ${minutes}m ${seconds}s`);
    }
    
    if (callDetails.recording_url) {
      console.log('Recording URL:', callDetails.recording_url);
    }
    
    if (callDetails.transcript && Array.isArray(callDetails.transcript)) {
      console.log('\n=== TRANSCRIPT ===');
      callDetails.transcript.forEach((item, index) => {
        if (item && typeof item === 'object') {
          const role = item.role || 'unknown';
          const content = item.content || '';
          const timestamp = item.timestamp ? 
            new Date(item.timestamp * 1000).toLocaleTimeString() : 
            'unknown time';
          console.log(`[${index + 1}] ${role.toUpperCase()} (${timestamp}):`, content);
        }
      });
    }
    
    // Log additional call details
    console.log('\n=== CALL TYPE ===');
    console.log(callDetails.call_type);
    
    console.log('\n=== AGENT ID ===');
    console.log(callDetails.agent_id);
    
    console.log('\n=== DISCONNECTION REASON ===');
    console.log(callDetails.disconnection_reason);
    
    console.log('\n=== RAW RESPONSE ===');
    console.log(JSON.stringify(callDetails, null, 2));
    console.log('===================');
  };

  const fetchCallDetails = async (callId: string) => {
    try {
      console.log(`Fetching call details for ID: ${callId}`);
      const response = await fetch(`http://localhost:8080/get-call/${callId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error ${response.status} fetching call details:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CallDetails = await response.json();
      console.log('Call details received successfully');
      logCallDetails(data);
      
      // Update the recording URL if available
      if (data.recording_url) {
        setRecordingUrl(data.recording_url);
      }
      
      return data;
      
    } catch (error) {
      console.error('Error in fetchCallDetails:', error);
      throw error;
    }
  };

  const toggleConversation = async () => {
    if (isCalling) {
      console.debug('Stopping call...');
      const callId = currentCallIdRef.current;
      retellWebClient.stopCall();
      
      // Fetch and display call details when manually ending the call
      if (callId) {
        console.debug('Fetching call details for manually ended call:', callId);
        try {
          const details = await fetchCallDetails(callId);
          setCallDetails(details);
        } catch (error) {
          console.error('Error fetching call details after manual end:', error);
        }
      }
    } else {
      try {
        console.debug('Starting new call...');
        // Reset recording URL when starting a new call
        setRecordingUrl(null);
        const registerCallResponse = await registerCall(agentId);
        console.debug('Register call response:', registerCallResponse);
        
        if (registerCallResponse.access_token) {
          if (registerCallResponse.call_id) {
            console.debug('Setting current call ID:', registerCallResponse.call_id);
            setCurrentCallId(registerCallResponse.call_id);
          } else {
            console.warn('No call_id received in register call response');
          }
          
          // Start the call and wait for it to initialize
          const callControl = await retellWebClient.startCall({
            accessToken: registerCallResponse.access_token,
          }) as unknown as CallControl; // Type assertion for the call control object
          
          console.debug('Call started successfully');
          console.debug('Call control:', callControl);
          
          // Set the call ID from the most reliable source
          const callId = registerCallResponse.call_id || 
                        (callControl && 'call_id' in callControl ? callControl.call_id : null);
          
          if (callId) {
            console.debug('Setting call ID:', callId);
            setCurrentCallId(callId);
          } else {
            console.warn('No call_id available from register response or call control');
            // For debugging, set a temporary ID if we don't have one
            const tempId = `temp-${Date.now()}`;
            console.debug('Using temporary call ID for debugging:', tempId);
            setCurrentCallId(tempId);
          }
          
          setIsCalling(true);
        } else {
          console.error('No access token received in register call response');
        }
      } catch (error) {
        console.error('Error in toggleConversation:', error);
        setCurrentCallId(null);
        setIsCalling(false);
      }
    }
  };

  async function registerCall(agentId: string): Promise<RegisterCallResponse> {
    try {
      console.debug('Registering call with agent ID:', agentId);
      const requestBody = {
        agent_id: agentId,
        // You can optionally add metadata and retell_llm_dynamic_variables here if needed
        // metadata: { your_key: "your_value" },
        // retell_llm_dynamic_variables: { variable_key: "variable_value" }
      };
      
      console.debug('Sending request to backend:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch("http://localhost:8080/create-web-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from backend:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data: RegisterCallResponse = await response.json();
      console.debug('Received response from backend:', JSON.stringify(data, null, 2));
      
      if (!data.access_token) {
        throw new Error('No access token received from backend');
      }
      
      if (!data.call_id) {
        console.warn('No call_id received in register call response');
      }
      
      return data;
    } catch (err) {
      console.error('Error in registerCall:', err);
      throw err;
    }
  }

  const callStatus = callDetails?.call_status;
  const callType = callDetails?.call_type;
  const startTime = callDetails?.start_timestamp ? new Date(callDetails.start_timestamp).toLocaleString() : 'N/A';
  const duration = callDetails?.duration_ms ? `${Math.floor(callDetails.duration_ms / 60000)}m ${Math.floor((callDetails.duration_ms % 60000) / 1000)}s` : 'N/A';
  const disconnectionReason = callDetails?.disconnection_reason;

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
        {/* Display call details whenever we have them */}
        {callDetails && (
          <div className="recording-container">
            {/* Call Recording Section - Only show if we have a recording URL */}
            {recordingUrl && (
              <div className="recording-section">
                <h3 className="recording-header">
                  Call Recording
                </h3>
                <audio 
                  className="audio-player"
                  controls 
                  src={recordingUrl}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Call Details Section */}
            <div>
              <h3 className="call-details">
                Call Details
              </h3>
              
              <div className="details-grid">
                <div className="detail-label">Status:</div>
                <div className={`detail-value ${callStatus === 'completed' ? 'status-completed' : 'status-other'}`}>
                  {callStatus || 'N/A'}
                </div>
                
                <div className="detail-label">Call Type:</div>
                <div>{callType || 'N/A'}</div>
                
                <div className="detail-label">Started:</div>
                <div>{startTime}</div>
                
                <div className="detail-label">Duration:</div>
                <div>{duration}</div>
                
                {disconnectionReason && (
                  <>
                    <div className="detail-label">Ended:</div>
                    <div>{disconnectionReason}</div>
                  </>
                )}
              </div>
            </div>

            {/* Transcript Section - Only show if we have transcript data */}
            {callDetails?.transcript && (
              <div className="transcript-section">
                <h3 className="transcript-header">
                  Call Transcript
                </h3>
                <div className="transcript-content">
                  {callDetails.transcript}
                </div>
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
};

export default App;
