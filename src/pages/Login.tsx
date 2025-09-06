import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../App";

const Login = ({
  onSuccess,
}: {
  onSuccess: (data: { token: string; name: string }) => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutate, isPending, error } = useMutation({
    mutationFn: api.login,
    onSuccess,
  });
  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 280 }}>
      <h2>Login</h2>
      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={() => mutate({ email, password })} disabled={isPending}>
        {isPending ? "Ingresando..." : "Entrar"}
      </button>
      {error instanceof Error && (
        <small style={{ color: "crimson" }}>{error.message}</small>
      )}
    </div>
  );
};

export default Login;
