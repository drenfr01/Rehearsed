import ChatMessage from "../components/ChatMessage";
import ChatOverview from "../components/ChatOverview";
import ChatInput from "../components/ChatInput";

import { useState } from "react";
import { Message } from "../interfaces/MessageInterface";
import { usePostMessageMutation, useFetchMessagesQuery } from "../store";

export default function Simulation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [postMessage, results] = usePostMessageMutation();
  const { data, error, isFetching } = useFetchMessagesQuery("1");

  let message_content;
  if (isFetching) {
    message_content = <div>Loading...</div>;
  } else if (error) {
    message_content = <div>Error: {error.toString()}</div>;
  } else {
    message_content = (
      <div>
        {data?.map((message: Message) => (
          <div key={message.userId}>{message.message}</div>
        ))}
      </div>
    );
  }

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
        <div className="container">{message_content}</div>
      </div>
      <div className="hero-foot">
        <footer className="section is-small">{content}</footer>
      </div>
    </section>
  );
}
