import { useState } from "react";
import { agentAPI } from "../store/apis/agentAPI";
import { useNavigate } from "react-router-dom";

interface ChatInputProps {
  postRequest: ReturnType<typeof agentAPI.endpoints.postRequest.useMutation>[0];
  provideAgentFeedback: ReturnType<
    typeof agentAPI.endpoints.provideAgentFeedback.useMutation
  >[0];
  userId: string;
  sessionId: string;
}

export default function ChatInput({
  postRequest,
  provideAgentFeedback,
  userId,
  sessionId,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    postRequest({ message, userId: userId, sessionId: sessionId });
  };

  const handleProvideUserFeedback = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    provideAgentFeedback({
      message: "Feedback",
      userId: userId,
      sessionId: sessionId,
    });
    navigate("/scenario-feedback");
  };

  return (
    <div className="container is-fluid">
      <form
        onSubmit={handleSubmit}
        className="field has-addons has-addons-right"
      >
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
          <button className="button is-primary mx-2" type="submit">
            Send
          </button>
        </div>
        <div className="control">
          <button
            className="button is-info"
            onClick={handleProvideUserFeedback}
          >
            Feedback
          </button>
        </div>
      </form>
    </div>
  );
}
