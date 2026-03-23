"use client";

import { useEffect } from "react";

function getMermaidThemeVariables(isDarkTheme: boolean) {
  if (isDarkTheme) {
    return {
      fontFamily: "IBM Plex Sans, Segoe UI, sans-serif",
      primaryColor: "#2a201d",
      primaryBorderColor: "#f08b4f",
      primaryTextColor: "#f6ede4",
      secondaryColor: "#312723",
      secondaryBorderColor: "#b88b71",
      secondaryTextColor: "#f6ede4",
      tertiaryColor: "#1f1a17",
      tertiaryBorderColor: "#8a6b57",
      lineColor: "#f08b4f",
      edgeLabelBackground: "#1f1a17",
    };
  }

  return {
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif",
    primaryColor: "#fff7ef",
    primaryBorderColor: "#bf4e1f",
    primaryTextColor: "#2f1d14",
    secondaryColor: "#ffeddc",
    secondaryBorderColor: "#da7a38",
    secondaryTextColor: "#2f1d14",
    tertiaryColor: "#fffaf4",
    tertiaryBorderColor: "#e7b58b",
    lineColor: "#b84b1f",
    edgeLabelBackground: "#fff7ef",
  };
}

export function MermaidCodeBlocks() {
  useEffect(() => {
    let disposed = false;
    let renderCounter = 0;
    let mermaidModulePromise: Promise<typeof import("mermaid")> | null = null;

    async function ensureMermaid() {
      if (!mermaidModulePromise) {
        mermaidModulePromise = import("mermaid");
      }

      const mermaid = (await mermaidModulePromise).default;
      const isDarkTheme = document.documentElement.classList.contains("dark");

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "base",
        themeVariables: getMermaidThemeVariables(isDarkTheme),
        fontFamily: "IBM Plex Sans, Segoe UI, sans-serif",
        flowchart: {
          curve: "basis",
          padding: 12,
          useMaxWidth: true,
          htmlLabels: true,
        },
      });

      return mermaid;
    }

    async function transformMermaidBlocks() {
      const host = document.querySelector(".docs-theme");
      if (!host) return;

      const blocks = host.querySelectorAll<HTMLElement>(
        "pre:has(code.language-mermaid):not([data-mermaid-processed])",
      );

      if (blocks.length === 0) return;

      const mermaid = await ensureMermaid();

      for (const block of blocks) {
        if (disposed) return;

        const code = block.querySelector<HTMLElement>("code.language-mermaid");
        const chart = code?.textContent?.trim();

        block.dataset.mermaidProcessed = "true";

        if (!chart) continue;

        const renderId = `smartfall-mermaid-block-${Date.now()}-${renderCounter++}`;
        const container = document.createElement("div");
        container.className = "mermaid-shell";

        try {
          const { svg } = await mermaid.render(renderId, chart);
          container.innerHTML = svg;
        } catch (error) {
          container.className = "mermaid-shell mermaid-error";
          const message =
            error instanceof Error
              ? error.message
              : "Unable to render Mermaid diagram.";

          container.innerHTML = `<strong>Diagram render error</strong><pre>${message}</pre>`;
        }

        block.replaceWith(container);
      }
    }

    void transformMermaidBlocks();

    const observer = new MutationObserver(() => {
      void transformMermaidBlocks();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
    });

    const classObserver = new MutationObserver(() => {
      void transformMermaidBlocks();
    });

    classObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      disposed = true;
      observer.disconnect();
      classObserver.disconnect();
    };
  }, []);

  return null;
}
