import { useProvideUserFeedbackMutation } from "../store";
import Markdown from "react-markdown";

export default function ScenarioFeedback() {
  const [provideUserFeedback, results] = useProvideUserFeedbackMutation({
    fixedCacheKey: "provideUserFeedback",
  });
  let content;
  if (results.isLoading) {
    content = <div>Loading...</div>;
  } else if (results.error) {
    content = <div>Error</div>;
  } else {
    console.log(results);
    content = <Markdown>{results.data?.feedback}</Markdown>;
  }
  return <div>{content}</div>;
}
