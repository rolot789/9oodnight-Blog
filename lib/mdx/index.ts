import { compileMDX } from 'next-mdx-remote/rsc'
import { serialize } from 'next-mdx-remote/serialize'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// Sanitize content to handle common MDX issues
function sanitizeForMDX(source: string): string {
  let sanitized = source

  // Normalize line breaks for paragraphs
  sanitized = sanitized.replace(/\n\n+/g, '\n\n')
  
  // Handle checkbox list items from BlockNote
  sanitized = sanitized.replace(/^\[\s?\]\s/gm, '- [ ] ')
  sanitized = sanitized.replace(/^\[x\]\s/gm, '- [x] ')

  // Remove HTML comments (<!-- -->)
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '')

  // Fix self-closing tags without proper spacing (e.g., <br/> -> <br />)
  sanitized = sanitized.replace(/<(br|hr|img|input|meta|link)([^>]*?)\/>/gi, '<$1$2 />')

  // Convert <style> with string content to valid JSX (remove style tags entirely for safety)
  sanitized = sanitized.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  // Fix unclosed void elements
  sanitized = sanitized.replace(/<(br|hr)(\s[^>]*)?(?<!\/)>/gi, '<$1$2 />')

  return sanitized
}

// Shared MDX options
const mdxOptions = {
  remarkPlugins: [remarkGfm, remarkMath],
  rehypePlugins: [
    rehypeSlug,
    rehypeKatex,
  ],
}

// For Server Components (RSC) - e.g. Blog Post View
export async function compileMDXContent(source: string, components: any = {}) {
  const sanitizedSource = sanitizeForMDX(source)
  
  try {
    return await compileMDX({
      source: sanitizedSource,
      options: {
        mdxOptions: mdxOptions as any,
        parseFrontmatter: true,
      },
      components,
    })
  } catch (error) {
    console.error('MDX compilation error:', error)
    // Return a fallback content on error
    return await compileMDX({
      source: `# Content Error\n\nThere was an error rendering this content. The markdown may contain invalid syntax.`,
      options: {
        mdxOptions: mdxOptions as any,
        parseFrontmatter: true,
      },
      components,
    })
  }
}

// For Client Components (Preview) - via Server Action
export async function serializeMDXContent(source: string) {
  const sanitizedSource = sanitizeForMDX(source)
  
  try {
    return await serialize(sanitizedSource, {
      mdxOptions: mdxOptions as any,
      parseFrontmatter: true,
    })
  } catch (error) {
    console.error('MDX serialization error:', error)
    return await serialize(`# Content Error\n\nThere was an error rendering this content.`, {
      mdxOptions: mdxOptions as any,
      parseFrontmatter: true,
    })
  }
}
