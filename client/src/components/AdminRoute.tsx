import { Navigate } from "react-router-dom";
import { useGetCurrentUserQuery } from "../store";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
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

  if (isError || !user || !user.admin) {
    // Redirect to home page if not admin
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
