import { Navigate, useLocation } from "react-router-dom";
import { useGetCurrentUserQuery } from "../store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { data: user, isLoading, isError } = useGetCurrentUserQuery();

  if (isLoading) {
    return (
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-half">
            <div className="box" style={{ marginTop: "2rem" }}>
              <div className="has-text-centered">
                <div className="button is-loading is-large is-white"></div>
                <p className="mt-3">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    // Redirect to login page but save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
