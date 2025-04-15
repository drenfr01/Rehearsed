import { useState } from "react";
import { conversationAPI } from "../store/apis/conversationAPI";
import { useNavigate } from "react-router-dom";

interface ChatInputProps {
  postMessage: ReturnType<
    typeof conversationAPI.endpoints.postMessage.useMutation
  >[0];
  provideUserFeedback: ReturnType<
    typeof conversationAPI.endpoints.provideUserFeedback.useMutation
  >[0];
}

export default function ChatInput({
  postMessage,
  provideUserFeedback,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    postMessage({ message, userId: 1 });
  };

  const handleProvideUserFeedback = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    provideUserFeedback({ userId: "1" });
    navigate("/scenario-feedback");
  };

  return (
    <div className="container is-fluid">
      <form onSubmit={handleSubmit} className="field has-addons">
        <div className="control is-expanded">
          <input
            className="input"
            type="text"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
        </div>
        <div className="control">
          <button className="button is-primary" type="submit">
            Send
          </button>
        </div>
        <div className="control">
          <button
            className="button is-danger"
            onClick={handleProvideUserFeedback}
          >
            End Conversation
          </button>
        </div>
      </form>
    </div>
  );
}
