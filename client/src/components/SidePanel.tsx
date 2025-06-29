import React from "react";

interface SidePanelProps {
  sessionId: string;
  onNewSession: () => void;
}

export default function SidePanel({ sessionId, onNewSession }: SidePanelProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(true);

  return (
    <div
      className={`column ${isOpen ? "is-2" : "is-1"}`}
      style={{
        padding: "1rem",
        backgroundColor: "#f5f5f5",
        borderRight: "1px solid #dbdbdb",
        transition: "all 0.3s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="has-text-centered mb-4">
        <button
          className="button is-small"
          onClick={() => setIsOpen(!isOpen)}
          style={{ width: "100%" }}
        >
          <span className="icon">
            <i
              className={`fas fa-${isOpen ? "chevron-left" : "chevron-right"}`}
            ></i>
          </span>
          <span className="ml-2">Session</span>
        </button>
      </div>

      {isOpen && (
        <>
          <div className="mb-4">
            <label className="label is-small">Current Session ID</label>
            <div className="field">
              <div className="control">
                <input
                  className="input is-small"
                  type="text"
                  value={sessionId}
                  readOnly
                  style={{ fontSize: "0.7rem" }}
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <button
              className="button is-primary is-small"
              onClick={onNewSession}
              style={{ width: "100%" }}
            >
              <span className="icon is-small">
                <i className="fas fa-plus"></i>
              </span>
              <span>New Session</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
