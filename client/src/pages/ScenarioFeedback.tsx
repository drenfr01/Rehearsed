import { useProvideAgentFeedbackMutation } from "../store";
import Markdown from "react-markdown";
import { useEffect } from "react";
import "./ScenarioIntroduction.css";

export default function ScenarioFeedback() {
  const [, results] = useProvideAgentFeedbackMutation({
    fixedCacheKey: "provideAgentFeedback",
  });

  useEffect(() => {
    console.log("Feedback results:", results);
  }, [results]);

  let content;
  if (results.isLoading) {
    content = (
      <div className="has-text-centered py-6">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-pulse fa-2x"></i>
        </span>
        <p className="mt-2">Loading feedback...</p>
      </div>
    );
  } else if (results.error) {
    content = (
      <div className="notification is-danger is-light">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-exclamation-circle"></i>
          </span>
          <span>Error: {results.error.toString()}</span>
        </span>
      </div>
    );
  } else if (!results.data) {
    content = (
      <div className="notification is-info is-light">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-info-circle"></i>
          </span>
          <span>
            No feedback available yet. Please click the Feedback button in the
            simulation to generate feedback.
          </span>
        </span>
      </div>
    );
  } else {
    content = (
      <div className="container is-fluid">
        <div className="box">
          <div className="field">
            <label className="label">Feedback</label>
            <div className="control">
              <div className="content">
                <Markdown>{results.data.agent_response_text}</Markdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <h2 className="title is-4 has-text-primary mb-5 has-text-centered">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-comment-dots"></i>
          </span>
          <span>Simulation Feedback</span>
        </span>
      </h2>
      {content}
    </div>
  );
}
