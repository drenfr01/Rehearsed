import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link
              to="/"
              className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/simulation"
              className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600 transition-colors"
            >
              Simulation
            </Link>
            <Link
              to="/scenario-feedback"
              className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600 transition-colors"
            >
              Scenario Feedback
            </Link>
          </div>
        </div>
      </nav>
      <hr />
    </header>
  );
}
