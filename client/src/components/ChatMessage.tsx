import ReactMarkdown from "react-markdown";
import { FaRobot, FaUser, FaPlay, FaStop } from "react-icons/fa";
import { AgentResponse } from "../interfaces/AgentInterface";
import { useState, useRef, useEffect } from "react";

export default function ChatMessage({ message }: { message: AgentResponse }) {
  const isUser = message.role === "user";
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAudioUrlRef = useRef<string | null>(null);

  // Pause audio when this ChatMessage switches to a different message
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
    };
  }, [message.message_id]);

  // On unmount, revoke any blob URLs that might still be alive
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (lastAudioUrlRef.current) {
        URL.revokeObjectURL(lastAudioUrlRef.current);
        lastAudioUrlRef.current = null;
      }
      if (message.imageObjectUrl) {
        URL.revokeObjectURL(message.imageObjectUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playAudio = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true));
      return;
    }

    if (message.audio && !audioUrl) {
      try {
        const base64Data = message.audio.replace(/\s/g, "");
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        lastAudioUrlRef.current = url;

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          setAudioUrl(null);
          if (lastAudioUrlRef.current === url) {
            lastAudioUrlRef.current = null;
          }
        };
        audio.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          setAudioUrl(null);
          if (lastAudioUrlRef.current === url) {
            lastAudioUrlRef.current = null;
          }
        };
        audio.play().then(() => setIsPlaying(true));
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
  };

  return (
    <div className="container is-fluid mb-4">
      <div className="columns is-mobile">
        <div
          className={`column is-10 ${
            isUser ? "is-offset-1" : "is-offset-1 ml-auto"
          }`}
        >
          <article className={`message ${isUser ? "is-primary" : "is-info"}`}>
            <div className="message-body">
              <div className="media">
                {isUser ? (
                  <>
                    <div className="media-left ml-4">
                      <div className="is-flex is-flex-direction-column is-align-items-center">
                        <figure className="image is-48x48">
                          <FaUser size={32} />
                        </figure>
                        <span className="has-text-weight-normal is-italic is-size-7 has-text-grey mt-1">
                          You
                        </span>
                      </div>
                    </div>
                    <div className="media-content">
                      <div className="content">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                        {(message.imageDataUrl || message.imageObjectUrl) && (
                          <figure className="image mt-2">
                            <img
                              src={
                                message.imageDataUrl || message.imageObjectUrl
                              }
                              alt="Whiteboard attachment"
                              style={{
                                maxWidth: "320px",
                                maxHeight: "240px",
                                width: "100%",
                                height: "auto",
                                borderRadius: 8,
                                objectFit: "contain",
                                background: "#fff",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                              }}
                            />
                          </figure>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="media-content">
                      <div className="content">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                        {message.audio && (
                          <button
                            className={`button is-small ${
                              isPlaying ? "is-danger" : "is-info"
                            } mt-2`}
                            onClick={playAudio}
                          >
                            <span className="icon">
                              {isPlaying ? <FaStop /> : <FaPlay />}
                            </span>
                            <span>{isPlaying ? "Stop" : "Play Response"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="media-right ml-4">
                      <div className="is-flex is-flex-direction-column is-align-items-center">
                        <figure className="image is-48x48">
                          <FaRobot size={32} />
                        </figure>
                        <span className="has-text-weight-normal is-italic is-size-7 has-text-grey mt-1">
                          {message.author}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
