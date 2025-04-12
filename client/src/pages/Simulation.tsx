import ChatMessage from "../components/ChatMessage";
import ChatOverview from "../components/ChatOverview";
import ChatInput from "../components/ChatInput";

import { useState } from "react";
import { Message } from "../interfaces/MessageInterface";
import { usePostMessageMutation } from "../store";

export default function Simulation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [postMessage, results] = usePostMessageMutation();

  // TODO: add in loading spinner
  let content = (
    <ChatInput
      messages={messages}
      postMessage={postMessage}
      setMessages={setMessages}
    />
  );
  if (results.isLoading) {
    content = <div>Loading...</div>;
  }
  return (
    <section className="hero is-fullheight">
      <div className="hero-head has-text-centered">
        <ChatOverview />
      </div>
      <div className="hero-body">
        <div className="container">
          <ChatMessage />
        </div>
      </div>
      <div className="hero-foot">
        <footer className="section is-small">{content}</footer>
      </div>
    </section>
  );
}
