import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import SidePanel from "../components/SidePanel";
import {
  usePostRequestMutation,
  useProvideAgentFeedbackMutation,
} from "../store";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AgentResponse } from "../interfaces/AgentInterface";

export default function AgentSimulation() {
  // TODO: these will be set by user login
  const userId = "18";
  const [sessionId, setSessionId] = useState<string>("");
  const [latestFeedback, setLatestFeedback] = useState<string>("");
  const [conversation, setConversation] = useState<AgentResponse[]>([]);

  const generateNewSessionId = () => {
    const newSessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", newSessionId);
    setSessionId(newSessionId);
    // Clear conversation when starting a new session
    setConversation([]);
    setLatestFeedback("");
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
  const [provideAgentFeedback] = useProvideAgentFeedbackMutation({
    fixedCacheKey: "provideAgentFeedback",
  });

  // Update feedback when we get a new response
  useEffect(() => {
    if (results.data?.markdown_text) {
      setLatestFeedback(results.data.markdown_text);
    }
  }, [results.data]);

  // Add user message to conversation when they send a message
  const handleUserMessage = (message: string) => {
    const userMessage: AgentResponse = {
      content: message,
      role: "user",
      author: "You",
      message_id: crypto.randomUUID(),
    };
    setConversation((prev) => [...prev, userMessage]);
  };

  // Add agent response to conversation when received
  useEffect(() => {
    if (results.data && !results.isLoading) {
      const agentResponse: AgentResponse = {
        content: results.data.content,
        role: "model",
        author: results.data.author,
        message_id: results.data.message_id,
        audio: results.data.audio,
        markdown_text: results.data.markdown_text,
      };
      setConversation((prev) => [...prev, agentResponse]);
    }
  }, [results.data, results.isLoading]);

  let message_content;
  if (conversation.length > 0) {
    message_content = (
      <div>
        {conversation.map((response: AgentResponse) => (
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
                Start your conversation with the students to begin your teaching
                journey.
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

  // Pass loading state to ChatInput
  const content = (
    <ChatInput
      postRequest={postRequest}
      provideAgentFeedback={provideAgentFeedback}
      userId={userId}
      sessionId={sessionId}
      onUserMessage={handleUserMessage}
      isLoading={results.isLoading}
    />
  );

  return (
    <section className="hero is-fullheight">
      <div className="hero-body" style={{ padding: 0 }}>
        <div className="container" style={{ height: "100%", padding: 0 }}>
          <div className="columns" style={{ height: "100%", margin: 0 }}>
            {/* Side Panel Component */}
            <SidePanel
              sessionId={sessionId}
              onNewSession={generateNewSessionId}
            />

            {/* Main Chat Column */}
            <div className="column is-7 pr-4 has-background-white">
              <div
                className="box"
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    msOverflowStyle: "none" /* IE and Edge */,
                    scrollbarWidth: "none" /* Firefox */,
                  }}
                >
                  <style>
                    {`
                      div::-webkit-scrollbar {
                        display: none;  /* Chrome, Safari and Opera */
                      }
                    `}
                  </style>
                  {message_content}
                </div>
                <hr className="my-4" />
                <div>{content}</div>
              </div>
            </div>

            {/* Right column - Feedback */}
            <div className="column is-3 pl-4">
              <div className="box" style={{ height: "100%" }}>
                <h3 className="title is-5">Feedback</h3>
                <div className="content">
                  {results.isLoading ? (
                    <div className="has-text-centered">
                      <div className="button is-loading is-small is-white"></div>
                      <p className="mt-2">Loading feedback...</p>
                    </div>
                  ) : latestFeedback ? (
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
              <div className="column is-10">
                {/* Empty column to align with the chat panel */}
              </div>
              <div className="column is-3">
                {/* Empty column to align with the feedback panel */}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
