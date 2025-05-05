import ReactMarkdown from "react-markdown";
import { FaRobot, FaUser, FaPlay } from "react-icons/fa";
import { AgentResponse } from "../interfaces/AgentInterface";
import { useState } from "react";

export default function ChatMessage({ message }: { message: AgentResponse }) {
  const isUser = message.role === "user";
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const playAudio = () => {
    if (message.audio && !audioUrl) {
      try {
        // Clean the base64 string by removing any whitespace and ensuring it's properly padded
        const base64Data = message.audio.replace(/\s/g, "");

        // Create a blob from the base64 data
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "audio/mp3" });

        // Create an object URL from the blob
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Play the audio
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setAudioUrl(null);
        };
        audio.play();
      } catch (error) {
        console.error("Error playing audio:", error);
        console.log("Audio data:", message.audio);
      }
    } else if (audioUrl) {
      // If we already have a URL, just play it
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  console.log("Message audio available:", !!message.audio);

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
                            className="button is-small is-info mt-2"
                            onClick={playAudio}
                          >
                            <span className="icon">
                              <FaPlay />
                            </span>
                            <span>Play Response</span>
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
