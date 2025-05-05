import { AgentResponse } from "../interfaces/AgentInterface";
import { FaPerson, FaRobot } from "react-icons/fa6";
import ReactMarkdown from "react-markdown";

export default function ChatMessage({ message }: { message: AgentResponse }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`columns ${
        isUser ? "is-justify-content-flex-start" : "is-justify-content-flex-end"
      }`}
    >
      <div className="column is-10">
        <div
          className={`box ${
            isUser
              ? "has-background-primary-light"
              : "has-background-info-light"
          } mb-4`}
        >
          <article className="media">
            {isUser ? (
              <>
                <div className="media-left mr-4">
                  <div className="is-flex is-flex-direction-column is-align-items-center">
                    <figure className="image is-48x48">
                      <FaPerson size={32} />
                    </figure>
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
          </article>
        </div>
      </div>
    </div>
  );
}
