import { useEffect, useState, useRef, useCallback } from "react";
import { FaMicrophone, FaStop } from "react-icons/fa";
import SidePanel from "../components/SidePanel";
import FeedbackPanel from "../components/FeedbackPanel";
// Audio utility functions - will be loaded dynamically
let startAudioPlayerWorklet: () => Promise<[AudioWorkletNode, AudioContext]>;
let startAudioRecorderWorklet: (
  handler: (data: ArrayBuffer) => void
) => Promise<
  [AudioWorkletNode, AudioContext, MediaStream, MediaStreamAudioSourceNode]
>;
let stopMicrophone: (stream: MediaStream) => void;

// Load audio utilities dynamically
const loadAudioUtilities = async () => {
  try {
    // @ts-expect-error - JavaScript module without type declarations
    const audioPlayerModule = await import("../helpers/audio-player.js");
    // @ts-expect-error - JavaScript module without type declarations
    const audioRecorderModule = await import("../helpers/audio-recorder.js");

    startAudioPlayerWorklet = audioPlayerModule.startAudioPlayerWorklet;
    startAudioRecorderWorklet = audioRecorderModule.startAudioRecorderWorklet;
    stopMicrophone = audioRecorderModule.stopMicrophone;

    console.log("Audio utilities loaded successfully");
  } catch (error) {
    console.error("Failed to load audio utilities:", error);
    throw error;
  }
};

interface WebSocketMessage {
  mime_type?: string;
  data?: string;
  turn_complete?: boolean;
  interrupted?: boolean;
  error?: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  isComplete: boolean;
}

export default function WebSocketAgentSimulation() {
  const userId = "1"; // TODO: Get from auth context
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [latestFeedback, setLatestFeedback] = useState<string>("");

  // WebSocket and audio refs
  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPlayerNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioRecorderNodeRef = useRef<AudioWorkletNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioBufferRef = useRef<Uint8Array[]>([]);
  const bufferTimerRef = useRef<number | null>(null);
  const isAudioModeRef = useRef(false);
  const isRecorderSetupRef = useRef(false);

  // Generate session ID on mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem("sessionId");
    if (!storedSessionId) {
      const newSessionId = crypto.randomUUID();
      localStorage.setItem("sessionId", newSessionId);
      setSessionId(newSessionId);
    } else {
      setSessionId(storedSessionId);
    }
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!sessionId) return;

    // Always connect with audio mode enabled to support both text and audio
    const wsUrl = `ws://localhost:8000/agent/ws/${userId}/${sessionId}?is_audio=true`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connection opened");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log("[AGENT TO CLIENT]", message);
        console.log(
          "Message type:",
          message.mime_type,
          "Data length:",
          message.data?.length || 0
        );

        // Handle turn completion
        if (message.turn_complete) {
          setCurrentMessageId(null);
          return;
        }

        // Handle interruption
        if (message.interrupted) {
          if (audioPlayerNodeRef.current) {
            audioPlayerNodeRef.current.port.postMessage({
              command: "endOfAudio",
            });
          }
          return;
        }

        // Handle audio data
        if (message.mime_type === "audio/pcm") {
          console.log(
            "Received audio data from server:",
            message.data?.length || 0,
            "bytes"
          );
          if (audioPlayerNodeRef.current) {
            const audioData = base64ToArrayBuffer(message.data!);
            audioPlayerNodeRef.current.port.postMessage(audioData);
            console.log(
              "Sent audio data to player:",
              audioData.byteLength,
              "bytes"
            );
          } else {
            console.warn("Audio player not set up, cannot play audio");
          }
        }

        // Handle text data
        if (message.mime_type === "text/plain") {
          if (!currentMessageId) {
            const newMessageId = crypto.randomUUID();
            setCurrentMessageId(newMessageId);
            setMessages((prev) => [
              ...prev,
              {
                id: newMessageId,
                content: message.data!,
                isUser: false,
                isComplete: false,
              },
            ]);
          } else {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === currentMessageId
                  ? { ...msg, content: msg.content + message.data! }
                  : msg
              )
            );
          }
        }

        // Handle errors
        if (message.error) {
          console.error("WebSocket error:", message.error);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log("Reconnecting...");
        connectWebSocket();
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    websocketRef.current = ws;
  }, [sessionId, userId, currentMessageId]);

  // Connect WebSocket when sessionId changes
  useEffect(() => {
    if (sessionId) {
      connectWebSocket();
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [sessionId]);

  // Audio utilities
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Audio player setup
  const setupAudioPlayer = async () => {
    try {
      console.log("Setting up audio player...");

      // Ensure audio utilities are loaded
      if (!startAudioPlayerWorklet) {
        await loadAudioUtilities();
      }

      const [audioPlayerNode, audioContext] = await startAudioPlayerWorklet();
      audioPlayerNodeRef.current = audioPlayerNode;
      audioContextRef.current = audioContext;
      console.log("Audio player setup completed");
    } catch (error) {
      console.error("Error setting up audio player:", error);
    }
  };

  // Audio recorder setup
  const setupAudioRecorder = async () => {
    try {
      console.log("Setting up audio recorder...");

      // Double-check that audio mode is enabled
      if (!isAudioModeRef.current) {
        console.log("Audio mode not enabled, skipping recorder setup");
        return;
      }

      // Check if recorder is already set up
      if (isRecorderSetupRef.current) {
        console.log("Audio recorder already set up, skipping");
        return;
      }

      // Clean up any existing audio recorder
      if (micStreamRef.current) {
        console.log("Cleaning up existing microphone stream");
        stopMicrophone(micStreamRef.current);
        micStreamRef.current = null;
      }
      if (audioRecorderNodeRef.current) {
        audioRecorderNodeRef.current = null;
      }

      // Ensure audio utilities are loaded
      if (!startAudioRecorderWorklet) {
        await loadAudioUtilities();
      }

      // Create a simple audio data handler that directly processes data
      const audioDataHandler = (audioData: ArrayBuffer) => {
        console.log(
          "Audio data received, processing:",
          audioData.byteLength,
          "bytes"
        );
        handleAudioData(audioData);
      };

      const [audioRecorderNode, , micStream, source] =
        await startAudioRecorderWorklet(audioDataHandler);
      audioRecorderNodeRef.current = audioRecorderNode;
      micStreamRef.current = micStream;

      // Add a small delay to ensure everything is properly set up
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Double-check audio mode is still enabled before connecting microphone
      if (!isAudioModeRef.current) {
        console.log("Audio mode disabled during setup, aborting connection");
        return;
      }

      // Now connect the microphone source to the worklet
      if (source) {
        source.connect(audioRecorderNode);
        isRecorderSetupRef.current = true;
        console.log("Audio recorder setup completed and microphone connected");
      } else {
        console.error("Failed to get microphone source");
      }
    } catch (error) {
      console.error("Error setting up audio recorder:", error);
    }
  };

  const handleAudioData = (audioData: ArrayBuffer) => {
    console.log(
      "handleAudioData called, isAudioMode:",
      isAudioModeRef.current,
      "audioData size:",
      audioData.byteLength
    );

    if (!isAudioModeRef.current) {
      console.log("Audio mode disabled, skipping audio processing");
      return;
    }

    console.log("Processing audio data:", audioData.byteLength, "bytes");
    audioBufferRef.current.push(new Uint8Array(audioData));

    if (!bufferTimerRef.current) {
      bufferTimerRef.current = setInterval(sendBufferedAudio, 200);
      console.log("Started audio buffering timer");
    }
  };

  const sendBufferedAudio = () => {
    if (audioBufferRef.current.length === 0 || !isAudioModeRef.current) return;

    console.log(
      "Sending buffered audio:",
      audioBufferRef.current.length,
      "chunks"
    );

    // Calculate total length
    let totalLength = 0;
    for (const chunk of audioBufferRef.current) {
      totalLength += chunk.length;
    }

    // Combine all chunks
    const combinedBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of audioBufferRef.current) {
      combinedBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    console.log(
      "Sending audio data to server:",
      combinedBuffer.byteLength,
      "bytes"
    );

    // Send audio data
    sendWebSocketMessage({
      mime_type: "audio/pcm",
      data: arrayBufferToBase64(combinedBuffer.buffer),
    });

    // Clear buffer
    audioBufferRef.current = [];
  };

  const sendWebSocketMessage = (message: WebSocketMessage) => {
    if (
      websocketRef.current &&
      websocketRef.current.readyState === WebSocket.OPEN
    ) {
      websocketRef.current.send(JSON.stringify(message));
    }
  };

  // Text message handling
  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: inputMessage,
      isUser: true,
      isComplete: true,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send to WebSocket
    sendWebSocketMessage({
      mime_type: "text/plain",
      data: inputMessage,
    });

    setInputMessage("");
  };

  // Audio mode toggle
  const toggleAudioMode = async () => {
    if (isAudioMode) {
      // Disable audio mode
      setIsAudioMode(false);
      isAudioModeRef.current = false;
      if (bufferTimerRef.current) {
        clearInterval(bufferTimerRef.current);
        bufferTimerRef.current = null;
      }
      audioBufferRef.current = [];

      // Stop microphone
      if (micStreamRef.current) {
        stopMicrophone(micStreamRef.current);
        micStreamRef.current = null;
      }

      // Clean up audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      audioPlayerNodeRef.current = null;
      audioRecorderNodeRef.current = null;
      isRecorderSetupRef.current = false;
    } else {
      // Enable audio mode
      try {
        console.log("Setting audio mode to true...");
        setIsAudioMode(true);
        isAudioModeRef.current = true;
        console.log("Audio mode enabled, setting up audio components...");

        // Add a small delay to ensure the audio mode is properly set
        await new Promise((resolve) => setTimeout(resolve, 100));

        await setupAudioPlayer();
        await setupAudioRecorder();
        console.log("Audio setup completed successfully");
      } catch (error) {
        console.error("Error setting up audio:", error);
        setIsAudioMode(false);
        isAudioModeRef.current = false;
        // Clean up any partially set up audio components
        if (audioContextRef.current) {
          await audioContextRef.current.close();
          audioContextRef.current = null;
        }
        if (micStreamRef.current) {
          stopMicrophone(micStreamRef.current);
          micStreamRef.current = null;
        }
        audioPlayerNodeRef.current = null;
        audioRecorderNodeRef.current = null;
        return;
      }
    }
  };

  // Session management
  const generateNewSessionId = async () => {
    const newSessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", newSessionId);
    setSessionId(newSessionId);
    setMessages([]);
    setCurrentMessageId(null);
    setLatestFeedback("");
  };

  const handleSessionSelect = (selectedSessionId: string) => {
    setSessionId(selectedSessionId);
    localStorage.setItem("sessionId", selectedSessionId);
    setMessages([]);
    setCurrentMessageId(null);
    setLatestFeedback("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (bufferTimerRef.current) {
        clearInterval(bufferTimerRef.current);
      }
      if (micStreamRef.current) {
        stopMicrophone(micStreamRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  let messageContent;
  if (messages.length > 0) {
    messageContent = (
      <div>
        {messages.map((message) => (
          <div key={message.id} className="message-container mb-4">
            <article
              className={`media ${
                message.isUser ? "has-background-light" : ""
              }`}
            >
              <div className="media-content">
                <div className="content">
                  <p>{message.content}</p>
                  {!message.isComplete && !message.isUser && (
                    <span className="has-text-grey">...</span>
                  )}
                </div>
              </div>
              <div className="media-right ml-4">
                <div className="is-flex is-flex-direction-column is-align-items-center">
                  <figure className="image is-48x48">
                    <div
                      className="has-background-primary has-text-white has-text-centered"
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {message.isUser ? "U" : "A"}
                    </div>
                  </figure>
                  <span className="has-text-weight-normal is-italic is-size-7 has-text-grey mt-1">
                    {message.isUser ? "You" : "Agent"}
                  </span>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    );
  } else {
    messageContent = (
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-half">
            <div
              className="box has-text-centered"
              style={{ marginTop: "2rem" }}
            >
              <p className="subtitle is-6">
                Start your conversation with the agent to begin your teaching
                journey.
              </p>
              <div className="mt-4">
                <span className="icon is-large">
                  <i className="fas fa-robot fa-2x"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="hero is-fullheight">
      <div className="hero-body" style={{ padding: 0 }}>
        <div className="container" style={{ height: "100%", padding: 0 }}>
          <div className="columns" style={{ height: "100%", margin: 0 }}>
            {/* Side Panel Component */}
            <SidePanel
              sessionId={sessionId}
              userId={userId}
              onNewSession={generateNewSessionId}
              onSessionSelect={handleSessionSelect}
              isLoading={false}
            />

            {/* Main Chat Column */}
            <div className="column is-7 pr-4 has-background-white">
              <div
                className="box"
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Connection Status */}
                <div className="mb-3">
                  <span
                    className={`tag ${
                      isConnected ? "is-success" : "is-danger"
                    }`}
                  >
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                  <span
                    className={`tag ml-2 ${
                      isAudioMode ? "is-info" : "is-warning"
                    }`}
                  >
                    {isAudioMode ? "Audio Mode" : "Text Mode"}
                  </span>
                </div>

                {/* Messages */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    msOverflowStyle: "none",
                    scrollbarWidth: "none",
                  }}
                >
                  <style>
                    {`
                      div::-webkit-scrollbar {
                        display: none;
                      }
                    `}
                  </style>
                  {messageContent}
                </div>

                <hr className="my-4" />

                {/* Input Controls */}
                <div className="container is-fluid">
                  <form
                    onSubmit={handleSendText}
                    className="field has-addons has-addons-right"
                  >
                    <div className="control is-expanded">
                      <input
                        className="input"
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={!isConnected}
                      />
                    </div>
                    <div className="control">
                      <button
                        className={`button ${
                          isAudioMode ? "is-info" : "is-warning"
                        } mx-2`}
                        type="button"
                        onClick={toggleAudioMode}
                      >
                        <span className="icon">
                          {isAudioMode ? <FaStop /> : <FaMicrophone />}
                        </span>
                        <span>
                          {isAudioMode ? "Stop Audio" : "Start Audio"}
                        </span>
                      </button>
                    </div>
                    <div className="control">
                      <button
                        className="button is-primary mx-2"
                        type="submit"
                        disabled={!isConnected || !inputMessage.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Right column - Feedback */}
            <FeedbackPanel isLoading={false} latestFeedback={latestFeedback} />
          </div>
        </div>
      </div>
    </section>
  );
}
