import Header from "@/components/header/header";
import React from "react";
import { useLocation } from "react-router-dom";

const PUBLIC_ROUTES = ["/", "/login"];

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const pathName = useLocation().pathname;
  const isInPublicRoute = PUBLIC_ROUTES.includes(pathName);

  if (isInPublicRoute) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="w-full max-w-7xl px-4 py-6">{children}</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <div className="container mx-auto w-full max-w-7xl px-4 py-6">{children}</div>
    </main>
  );
};
