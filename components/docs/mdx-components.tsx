import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { MermaidDiagram } from "@/components/docs/MermaidDiagram";

type CodeProps = {
  className?: string;
  children?: ReactNode;
};

type PreProps = ComponentPropsWithoutRef<"pre">;

function extractMermaidChart(children: ReactNode): string | null {
  if (Children.count(children) !== 1) {
    return null;
  }

  const onlyChild = Children.only(children);

  if (!isValidElement<CodeProps>(onlyChild)) {
    return null;
  }

  const classes = (onlyChild.props.className ?? "")
    .split(/\s+/)
    .filter(Boolean);

  if (!classes.includes("language-mermaid")) {
    return null;
  }

  const value = onlyChild.props.children;

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.join("");
  }

  return null;
}

function DocsPre(props: PreProps) {
  const chart = extractMermaidChart(props.children);

  if (chart) {
    return <MermaidDiagram chart={chart} />;
  }

  return <pre {...props} />;
}

export const docsMdxComponents = {
  Mermaid: MermaidDiagram,
  pre: DocsPre,
};
