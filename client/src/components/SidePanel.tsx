import React from "react";
import { useGetAllSessionsForUserQuery } from "../store";

interface SidePanelProps {
  sessionId: string;
  userId: string;
  onNewSession: () => void;
  onSessionSelect?: (sessionId: string) => void;
}

export default function SidePanel({
  sessionId,
  userId,
  onNewSession,
  onSessionSelect,
}: SidePanelProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(true);

  // Fetch all sessions for the user
  const {
    data: sessionsData,
    isLoading,
    error,
  } = useGetAllSessionsForUserQuery({
    user_id: userId,
  });

  // Debug logging
  React.useEffect(() => {
    console.log("SidePanel - userId:", userId);
    console.log("SidePanel - sessionsData:", sessionsData);
    console.log("SidePanel - isLoading:", isLoading);
    console.log("SidePanel - error:", error);
  }, [userId, sessionsData, isLoading, error]);

  const handleSessionClick = (sessionId: string) => {
    if (onSessionSelect) {
      onSessionSelect(sessionId);
    }
  };

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

          {/* Sessions List */}
          <div className="mb-4">
            <label className="label is-small">Your Sessions</label>
            <div
              className="content"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              {isLoading ? (
                <div className="has-text-centered">
                  <div className="button is-loading is-small is-white"></div>
                  <p className="mt-2 is-size-7">Loading sessions...</p>
                </div>
              ) : error ? (
                <p className="has-text-danger is-size-7">
                  Error loading sessions
                </p>
              ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
                <div className="menu-list">
                  {sessionsData.sessions.map((session) => (
                    <a
                      key={session.id}
                      className={`menu-item ${
                        session.id === sessionId ? "is-active" : ""
                      }`}
                      onClick={() => handleSessionClick(session.id)}
                      style={{
                        display: "block",
                        padding: "0.5rem",
                        marginBottom: "0.25rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        backgroundColor:
                          session.id === sessionId ? "#3273dc" : "transparent",
                        color: session.id === sessionId ? "white" : "inherit",
                      }}
                    >
                      <div>
                        <strong>Session {session.id.slice(0, 8)}...</strong>
                      </div>
                      <div style={{ fontSize: "0.65rem", opacity: 0.7 }}>
                        {new Date(
                          parseInt(session.lastUpdateTime) * 1000
                        ).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZoneName: "short",
                        })}
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="has-text-grey is-size-7">No sessions found</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
