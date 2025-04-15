import { useProvideUserFeedbackMutation } from "../store";
import Markdown from "react-markdown";

export default function ScenarioFeedback() {
  const [provideUserFeedback, results] = useProvideUserFeedbackMutation({
    fixedCacheKey: "provideUserFeedback",
  });
  let content;
  if (results.isLoading) {
    content = <div className="has-text-centered">Loading...</div>;
  } else if (results.error) {
    content = <div className="has-text-danger">Error</div>;
  } else {
    console.log(results);
    content = <Markdown>{results.data?.feedback}</Markdown>;
  }
  return (
    <div className="box">
      <div className="label is-size-5 mb-4">Simulation Feedback</div>
      {content}
    </div>
  );
}
