'use server'

import { serializeMDXContent } from '@/lib/mdx'

export async function getMDXSource(content: string) {
  try {
    const mdxSource = await serializeMDXContent(content)
    return { data: mdxSource, error: null }
  } catch (error: any) {
    console.error('MDX serialization error:', error)
    return { data: null, error: error.message }
  }
}
