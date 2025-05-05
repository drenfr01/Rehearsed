import { useProvideAgentFeedbackMutation } from "../store";
import Markdown from "react-markdown";
import { useEffect } from "react";

export default function ScenarioFeedback() {
  const [, results] = useProvideAgentFeedbackMutation({
    fixedCacheKey: "provideAgentFeedback",
  });

  useEffect(() => {
    console.log("Feedback results:", results);
  }, [results]);

  let content;
  if (results.isLoading) {
    content = <div className="has-text-centered">Loading...</div>;
  } else if (results.error) {
    content = (
      <div className="has-text-danger">Error: {results.error.toString()}</div>
    );
  } else if (!results.data) {
    content = (
      <div className="has-text-centered">
        No feedback available yet. Please click the Feedback button in the
        simulation to generate feedback.
      </div>
    );
  } else {
    content = <Markdown>{results.data}</Markdown>;
  }

  return (
    <div className="box">
      <div className="label is-size-5 mb-4">Simulation Feedback</div>
      {content}
    </div>
  );
}
