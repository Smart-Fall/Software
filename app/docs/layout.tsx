import { RootProvider } from "fumadocs-ui/provider/next";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/docs/source";
import { MermaidCodeBlocks } from "@/components/docs/MermaidCodeBlocks";
import type { ReactNode } from "react";
import "./docs.css";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="docs-theme">
      <RootProvider>
        <MermaidCodeBlocks />
        <DocsLayout tree={source.pageTree} nav={{ title: "SmartFall Docs" }}>
          {children}
        </DocsLayout>
      </RootProvider>
    </div>
  );
}
