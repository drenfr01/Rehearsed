import { useEffect, useState, useRef, useCallback } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaVolumeUp } from "react-icons/fa";
import FeedbackPanel from "../components/FeedbackPanel";
import { useCreateSessionMutation } from "../store";
import { AgentResponse } from "../interfaces/AgentInterface";

const host = "127.0.0.1:8000";

interface StreamingMessage {
  mime_type: string;
  data: string;
  turn_complete?: boolean;
  interrupted?: boolean;
}

export default function AgentSimulationStreaming() {
  // TODO: these will be set by user login
  const userId = "18";
  const [sessionId, setSessionId] = useState<string>("");
  const [conversation, setConversation] = useState<AgentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string>("");
  const [latestFeedback, setLatestFeedback] = useState<string>("");

  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isProcessingAudioRef = useRef<boolean>(false);

  const [createSession] = useCreateSessionMutation();

  // Create a new session dynamically
  const createNewSession = async () => {
    try {
      console.log("Creating new session for user:", userId);

      setIsLoading(true);
      setConversation([]);
      setLatestFeedback("");

      const result = await createSession({ user_id: userId }).unwrap();
      console.log("Create session result:", result);

      if (result && result.sessions && result.sessions.length > 0) {
        const newSessionId = result.sessions[0].id;
        console.log("New session created with ID:", newSessionId);
        setSessionId(newSessionId);
        setIsLoading(false);
      } else {
        console.warn("No session returned from server, using fallback");
        throw new Error("No session returned");
      }
    } catch (error) {
      console.error("Failed to create new session:", error);
      const newSessionId = crypto.randomUUID();
      console.log("Using fallback session ID:", newSessionId);
      setSessionId(newSessionId);
      setIsLoading(false);
    }
  };

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!sessionId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${host}/agent/ws/${userId}/${sessionId}?is_audio=true`;

    console.log("Connecting to WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.onmessage = async (event) => {
      try {
        const message: StreamingMessage = JSON.parse(event.data);
        console.log("Received WebSocket message:", message);

        if (message.turn_complete || message.interrupted) {
          // Turn is complete, add the accumulated text to conversation
          if (currentText.trim()) {
            const agentResponse: AgentResponse = {
              content: currentText,
              role: "model",
              author: "Assistant",
              message_id: crypto.randomUUID(),
            };
            setConversation((prev) => [...prev, agentResponse]);
            setCurrentText("");
          }
          return;
        }

        if (message.mime_type === "text/plain") {
          // Accumulate text for streaming response
          setCurrentText((prev) => prev + message.data);
        } else if (message.mime_type === "audio/pcm") {
          // Handle incoming audio
          await handleIncomingAudio(message.data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };
  }, [sessionId, userId, currentText]);

  // Handle incoming audio from the agent
  const handleIncomingAudio = async (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Decode base64 PCM data
      const audioData = atob(base64Audio);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }

      // PCM data is raw audio, so we need to convert it to a format the Web Audio API can understand
      // Assuming 48kHz sample rate, 16-bit, mono PCM (common for TTS output)
      const sampleRate = 48000;
      const numberOfChannels = 1;
      const length = audioArray.length / 2; // 16-bit = 2 bytes per sample

      const audioBuffer = audioContextRef.current.createBuffer(
        numberOfChannels,
        length,
        sampleRate
      );

      const channelData = audioBuffer.getChannelData(0);

      // Convert 16-bit PCM to float32 (Web Audio API format)
      for (let i = 0; i < length; i++) {
        // Read 16-bit little-endian PCM
        const sample = audioArray[i * 2] | (audioArray[i * 2 + 1] << 8);
        // Convert to float32 (-1 to 1 range)
        channelData[i] = sample / 32768.0;
      }

      audioQueueRef.current.push(audioBuffer);

      if (!isProcessingAudioRef.current) {
        processAudioQueue();
      }
    } catch (error) {
      console.error("Error processing incoming audio:", error);
    }
  };

  // Process audio queue
  const processAudioQueue = async () => {
    if (audioQueueRef.current.length === 0 || isProcessingAudioRef.current) {
      return;
    }

    isProcessingAudioRef.current = true;
    setIsPlaying(true);

    while (audioQueueRef.current.length > 0) {
      const audioBuffer = audioQueueRef.current.shift();
      if (audioBuffer && audioContextRef.current) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();

        // Wait for audio to finish
        await new Promise((resolve) => {
          source.onended = resolve;
        });
      }
    }

    isProcessingAudioRef.current = false;
    setIsPlaying(false);
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        await sendAudioToServer(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(
        "Could not access microphone. Please ensure you have granted microphone permissions."
      );
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send audio to server via WebSocket
  const sendAudioToServer = async (audioBlob: Blob) => {
    if (
      !websocketRef.current ||
      websocketRef.current.readyState !== WebSocket.OPEN
    ) {
      console.error("WebSocket is not connected");
      return;
    }

    try {
      // Convert audio to PCM format (simplified - in production you'd want proper conversion)
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      const message = {
        mime_type: "audio/pcm",
        data: base64Audio,
      };

      websocketRef.current.send(JSON.stringify(message));

      // Add user message to conversation
      const userMessage: AgentResponse = {
        content: "[Audio Message]",
        role: "user",
        author: "You",
        message_id: crypto.randomUUID(),
      };
      setConversation((prev) => [...prev, userMessage]);
    } catch (error) {
      console.error("Error sending audio to server:", error);
    }
  };

  // Send text message via WebSocket
  const sendTextMessage = (text: string) => {
    if (
      !websocketRef.current ||
      websocketRef.current.readyState !== WebSocket.OPEN
    ) {
      console.error("WebSocket is not connected");
      return;
    }

    const message = {
      mime_type: "text/plain",
      data: text,
    };

    websocketRef.current.send(JSON.stringify(message));

    // Add user message to conversation
    const userMessage: AgentResponse = {
      content: text,
      role: "user",
      author: "You",
      message_id: crypto.randomUUID(),
    };
    setConversation((prev) => [...prev, userMessage]);
  };

  // Simple timeout to clear loading state if stuck
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log("Clearing stuck loading state");
        setIsLoading(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // Create new session on component mount
  useEffect(() => {
    createNewSession();
  }, []);

  // Connect WebSocket when session is ready
  useEffect(() => {
    if (sessionId && !isConnected) {
      connectWebSocket();
    }
  }, [sessionId, isConnected, connectWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  let message_content;
  if (isLoading) {
    message_content = (
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-half">
            <div
              className="box has-text-centered"
              style={{ marginTop: "2rem" }}
            >
              <div className="button is-loading is-large is-white"></div>
              <p className="mt-4">Creating new session...</p>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (conversation.length > 0) {
    message_content = (
      <div>
        {conversation.map((response: AgentResponse) => (
          <div key={response.message_id} className="box mb-3">
            <div className="media">
              <div className="media-content">
                <div className="content">
                  <p>
                    <strong>{response.author}:</strong> {response.content}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {currentText && (
          <div className="box mb-3">
            <div className="media">
              <div className="media-content">
                <div className="content">
                  <p>
                    <strong>Assistant:</strong> {currentText}
                  </p>
                  <div className="typing-indicator">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    message_content = (
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-half">
            <div
              className="box has-text-centered"
              style={{ marginTop: "2rem" }}
            >
              <p className="subtitle is-6">
                Start your streaming conversation with the students to begin
                your teaching journey.
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
            {/* Main Chat Column */}
            <div className="column is-10 pr-4 has-background-white">
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
                  {isPlaying && (
                    <span className="tag is-info ml-2">
                      <FaVolumeUp className="mr-1" />
                      Playing Audio
                    </span>
                  )}
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
                      .typing-indicator {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                      }
                      .typing-indicator .dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background-color: #b5b5b5;
                        animation: typing 1.4s infinite ease-in-out;
                      }
                      .typing-indicator .dot:nth-child(1) { animation-delay: -0.32s; }
                      .typing-indicator .dot:nth-child(2) { animation-delay: -0.16s; }
                      @keyframes typing {
                        0%, 80%, 100% { transform: scale(0); }
                        40% { transform: scale(1); }
                      }
                    `}
                  </style>
                  {message_content}
                </div>

                <hr className="my-4" />

                {/* Streaming Controls */}
                <div className="columns is-mobile is-centered">
                  <div className="column is-narrow">
                    <button
                      className={`button is-large ${
                        isRecording ? "is-danger" : "is-primary"
                      }`}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!isConnected}
                    >
                      <span className="icon">
                        {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
                      </span>
                      <span>
                        {isRecording ? "Stop Recording" : "Start Recording"}
                      </span>
                    </button>
                  </div>
                  <div className="column is-narrow">
                    <button
                      className="button is-large is-info"
                      onClick={() => {
                        const text = prompt("Enter your message:");
                        if (text) sendTextMessage(text);
                      }}
                      disabled={!isConnected}
                    >
                      <span className="icon">
                        <i className="fas fa-comment"></i>
                      </span>
                      <span>Send Text</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Feedback */}
            <div className="column is-2">
              <FeedbackPanel
                isLoading={false}
                latestFeedback={latestFeedback}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
