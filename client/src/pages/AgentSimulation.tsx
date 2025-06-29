import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import SidePanel from "../components/SidePanel";
import FeedbackPanel from "../components/FeedbackPanel";
import {
  usePostRequestMutation,
  useProvideOverallFeedbackMutation,
  useCreateSessionMutation,
  useGetSessionContentQuery,
  usePostInlineFeedbackRequestMutation,
} from "../store";
import { useEffect, useState } from "react";
import { AgentResponse } from "../interfaces/AgentInterface";
import {
  ConversationResponse,
  ConversationTurn,
} from "../interfaces/SessionInterface";

export default function AgentSimulation() {
  // TODO: these will be set by user login
  const userId = "18";
  const [sessionId, setSessionId] = useState<string>("");
  const [latestFeedback, setLatestFeedback] = useState<string>("");
  const [conversation, setConversation] = useState<AgentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [createSession] = useCreateSessionMutation();

  // Query for session content when sessionId changes
  const { data: sessionContent, isLoading: isLoadingSessionContent } =
    useGetSessionContentQuery(
      { user_id: userId, session_id: sessionId },
      {
        skip: !sessionId,
        refetchOnMountOrArgChange: true,
      }
    );

  // Helper function to transform server conversation to AgentResponse format
  const transformServerConversation = (
    serverConversation: ConversationResponse
  ): AgentResponse[] => {
    if (!serverConversation?.turns) return [];

    return serverConversation.turns.map((turn: ConversationTurn) => ({
      content: turn.content,
      role: turn.role as "user" | "model",
      author: turn.author,
      message_id: turn.message_id,
      audio: turn.audio,
      markdown_text: undefined, // Server doesn't provide markdown_text for historical messages
    }));
  };

  // Helper function to get conversation from localStorage
  const getConversationFromStorage = (sessionId: string): AgentResponse[] => {
    try {
      const stored = localStorage.getItem(`conversation_${sessionId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading conversation from storage:", error);
      return [];
    }
  };

  // Helper function to save conversation to localStorage
  const saveConversationToStorage = (
    sessionId: string,
    conversation: AgentResponse[]
  ) => {
    try {
      localStorage.setItem(
        `conversation_${sessionId}`,
        JSON.stringify(conversation)
      );
    } catch (error) {
      console.error("Error saving conversation to storage:", error);
    }
  };

  // Helper function to clear conversation from localStorage
  const clearConversationFromStorage = (sessionId: string) => {
    try {
      localStorage.removeItem(`conversation_${sessionId}`);
    } catch (error) {
      console.error("Error clearing conversation from storage:", error);
    }
  };

  const generateNewSessionId = async () => {
    try {
      console.log("Creating new session for user:", userId);

      // Set switching state and clear conversation immediately
      setIsLoading(true);
      setConversation([]);
      setLatestFeedback("");

      const result = await createSession({ user_id: userId }).unwrap();
      console.log("Create session result:", result);

      if (result && result.sessions && result.sessions.length > 0) {
        const newSessionId = result.sessions[0].id;
        console.log("New session created with ID:", newSessionId);
        localStorage.setItem("sessionId", newSessionId);
        setSessionId(newSessionId);
        // Clear any existing conversation for this session
        clearConversationFromStorage(newSessionId);
        // Clear switching state since we've created the new session
        setIsLoading(false);
      } else {
        console.warn("No session returned from server, using fallback");
        throw new Error("No session returned");
      }
    } catch (error) {
      console.error("Failed to create new session:", error);
      // Fallback to local generation if server fails
      const newSessionId = crypto.randomUUID();
      console.log("Using fallback session ID:", newSessionId);
      localStorage.setItem("sessionId", newSessionId);
      setSessionId(newSessionId);
      // Clear any existing conversation for this session
      clearConversationFromStorage(newSessionId);
      // Clear switching state since we've created the new session
      setIsLoading(false);
    }
  };

  const handleSessionSelect = async (selectedSessionId: string) => {
    console.log("Session selection started:", selectedSessionId);
    setIsLoading(true);
    setSessionId(selectedSessionId);
    localStorage.setItem("sessionId", selectedSessionId);
    setLatestFeedback("");

    // Clear conversation immediately to show loading state
    setConversation([]);
  };

  // Simple timeout to clear loading state if stuck
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log("Clearing stuck loading state");
        setIsLoading(false);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // Load conversation from server when session content is available
  useEffect(() => {
    if (sessionContent && !isLoadingSessionContent) {
      console.log("Loading conversation from server:", sessionContent);
      const serverConversation = transformServerConversation(sessionContent);

      // Always use server data when available
      setConversation(serverConversation);
      saveConversationToStorage(sessionId, serverConversation);

      // Clear loading state
      setIsLoading(false);
    }
  }, [sessionContent, isLoadingSessionContent, sessionId]);

  useEffect(() => {
    // Generate a new session ID if one doesn't exist in localStorage
    const storedSessionId = localStorage.getItem("sessionId");
    if (!storedSessionId) {
      generateNewSessionId();
    } else {
      setSessionId(storedSessionId);
      // Load conversation for the stored session from localStorage as fallback
      const sessionConversation = getConversationFromStorage(storedSessionId);
      setConversation(sessionConversation);
    }
  }, []);

  const [postRequest, results] = usePostRequestMutation();
  const [provideOverallFeedback] = useProvideOverallFeedbackMutation({
    fixedCacheKey: "provideOverallFeedback",
  });
  const [postInlineFeedbackRequest, feedbackResults] =
    usePostInlineFeedbackRequestMutation();

  // Update feedback when we get a new feedback response
  useEffect(() => {
    if (feedbackResults.data) {
      setLatestFeedback(feedbackResults.data.content);
    }
  }, [feedbackResults.data]);

  // Add user message to conversation when they send a message
  const handleUserMessage = (message: string) => {
    const userMessage: AgentResponse = {
      content: message,
      role: "user",
      author: "You",
      message_id: crypto.randomUUID(),
    };
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    // Save to localStorage
    saveConversationToStorage(sessionId, updatedConversation);
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
      setConversation((prevConversation) => {
        const updatedConversation = [...prevConversation, agentResponse];
        // Save to localStorage
        saveConversationToStorage(sessionId, updatedConversation);
        return updatedConversation;
      });
    }
  }, [results.data, results.isLoading, sessionId]);

  let message_content;
  if (isLoading) {
    message_content = (
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-half">
            <div
              className="box has-text-centered"
              style={{ marginTop: "2rem" }}
            >
              <div className="button is-loading is-large is-white"></div>
              <p className="mt-4">Loading conversation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (conversation.length > 0) {
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
      provideOverallFeedback={provideOverallFeedback}
      postInlineFeedbackRequest={postInlineFeedbackRequest}
      userId={userId}
      sessionId={sessionId}
      onUserMessage={handleUserMessage}
      isLoading={results.isLoading || feedbackResults.isLoading}
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
              userId={userId}
              onNewSession={generateNewSessionId}
              onSessionSelect={handleSessionSelect}
              isLoading={isLoading}
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
            <FeedbackPanel
              isLoading={results.isLoading || feedbackResults.isLoading}
              latestFeedback={latestFeedback}
            />
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
