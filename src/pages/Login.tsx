/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/service/auth";
import type { AppDispatch } from "@/stores/store";
import { setUser } from "@/stores/userSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

export function SignIn() {
  const [email, setEmail] = useState("antonio.piattifadda@gmail.com");
  const [password, setPassword] = useState("Admin12345*");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();

  const navigate = useNavigate();
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return await signIn(credentials.email, credentials.password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setError(null);
      //Buscar al usuario en base de datos para ponerlo en la app
      dispatch(setUser({ email, full_name: "", role: "user", id: "1", avatar_url: null, phone: null, address: null, is_verified: false, parent_user_id: "", store_id: 0, job_position: null, created_at: "", updated_at: "", deleted_at: null }));
      navigate("/select-store");
    },
    onError: (err: any) => {
      setError(err.message || "Error al iniciar sesión");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const loading = loginMutation.isPending;

  return (
    // <AuthLayout
    //   title="Iniciar Sesión"
    //   description="Ingresa tus credenciales para acceder a tu cuenta"
    // >
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground font-medium">
          Correo electrónico
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            placeholder="ejemplo@correo.com"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground font-medium">
          Contraseña
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            placeholder="Tu contraseña"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            id="remember"
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="remember" className="text-sm text-muted-foreground">
            Recordarme
          </Label>
        </div>
        <a
          href="/forgot-password"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          "Iniciar Sesión"
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{" "}
        <a
          href="/sign-up"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Regístrate aquí
        </a>
      </div>
    </form>
    // </AuthLayout>
  );
}
