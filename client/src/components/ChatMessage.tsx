import { ResponseMessage } from "../interfaces/MessageInterface";
import { FaPerson, FaRobot } from "react-icons/fa6";
import ReactMarkdown from "react-markdown";

export default function ChatMessage({ message }: { message: ResponseMessage }) {
  const isUser = message.role === "user";

  let iconContent;
  if (isUser) {
    iconContent = (
      <div className="media-right">
        <figure className="image is-64x64">
          <FaPerson size={48} />
        </figure>
      </div>
    );
  } else {
    iconContent = (
      <div className="media-left">
        <figure className="image is-64x64">
          <FaRobot size={48} />
        </figure>
      </div>
    );
  }

  return (
    <div
      className={`box ${
        isUser ? "has-background-primary-light" : "has-background-info-light"
      } mb-4`}
    >
      <article className="media">
        {iconContent}
        <div
          className={`columns is-vcentered ${
            isUser ? "" : "is-flex-direction-row-reverse"
          }`}
        >
          <div className="column is-narrow">
            <span
              className={`icon is-large ${
                isUser ? "has-text-primary" : "has-text-info"
              }`}
            >
              <i className={`fas fa-${isUser ? "user" : "robot"} fa-2x`}></i>
            </span>
          </div>
          <div className="column">
            <div className={`${isUser ? "has-text-left" : "has-text-right"}`}>
              <ReactMarkdown>{message.message}</ReactMarkdown>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
