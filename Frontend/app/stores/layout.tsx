"use client";
import React from "react";
import { CartProvider } from "../../src/components/shop/CartContext";

export default function StoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartProvider>{children}</CartProvider>;
}
