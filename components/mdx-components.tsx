import Link from 'next/link'
import Image from 'next/image'
import CodeBlock from './CodeBlock'

export const mdxComponents = {
  h1: (props: any) => (
    <h1 className="mb-4 mt-8 text-3xl font-bold tracking-tight text-[#080f18] scroll-mt-24" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="mb-3 mt-6 text-2xl font-bold tracking-tight text-[#080f18] scroll-mt-24" {...props} />
  ),
  h3: (props: any) => (
    <h3 className="mb-3 mt-5 text-xl font-bold tracking-tight text-[#080f18] scroll-mt-24" {...props} />
  ),
  h4: (props: any) => (
    <h4 className="mb-2 mt-4 text-lg font-bold tracking-tight text-[#080f18] scroll-mt-24" {...props} />
  ),
  p: (props: any) => (
    <p className="mb-4 leading-7 text-[#080f18]" {...props} />
  ),
  a: ({ href, children, ...props }: any) => {
    const className = "text-[#6096ba] underline hover:text-[#4a7a9a] transition-colors"
    if (href?.startsWith('/')) {
      return (
        <Link href={href} className={className} {...props}>
          {children}
        </Link>
      )
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...props}>
        {children}
      </a>
    )
  },
  ul: (props: any) => (
    <ul className="mb-4 list-inside list-disc space-y-2 pl-4 text-[#080f18]" {...props} />
  ),
  ol: (props: any) => (
    <ol className="mb-4 list-inside list-decimal space-y-2 pl-4 text-[#080f18]" {...props} />
  ),
  li: (props: any) => (
    <li className="ml-2" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-[#6096ba] bg-[#f5f5f5] py-2 pl-4 italic text-[#555]" {...props} />
  ),
  img: (props: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="my-4 h-auto w-full rounded-lg border border-[#e5e5e5]" alt={props.alt} {...props} />
  ),
  hr: (props: any) => <hr className="my-8 border-[#e5e5e5]" {...props} />,
  table: (props: any) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className="w-full border-collapse border border-[#e5e5e5]" {...props} />
    </div>
  ),
  tr: (props: any) => (
    <tr className="m-0 border-t border-[#e5e5e5] p-0 even:bg-[#fafbfc]" {...props} />
  ),
  th: (props: any) => (
    <th className="border border-[#e5e5e5] bg-[#f0f0f0] px-4 py-2 text-left font-bold text-[#080f18] [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
  ),
  td: (props: any) => (
    <td className="border border-[#e5e5e5] px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
  ),
  strong: (props: any) => <strong className="!font-bold text-inherit" {...props} />,
  em: (props: any) => <em className="italic" {...props} />,
  del: (props: any) => <del className="line-through" {...props} />,
  code: CodeBlock,
  Image,
}
