import { useState, useRef } from "react";
import { agentAPI } from "../store/apis/agentAPI";
import { useNavigate } from "react-router-dom";
import { FaMicrophone, FaStop } from "react-icons/fa";

interface ChatInputProps {
  postRequest: ReturnType<typeof agentAPI.endpoints.postRequest.useMutation>[0];
  provideOverallFeedback: ReturnType<
    typeof agentAPI.endpoints.provideOverallFeedback.useMutation
  >[0];
  postInlineFeedbackRequest: ReturnType<
    typeof agentAPI.endpoints.postInlineFeedbackRequest.useMutation
  >[0];
  userId: string;
  sessionId: string;
  onUserMessage?: (message: string) => void;
  isLoading?: boolean;
}

export default function ChatInput({
  postRequest,
  provideOverallFeedback,
  postInlineFeedbackRequest,
  userId,
  sessionId,
  onUserMessage,
  isLoading = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const navigate = useNavigate();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(
        "Could not access microphone. Please ensure you have granted microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Call onUserMessage callback if provided
    if (onUserMessage) {
      onUserMessage(message);
    }
    // TODO: make this dynamic based on the scenario
    postRequest({
      agentName: "root_agent",
      message,
      userId: userId,
      sessionId: sessionId,
      audio: audioBlob || undefined,
    });

    // Send the same message to the feedback agent
    postInlineFeedbackRequest({
      agentName: "inline_feedback_agent",
      message,
      userId: userId,
      sessionId: sessionId,
      audio: audioBlob || undefined,
    });

    setMessage("");
    setAudioBlob(null);
  };

  const handleProvideUserFeedback = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    provideOverallFeedback({
      agentName: "overall_feedback_agent",
      message: "Feedback",
      userId: userId,
      sessionId: sessionId,
    });
    navigate("/scenario-feedback");
  };

  return (
    <div className="container is-fluid">
      <form
        onSubmit={handleSubmit}
        className="field has-addons has-addons-right"
      >
        <div className="control is-expanded">
          <input
            className={`input ${isLoading ? "is-static" : ""}`}
            type="text"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
        </div>
        <div className="control">
          <button
            className={`button ${isRecording ? "is-danger" : "is-info"} mx-2`}
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
          >
            <span className="icon">
              {isRecording ? <FaStop /> : <FaMicrophone />}
            </span>
            <span>{isRecording ? "Stop" : "Record"}</span>
          </button>
        </div>
        <div className="control">
          <button
            className={`button is-primary mx-2 ${
              isLoading ? "is-loading" : ""
            }`}
            type="submit"
            disabled={isLoading}
          >
            Send
          </button>
        </div>
        <div className="control">
          <button
            className="button is-info"
            onClick={handleProvideUserFeedback}
          >
            Feedback
          </button>
        </div>
      </form>
      {audioBlob && (
        <div className="mt-2">
          <audio controls src={URL.createObjectURL(audioBlob)} />
        </div>
      )}
    </div>
  );
}
