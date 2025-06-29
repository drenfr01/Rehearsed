import ReactMarkdown from "react-markdown";

interface FeedbackPanelProps {
  isLoading: boolean;
  latestFeedback: string;
}

export default function FeedbackPanel({
  isLoading,
  latestFeedback,
}: FeedbackPanelProps) {
  return (
    <div className="column is-3 pl-4">
      <div className="box" style={{ height: "100%" }}>
        <h3 className="title is-5">Feedback</h3>
        <div className="content">
          {isLoading ? (
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
  );
}
