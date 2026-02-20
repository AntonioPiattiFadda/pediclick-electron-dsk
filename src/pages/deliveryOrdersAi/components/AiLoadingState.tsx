import { useState, useEffect, useMemo } from "react";
import { Sparkles, Check } from "lucide-react";

interface AiLoadingStateProps {
  userPrompt: string;
}

function extractProductKeywords(text: string): string[] {
  const stopwords = new Set([
    "de", "del", "la", "el", "los", "las", "un", "una", "y", "o", "con",
    "por", "para", "en", "a", "e", "u", "que", "me", "le", "se", "si",
    "no", "mi", "tu", "su", "al", "lo", "hay", "quiero", "pedir", "dame",
    "necesito", "traeme", "traer", "mas", "más", "menos", "favor", "por",
    "unos", "unas", "como", "son", "dos", "tres", "mas",
  ]);

  const cleaned = text
    .toLowerCase()
    .replace(
      /\b\d+(\.\d+)?\s*(kg|g|gr|lb|l|lt|ml|kilos?|gramos?|litros?|cajas?|unidades?|piezas?|bolsas?|bandejas?|docenas?|paquetes?)\b/gi,
      " "
    )
    .replace(/\b\d+\b/g, " ")
    .replace(/[^\wáéíóúüñ\s]/g, " ");

  const words = cleaned
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));

  return [...new Set(words)].slice(0, 3);
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type MessageFn = (kw: string[]) => string;

const STEP_VARIANTS: MessageFn[][] = [
  // Step 1 — Analyzing
  [
    (kw) =>
      kw.length > 2
        ? "Detectando múltiples productos en el pedido..."
        : kw.length > 0
        ? `Detectando ${kw.map(cap).join(" y ")} en el pedido...`
        : "Analizando descripción del pedido...",
    (kw) =>
      kw.length > 2
        ? "Analizando el pedido completo..."
        : kw.length > 0
        ? `Identificando ${cap(kw[0])} y otros productos...`
        : "Interpretando tu solicitud...",
    () => "Comprendiendo el pedido con AI...",
    () => "Procesando el mensaje...",
  ],
  // Step 2 — Searching catalog
  [
    (kw) =>
      kw.length > 2
        ? "Buscando los productos en el catálogo..."
        : kw.length > 0
        ? `Buscando ${cap(kw[0])} en el catálogo...`
        : "Buscando productos en catálogo...",
    (kw) =>
      kw.length > 2
        ? "Localizando todos los artículos..."
        : kw.length > 1
        ? `Localizando ${cap(kw[0])} y ${cap(kw[1])}...`
        : "Explorando catálogo de productos...",
    () => "Consultando inventario disponible...",
    () => "Verificando disponibilidad de stock...",
  ],
  // Step 3 — Calculating
  [
    (kw) =>
      kw.length > 2
        ? "Calculando precios del pedido..."
        : kw.length > 0
        ? `Calculando precios para ${cap(kw[0])}...`
        : "Calculando cantidades y precios...",
    (kw) =>
      kw.length > 2
        ? "Confirmando disponibilidad de los artículos..."
        : kw.length > 0
        ? `Confirmando disponibilidad de ${cap(kw[0])}...`
        : "Confirmando disponibilidad...",
    () => "Verificando precios actualizados...",
    () => "Optimizando cantidades del pedido...",
  ],
  // Step 4 — Building order
  [
    () => "Construyendo orden final...",
    () => "Armando tu pedido...",
    () => "Generando ítems del carrito...",
    () => "Finalizando estructura del pedido...",
  ],
];

export function AiLoadingState({ userPrompt }: AiLoadingStateProps) {
  const [visibleSteps, setVisibleSteps] = useState(0);

  const steps = useMemo(() => {
    const keywords = extractProductKeywords(userPrompt);
    return STEP_VARIANTS.map((variants) => {
      const fn = variants[Math.floor(Math.random() * variants.length)];
      return fn(keywords);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timers = steps.slice(1).map((_, i) =>
      setTimeout(() => setVisibleSteps(i + 1), (i + 1) * 1400)
    );
    return () => timers.forEach(clearTimeout);
  }, [steps]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-10">

      {/* Orb */}
      <div className="relative flex items-center justify-center w-32 h-32">

        {/* Pulsing rings */}
        {[0, 0.8, 1.6].map((delay) => (
          <div
            key={delay}
            className="absolute w-32 h-32 rounded-full border border-violet-500/40"
            style={{ animation: `ai-ring-pulse 2.4s ease-out infinite ${delay}s` }}
          />
        ))}

        {/* Dashed orbit track */}
        <div
          className="absolute w-24 h-24 rounded-full border border-dashed border-violet-400/30 animate-spin"
          style={{ animationDuration: "9s" }}
        />

        {/* Orbiting dot 1 — fast */}
        <div
          className="absolute w-24 h-24 animate-spin"
          style={{ animationDuration: "3s" }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_3px_rgba(139,92,246,0.8)]" />
        </div>

        {/* Orbiting dot 2 — slow, reverse */}
        <div
          className="absolute w-20 h-20 animate-spin"
          style={{ animationDuration: "5s", animationDirection: "reverse" }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-300 shadow-[0_0_6px_2px_rgba(165,180,252,0.8)]" />
        </div>

        {/* Core glowing orb */}
        <div
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center z-10 overflow-hidden"
          style={{ animation: "ai-orb-glow 2s ease-in-out infinite" }}
        >
          <Sparkles className="w-7 h-7 text-white" />
          {/* Scan line */}
          <div
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
            style={{ animation: "ai-scan 2s ease-in-out infinite" }}
          />
        </div>
      </div>

      {/* Sequential steps */}
      <div className="flex flex-col gap-2.5 w-full">
        {steps.map((step, i) =>
          i <= visibleSteps ? (
            <div
              key={i}
              className="flex items-center gap-3"
              style={{ animation: "ai-step-in 0.4s ease-out both" }}
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border border-violet-500/40 bg-violet-500/10">
                {i < visibleSteps ? (
                  <Check className="w-3 h-3 text-violet-400" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                )}
              </div>
              <span
                className={`text-sm transition-colors ${i < visibleSteps
                    ? "text-muted-foreground"
                    : "text-foreground font-medium"
                  }`}
              >
                {step}
              </span>
            </div>
          ) : null
        )}
      </div>

    </div>
  );
}
