import { useState } from "react";
import { conversationAPI } from "../store/apis/conversationAPI";

interface ChatInputProps {
  postMessage: ReturnType<
    typeof conversationAPI.endpoints.postMessage.useMutation
  >[0];
}

export default function ChatInput({ postMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    postMessage({ message, userId: 1 });
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
      </form>
    </div>
  );
}
