import ReactMarkdown from "react-markdown";
import { FaRobot, FaUser, FaPlay, FaStop } from "react-icons/fa";
import { AgentResponse } from "../interfaces/AgentInterface";
import { useState, useRef, useEffect } from "react";

export default function ChatMessage({ message }: { message: AgentResponse }) {
  const isUser = message.role === "user";
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup effect: only revoke URL if the message changes or component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setIsPlaying(false);
    };
    // Only depend on message.message_id so it runs when the message changes or unmounts
  }, [message.message_id]);

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
        };
        audio.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          setAudioUrl(null);
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
