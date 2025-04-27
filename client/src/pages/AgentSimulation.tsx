import ChatMessage from "../components/ChatMessage";
import ChatOverview from "../components/ChatOverview";
import ChatInput from "../components/ChatInput";
import { AgentResponse } from "../interfaces/AgentInterface";
import {
  usePostRequestMutation,
  useFetchConversationQuery,
  useProvideAgentFeedbackMutation,
} from "../store";

export default function AgentSimulation() {
  const userId = "9";
  const sessionId = "234";

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
    message_content = <div>Loading...</div>;
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
