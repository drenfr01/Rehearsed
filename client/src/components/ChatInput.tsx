import { useState } from "react";
import { Message } from "../interfaces/MessageInterface";

interface ChatInputProps {
  messages: Message[];
  postMessage: any;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function ChatInput({
  messages,
  postMessage,
  setMessages,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    postMessage(message);
    setMessages([...messages, { message, userId: "1" }]);
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
