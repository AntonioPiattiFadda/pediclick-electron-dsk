/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/service/auth";
import { getUserDataByUid } from "@/service/profiles";
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
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setError(null);

      //FICME CORREGIR ESTO
      const response = await getUserDataByUid();
      //Buscar al usuario en base de datos para ponerlo en la app
      dispatch(setUser(response.data));
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

  // const { handlePrintTicket } = usePrinter();

  // const vendorData = {
  //   razonSocial: 'Razon Social',
  //   direccion: 'PUNTO DE VENTA 1 - AV. EJEMPLO 1234',
  //   cuit: '20-12345678-9'
  // };

  // const orderItems = [{
  //   name: 'string',
  //   quantity: 4,
  //   price: 45,
  //   iva: 11,
  // }];

  // const order = {
  //   invoiceType: "FACTURA A",
  //   items: orderItems,
  //   total: 45
  // };

  // const { handleConnectScale } = useScale();



  return (
    // <AuthLayout
    //   title="Iniciar Sesión"
    //   description="Ingresa tus credenciales para acceder a tu cuenta"
    // >
    <div className="w-screen flex items-center justify-center">
      {/* <div className="absolute top-[50%] left-4">

        <ScaleFetcher />
        <Button onClick={() => handleConnectScale()}>Scale</Button>
      </div> */}
      {/* <div className="absolute top-[50%] left-4">

        <PrinterFetcher />
        <Button onClick={() => handlePrintTicket({
          vendorData,
          order
        })}>Imprimir</Button>
      </div> */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-[400px] w-full">
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



        {/* <div className="flex items-center justify-between">
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
        </div> */}

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

        {/* <div className="text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <a
            href="/sign-up"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Regístrate aquí
          </a>
        </div> */}
      </form>
    </div>
    // </AuthLayout>
  );
}
