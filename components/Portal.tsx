"use client";
// =====================================================================
// PORTAL — desenha janelas (popups, telas cheias) direto no <body>.
// Sem isso, uma janela aberta de dentro de um cartão animado/inclinado
// fica "presa" no tamanho do cartão (foi o que deixava o "+" espremido).
// =====================================================================
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }: { children: ReactNode }) {
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);
  return pronto ? createPortal(children, document.body) : null;
}
