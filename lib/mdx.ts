import { compileMDX } from 'next-mdx-remote/rsc'
import { serialize } from 'next-mdx-remote/serialize'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// Shared MDX options
const mdxOptions = {
  remarkPlugins: [remarkGfm, remarkMath],
  rehypePlugins: [
    rehypeKatex,
    [
      rehypePrettyCode,
      {
        theme: 'github-dark',
        keepBackground: true,
        onVisitLine(node: any) {
          // Prevent lines from collapsing in `display: grid` mode, and allow empty
          // lines to be copy/pasted
          if (node.children.length === 0) {
            node.children = [{ type: 'text', value: ' ' }]
          }
        },
      },
    ],
  ],
}

// For Server Components (RSC) - e.g. Blog Post View
export async function compileMDXContent(source: string, components: any = {}) {
  return compileMDX({
    source,
    options: {
      mdxOptions: mdxOptions as any,
      parseFrontmatter: true,
    },
    components,
  })
}

// For Client Components (Preview) - via Server Action
export async function serializeMDXContent(source: string) {
  return serialize(source, {
    mdxOptions: mdxOptions as any,
    parseFrontmatter: true,
  })
}
