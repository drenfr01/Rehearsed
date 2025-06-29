import ChatMessage from "../components/ChatMessage";
import ChatOverview from "../components/ChatOverview";
import ChatInput from "../components/ChatInput";
import {
  usePostRequestMutation,
  useFetchConversationQuery,
  useProvideAgentFeedbackMutation,
  usePostFeedbackRequestMutation,
} from "../store";
import { useEffect, useState } from "react";

export default function Simulation() {
  const userId = "1"; // TODO: Get from auth context
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Generate a new session ID if one doesn't exist in localStorage
    const storedSessionId = localStorage.getItem("sessionId");
    if (!storedSessionId) {
      const newSessionId = crypto.randomUUID();
      localStorage.setItem("sessionId", newSessionId);
      setSessionId(newSessionId);
    } else {
      setSessionId(storedSessionId);
    }
  }, []);

  const [postRequest, results] = usePostRequestMutation();
  const { data, error, isFetching } = useFetchConversationQuery({
    userId,
    sessionId,
  });
  const [provideAgentFeedback] = useProvideAgentFeedbackMutation({
    fixedCacheKey: "provideAgentFeedback",
  });
  const [postFeedbackRequest] = usePostFeedbackRequestMutation();

  let message_content;
  if (isFetching) {
    message_content = <div>Loading...</div>;
  } else if (error) {
    message_content = <div>Error: {error.toString()}</div>;
  } else {
    message_content = (
      <div>
        {data?.turns.map((message) => (
          <ChatMessage
            key={message.message_id}
            message={{
              ...message,
              role: message.role as "user" | "model",
            }}
          />
        ))}
      </div>
    );
  }

  let content = (
    <ChatInput
      postRequest={postRequest}
      provideAgentFeedback={provideAgentFeedback}
      postFeedbackRequest={postFeedbackRequest}
      userId={userId}
      sessionId={sessionId}
    />
  );
  if (results.isLoading) {
    content = (
      <div className="has-text-centered">
        <div className="mb-4">
          <span className="icon is-large">
            <i className="fas fa-spinner fa-pulse fa-2x"></i>
          </span>
        </div>
        <p className="has-text-grey">Sending your message...</p>
      </div>
    );
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
