import { useEffect, useState, useRef } from "react";

// Audio utility functions - will be loaded dynamically
let startAudioPlayerWorklet: () => Promise<[AudioWorkletNode, AudioContext]>;
let startAudioRecorderWorklet: (
  handler: (data: ArrayBuffer) => void
) => Promise<[AudioWorkletNode, AudioContext, MediaStream]>;

// Load audio utilities dynamically
const loadAudioUtilities = async () => {
  try {
    // @ts-expect-error - JavaScript module without type declarations
    const audioPlayerModule = await import("../helpers/audio-player.js");
    // @ts-expect-error - JavaScript module without type declarations
    const audioRecorderModule = await import("../helpers/audio-recorder.js");

    startAudioPlayerWorklet = audioPlayerModule.startAudioPlayerWorklet;
    startAudioRecorderWorklet = audioRecorderModule.startAudioRecorderWorklet;

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

// Generate sessionId once outside component (like in app.js)
const sessionId = Math.floor(Math.random() * 1000000).toString();

export default function WebSocketAgentSimulation() {
  const userId = 1;
  const [messages, setMessages] = useState<string[]>([]);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isAudio, setIsAudio] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  // Refs for WebSocket and audio
  const websocketRef = useRef<WebSocket | null>(null);
  const shouldReconnectRef = useRef(true);
  const audioPlayerNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioRecorderNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioBufferRef = useRef<Uint8Array[]>([]);
  const bufferTimerRef = useRef<number | null>(null);
  const currentMessageRef = useRef<string>("");

  // WebSocket connection function (not memoized to avoid dependency issues)
  const connectWebSocket = () => {
    // Close existing connection first
    if (websocketRef.current) {
      shouldReconnectRef.current = false; // Disable reconnection for intentional close
      websocketRef.current.close();
      websocketRef.current = null;
    }

    const wsUrl = `ws://localhost:8000/agent/ws/${userId}/${sessionId}?is_audio=${isAudio}`;
    console.log("Connecting to WebSocket:", wsUrl);
    console.log(
      "Session ID:",
      sessionId,
      "User ID:",
      userId,
      "Is Audio:",
      isAudio
    );

    const ws = new WebSocket(wsUrl);
    shouldReconnectRef.current = true; // Re-enable reconnection for new connection

    ws.onopen = () => {
      console.log("WebSocket connection opened successfully.");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const messageFromServer: WebSocketMessage = JSON.parse(event.data);
      console.log("[AGENT TO CLIENT]", messageFromServer);

      // Check if the turn is complete
      if (messageFromServer.turn_complete) {
        setCurrentMessageId(null);
        currentMessageRef.current = "";
        return;
      }

      // Check for interrupt message
      if (messageFromServer.interrupted) {
        // Stop audio playback if it's playing
        if (audioPlayerNodeRef.current) {
          audioPlayerNodeRef.current.port.postMessage({
            command: "endOfAudio",
          });
        }
        return;
      }

      // Handle errors from server
      if (messageFromServer.error) {
        console.error("Server error:", messageFromServer.error);
        setMessages((prev) => [...prev, `ERROR: ${messageFromServer.error}`]);
        return;
      }

      // If it's audio, play it
      if (
        messageFromServer.mime_type === "audio/pcm" &&
        audioPlayerNodeRef.current
      ) {
        audioPlayerNodeRef.current.port.postMessage(
          base64ToArray(messageFromServer.data!)
        );
      }

      // If it's text, display it
      if (messageFromServer.mime_type === "text/plain") {
        // Add a new message for a new turn
        if (currentMessageId === null) {
          const newMessageId = Math.random().toString(36).substring(7);
          setCurrentMessageId(newMessageId);
          currentMessageRef.current = messageFromServer.data!;
          setMessages((prev) => [...prev, messageFromServer.data!]);
        } else {
          // Append to existing message
          currentMessageRef.current += messageFromServer.data!;
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = currentMessageRef.current;
            return newMessages;
          });
        }
      }
    };

    ws.onclose = (event) => {
      console.log(
        "WebSocket connection closed. Code:",
        event.code,
        "Reason:",
        event.reason
      );
      setIsConnected(false);

      // Only reconnect if we should (not during intentional disconnections)
      if (shouldReconnectRef.current) {
        setTimeout(() => {
          console.log("Reconnecting in 5 seconds...");
          connectWebSocket();
        }, 5000);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      console.error("WebSocket readyState:", ws.readyState);
      console.error("WebSocket URL:", wsUrl);
      console.error("Error details:", {
        target: error.target,
        type: error.type,
        timeStamp: error.timeStamp,
      });
    };

    websocketRef.current = ws;
  };

  // Send message to server
  const sendMessage = (message: WebSocketMessage) => {
    if (
      websocketRef.current &&
      websocketRef.current.readyState === WebSocket.OPEN
    ) {
      const messageJson = JSON.stringify(message);
      websocketRef.current.send(messageJson);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      // Add user message to display
      setMessages((prev) => [...prev, `> ${inputMessage}`]);

      // Send to server
      sendMessage({
        mime_type: "text/plain",
        data: inputMessage,
      });

      console.log("[CLIENT TO AGENT]", inputMessage);
      setInputMessage("");
    }
  };

  // Audio utility functions
  const base64ToArray = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Audio recorder handler
  const audioRecorderHandler = (pcmData: ArrayBuffer) => {
    // Add audio data to buffer
    audioBufferRef.current.push(new Uint8Array(pcmData));

    // Start timer if not already running
    if (!bufferTimerRef.current) {
      bufferTimerRef.current = setInterval(sendBufferedAudio, 200); // 0.2 seconds
    }
  };

  // Send buffered audio data every 0.2 seconds
  const sendBufferedAudio = () => {
    if (audioBufferRef.current.length === 0) {
      return;
    }

    // Calculate total length
    let totalLength = 0;
    for (const chunk of audioBufferRef.current) {
      totalLength += chunk.length;
    }

    // Combine all chunks into a single buffer
    const combinedBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of audioBufferRef.current) {
      combinedBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Send the combined audio data
    sendMessage({
      mime_type: "audio/pcm",
      data: arrayBufferToBase64(combinedBuffer.buffer),
    });
    console.log("[CLIENT TO AGENT] sent %s bytes", combinedBuffer.byteLength);

    // Clear the buffer
    audioBufferRef.current = [];
  };

  // Start audio
  const startAudio = async () => {
    try {
      // Load audio utilities
      await loadAudioUtilities();

      // Start audio output
      const [playerNode] = await startAudioPlayerWorklet();
      audioPlayerNodeRef.current = playerNode;

      // Start audio input
      const [recorderNode] = await startAudioRecorderWorklet(
        audioRecorderHandler
      );
      audioRecorderNodeRef.current = recorderNode;

      setAudioStarted(true);
      setIsAudio(true);

      connectWebSocket();
    } catch (error) {
      console.error("Error starting audio:", error);
    }
  };

  // Handle start audio button click
  const handleStartAudio = () => {
    startAudio();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bufferTimerRef.current) {
        clearInterval(bufferTimerRef.current);
      }
      shouldReconnectRef.current = false; // Disable reconnection on unmount
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>
        WebSocket Agent Simulation
      </h1>

      {/* Connection Status */}
      <div style={{ marginBottom: "20px" }}>
        <span
          style={{
            padding: "5px 10px",
            backgroundColor: isConnected ? "#23d160" : "#ff3860",
            color: "white",
            borderRadius: "4px",
            marginRight: "10px",
          }}
        >
          {isConnected ? "Connected" : "Disconnected"}
        </span>

        {/* Start Audio Button */}
        {!audioStarted && (
          <button
            onClick={handleStartAudio}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3273dc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Start Audio
          </button>
        )}

        {audioStarted && (
          <span
            style={{
              padding: "5px 10px",
              backgroundColor: "#3273dc",
              color: "white",
              borderRadius: "4px",
            }}
          >
            Audio Mode Active
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        id="messages"
        style={{
          border: "1px solid #ddd",
          borderRadius: "4px",
          padding: "20px",
          minHeight: "400px",
          maxHeight: "400px",
          overflowY: "auto",
          backgroundColor: "#f9f9f9",
          marginBottom: "20px",
          fontFamily: "monospace",
        }}
      >
        {messages.map((message, index) => (
          <p key={index} style={{ margin: "5px 0" }}>
            {message}
          </p>
        ))}
      </div>

      {/* Message Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={!isConnected}
          style={{
            flex: 1,
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "16px",
          }}
        />
        <button
          type="submit"
          disabled={!isConnected || !inputMessage.trim()}
          style={{
            padding: "10px 20px",
            backgroundColor:
              isConnected && inputMessage.trim() ? "#23d160" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              isConnected && inputMessage.trim() ? "pointer" : "not-allowed",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
