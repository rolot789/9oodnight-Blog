'use client'

import { MDXRemote } from 'next-mdx-remote'
import { mdxComponents } from './mdx-components'

interface MDXPreviewRendererProps {
  source: any // MDXRemoteSerializeResult
}

export default function MDXPreviewRenderer({ source }: MDXPreviewRendererProps) {
  return <MDXRemote {...source} components={mdxComponents} />
}
