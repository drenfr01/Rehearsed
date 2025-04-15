import { Link } from "react-router-dom";

export default function Header() {
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
            <Link to="/simulation" className="navbar-item">
              Simulation
            </Link>
            <Link to="/scenario-feedback" className="navbar-item">
              Scenario Feedback
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
