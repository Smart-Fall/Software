"use client";

import { useEffect, useMemo, useState } from "react";

type MermaidDiagramProps = {
  chart: string;
};

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [themeStamp, setThemeStamp] = useState(0);
  const renderId = useMemo(
    () => `smartfall-mermaid-${Math.random().toString(36).slice(2, 10)}`,
    [],
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeStamp((value) => value + 1);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;

    async function renderMermaid() {
      try {
        const mermaid = (await import("mermaid")).default;
        const isDarkTheme = document.documentElement.classList.contains("dark");
        const themeVariables = isDarkTheme
          ? {
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
            }
          : {
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

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          themeVariables,
          fontFamily: "IBM Plex Sans, Segoe UI, sans-serif",
          flowchart: {
            curve: "basis",
            padding: 12,
            useMaxWidth: true,
            htmlLabels: true,
          },
        });

        const { svg: renderedSvg } = await mermaid.render(
          renderId,
          chart.trim(),
        );

        if (active) {
          setSvg(renderedSvg);
          setError("");
        }
      } catch (renderError) {
        if (active) {
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Unable to render Mermaid diagram.",
          );
          setSvg("");
        }
      }
    }

    void renderMermaid();

    return () => {
      active = false;
    };
  }, [chart, renderId, themeStamp]);

  if (error) {
    return (
      <div className="mermaid-shell mermaid-error" role="alert">
        <strong>Diagram render error</strong>
        <pre>{error}</pre>
      </div>
    );
  }

  return (
    <div
      className="mermaid-shell"
      aria-label="Diagram"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
