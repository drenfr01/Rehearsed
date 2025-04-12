import ChatMessage from "../components/ChatMessage";
import ChatOverview from "../components/ChatOverview";
import ChatInput from "../components/ChatInput";

import { useState } from "react";
import { Message, ResponseMessage } from "../interfaces/MessageInterface";
import { usePostMessageMutation, useFetchMessagesQuery } from "../store";

export default function Simulation() {
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
        {data?.map((message: ResponseMessage) => (
          <div key={message.message_id}>{message.message}</div>
        ))}
      </div>
    );
  }

  // TODO: add in loading spinner
  let content = <ChatInput postMessage={postMessage} />;
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
