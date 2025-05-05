import ChatMessage from "../components/ChatMessage";
import ChatOverview from "../components/ChatOverview";
import ChatInput from "../components/ChatInput";
import { AgentResponse } from "../interfaces/AgentInterface";
import {
  usePostRequestMutation,
  useFetchConversationQuery,
  useProvideAgentFeedbackMutation,
} from "../store";
import { useEffect, useState } from "react";

export default function AgentSimulation() {
  // TODO: these will be set by user login
  const userId = "18";
  const [sessionId, setSessionId] = useState<string>("");

  const generateNewSessionId = () => {
    const newSessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", newSessionId);
    setSessionId(newSessionId);
  };

  useEffect(() => {
    // Generate a new session ID if one doesn't exist in localStorage
    const storedSessionId = localStorage.getItem("sessionId");
    if (!storedSessionId) {
      generateNewSessionId();
    } else {
      setSessionId(storedSessionId);
    }
  }, []);

  const [postRequest, results] = usePostRequestMutation();
  const { data, error, isFetching } = useFetchConversationQuery({
    userId: userId,
    sessionId: sessionId,
  });
  const [provideAgentFeedback] = useProvideAgentFeedbackMutation({
    fixedCacheKey: "provideAgentFeedback",
  });

  let message_content;
  if (isFetching) {
    message_content = (
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-half">
            <div className="box" style={{ marginTop: "2rem" }}>
              <div className="has-text-centered">
                <div className="button is-loading is-large is-white"></div>
                <p className="mt-3">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (error) {
    message_content = <div>Error: {error.toString()}</div>;
  } else {
    if (data.turns.length > 0) {
      message_content = (
        <div>
          {data?.turns.map((response: AgentResponse) => (
            <ChatMessage key={response.message_id} message={response} />
          ))}
        </div>
      );
    } else {
      message_content = <div>Start your conversation!</div>;
    }
  }

  // TODO: add in loading spinner
  let content = (
    <ChatInput
      postRequest={postRequest}
      provideAgentFeedback={provideAgentFeedback}
      userId={userId}
      sessionId={sessionId}
    />
  );
  if (results.isLoading) {
    content = (
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-half">
            <div className="box" style={{ marginTop: "2rem" }}>
              <div className="has-text-centered">
                <div className="button is-loading is-large is-white"></div>
                <p className="mt-3">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <section className="hero is-fullheight">
      <div className="hero-head has-text-centered">
        <div className="container">
          <ChatOverview />
          <button
            className="button is-primary is-small mt-2"
            onClick={generateNewSessionId}
          >
            New Session
          </button>
        </div>
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
