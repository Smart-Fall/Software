import { source } from "@/lib/docs/source";
import { docsMdxComponents } from "@/components/docs/mdx-components";
import { DocsPage, DocsBody } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ComponentType } from "react";
import type { TOCItemType } from "fumadocs-core/toc";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

type RuntimeDocPageData = {
  title?: string;
  description?: string;
  toc?: TOCItemType[];
  body: ComponentType<{ components?: Record<string, unknown> }>;
};

export async function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: page.slugs,
  }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const data = page.data as RuntimeDocPageData;

  return {
    title: data.title,
    description: data.description,
  };
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const data = page.data as RuntimeDocPageData;

  const MDXContent = data.body;

  return (
    <DocsPage toc={data.toc}>
      <DocsBody>
        <MDXContent components={docsMdxComponents} />
      </DocsBody>
    </DocsPage>
  );
}
