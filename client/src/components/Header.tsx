import { Link, useNavigate } from "react-router-dom";
import { useGetCurrentUserQuery } from "../store/apis/authAPI";

export default function Header() {
  const navigate = useNavigate();
  const { data: user } = useGetCurrentUserQuery();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="navbar is-white has-shadow">
      <div className="container">
        <div className="navbar-brand">
          <div className="navbar-start">
            <Link to="/" className="navbar-item">
              Scenario Selection
            </Link>
            <Link to="/scenario-introduction" className="navbar-item">
              Scenario Introduction
            </Link>
            <Link to="/agent-simulation" className="navbar-item">
              Agent Simulation
            </Link>
            <Link to="/scenario-feedback" className="navbar-item">
              Scenario Feedback
            </Link>
          </div>
        </div>
        <div className="navbar-end">
          {user?.admin && (
            <Link to="/admin/agents" className="navbar-item">
              Admin Agents
            </Link>
          )}
          <div className="navbar-item">
            <button className="button is-light" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
