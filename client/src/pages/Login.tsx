import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLoginMutation } from "../store";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading, error }] = useLoginMutation();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login(formData).unwrap();
      // Store the token in localStorage
      localStorage.setItem("token", response.access_token);
      // Redirect to the originally requested page or home
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      // Error is handled by the error state from the mutation
      console.error("Login failed:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container">
      <div className="columns is-centered">
        <div className="column is-half">
          <div className="box" style={{ marginTop: "2rem" }}>
            <h1 className="title has-text-centered">Sign in</h1>
            {error && (
              <div className="notification is-danger">
                Invalid username or password
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="label">Username</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">Password</label>
                <div className="control">
                  <input
                    className="input"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <div className="control">
                  <button
                    className={`button is-primary is-fullwidth ${
                      isLoading ? "is-loading" : ""
                    }`}
                    type="submit"
                    disabled={isLoading}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
