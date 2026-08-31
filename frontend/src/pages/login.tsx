import { FormEvent, useState } from "react";
import { loginUser } from "../components/api-client";
import { storeToken } from "../lib/auth";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const result = await loginUser(username.trim(), password);
      storeToken(result.token);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-backdrop">
      <div className="login-card">
        <div className="login-brand">Canela Trace</div>
        <p className="login-sub">AI-Integrated Supply Chain Management</p>

        {error ? (
          <p className="status-error" style={{ marginBottom: "0.75rem" }}>
            {error}
          </p>
        ) : null}

        <form className="form" onSubmit={onSubmit}>
          <label className="form-field">
            <span>Username</span>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
