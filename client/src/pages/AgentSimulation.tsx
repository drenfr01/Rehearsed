import ChatMessage from "../components/ChatMessage";
import ChatOverview from "../components/ChatOverview";
import ChatInput from "../components/ChatInput";
import {
  usePostRequestMutation,
  useFetchConversationQuery,
  useProvideAgentFeedbackMutation,
} from "../store";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function AgentSimulation() {
  // TODO: these will be set by user login
  const userId = "18";
  const [sessionId, setSessionId] = useState<string>("");
  const [latestFeedback, setLatestFeedback] = useState<string>("");

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

  // Update feedback when we get a new response
  useEffect(() => {
    if (results.data?.markdown_text) {
      setLatestFeedback(results.data.markdown_text);
    }
  }, [results.data]);

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
      message_content = (
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-half">
              <div
                className="box has-text-centered"
                style={{ marginTop: "2rem" }}
              >
                <h2 className="title is-4 mb-4">Welcome to Time to Teach!</h2>
                <p className="subtitle is-6">
                  Start your conversation with the students to begin your
                  teaching journey.
                </p>
                <div className="mt-4">
                  <span className="icon is-large">
                    <i className="fas fa-robot fa-2x"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
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
        <div className="container">
          <div className="columns">
            {/* Left column - Chat */}
            <div className="column is-8 pr-4 has-background-white">
              <div
                className="box"
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {message_content}
                </div>
                <hr className="my-4" />
                <div>{content}</div>
              </div>
            </div>
            {/* Right column - Feedback */}
            <div className="column is-4 pl-4">
              <div className="box" style={{ height: "100%" }}>
                <h3 className="title is-5">Feedback</h3>
                <div className="content">
                  {latestFeedback ? (
                    <ReactMarkdown>{latestFeedback}</ReactMarkdown>
                  ) : (
                    <p>No feedback yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-foot">
        <footer className="section is-small">
          <div className="container">
            <div className="columns">
              <div className="column is-8">
                {/* Empty column to align with the chat panel */}
              </div>
              <div className="column is-4">
                {/* Empty column to align with the feedback panel */}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
