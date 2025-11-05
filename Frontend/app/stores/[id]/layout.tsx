"use client";
import React from "react";
import { CartProvider } from "../../../src/components/shop/CartContext";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartProvider>{children}</CartProvider>;
}
