declare module "katex/contrib/auto-render" {
  interface Delimiter {
    left: string
    right: string
    display: boolean
  }

  interface AutoRenderOptions {
    delimiters?: Delimiter[]
    ignoredTags?: string[]
    throwOnError?: boolean
    strict?: "ignore" | "warn" | "error" | ((errorCode: string, errorMsg: string) => "ignore" | "warn" | "error")
    errorColor?: string
  }

  export default function renderMathInElement(
    element: HTMLElement,
    options?: AutoRenderOptions
  ): void
}
