import { useState } from "react";

const Login = ({
  onSuccess,
}: {
  onSuccess: (data: { token: string; name: string }) => void;
}) => {
  const [email, setEmail] = useState("antonio.piattifadda@gmail.com");
  const [password, setPassword] = useState("Admin12345*");


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
      <button onClick={() => onSuccess({ token: "123", name: "Antonio" })}>
        Entrar
      </button>
      {/* <button onClick={() => mutate({ email, password })} disabled={isPending}>
        {isPending ? "Ingresando..." : "Entrar"}
      </button>
      {error instanceof Error && (
        <small style={{ color: "crimson" }}>{error.message}</small>
      )} */}
    </div>
  );
};

export default Login;
