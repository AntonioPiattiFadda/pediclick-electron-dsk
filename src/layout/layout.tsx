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
      <main className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <div>{children}</div>
      </main>

    );
  }

  return (

    <main className="flex h-screen w-screen flex-col items-center bg-gray-100">
      <Header />
      <div >{children}</div>
    </main>

  );
};
