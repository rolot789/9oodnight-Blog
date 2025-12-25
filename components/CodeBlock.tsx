"use client"

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import okaidia from "react-syntax-highlighter/dist/esm/styles/prism/okaidia"

export default function CodeBlock({ className, children, ...props }: any) {
  const match = /language-(\w+)/.exec(className || "")
  const isInline = !match

  if (isInline) {
    return (
      <code className={`rounded bg-[#f0f0f0] px-1 py-0.5 font-mono text-sm text-[#c41d7f] ${className || ""}`} {...props}>
        {children}
      </code>
    )
  }

  return (
    <SyntaxHighlighter
      style={okaidia}
      language={match[1]}
      PreTag="div"
      showLineNumbers
      lineNumberStyle={{
        minWidth: '2.5em',
        paddingRight: '1em',
        color: '#636d83',
        textAlign: 'right',
        userSelect: 'none'
      }}
      customStyle={{ 
        margin: '1.5rem 0', 
        fontSize: "0.875rem", 
        borderRadius: "0.5rem",
        padding: '1rem',
        backgroundColor: '#000000'
      }}
      codeTagProps={{
        style: {
          display: 'block',
          padding: 0,
          backgroundColor: 'transparent'
        }
      }}
      {...props}
    >
      {String(children).trim()}
    </SyntaxHighlighter>
  )
}
