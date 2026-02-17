export const blockNoteViewerStyles = `
  .blocknote-viewer-wrapper {
    --bn-colors-editor-background: transparent;
    --bn-colors-editor-text: #080f18;
    --bn-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
    width: 100%;
    max-width: 100%;
    background: transparent !important;
  }
  
  .blocknote-viewer-wrapper .bn-container,
  .blocknote-viewer-wrapper .bn-editor,
  .blocknote-viewer-wrapper .bn-block-group,
  .blocknote-viewer-wrapper .bn-block-outer,
  .blocknote-viewer-wrapper .bn-block,
  .blocknote-viewer-wrapper .bn-block-content,
  .blocknote-viewer-wrapper [class*="bn-"] {
    background: transparent !important;
    background-color: transparent !important;
  }
  
  .blocknote-viewer-wrapper .bn-editor {
    padding: 0;
    font-size: 16px;
    line-height: 1.75;
  }
  
  .blocknote-viewer-wrapper .bn-block-outer {
    margin: 0;
  }
  
  /* Hide the side menu in view mode */
  .blocknote-viewer-wrapper .bn-side-menu {
    display: none !important;
  }
  
  /* Hide drag handle */
  .blocknote-viewer-wrapper .bn-drag-handle {
    display: none !important;
  }
  
  /* Hide add block button */
  .blocknote-viewer-wrapper .bn-add-block-button {
    display: none !important;
  }
  
  .blocknote-viewer-wrapper .bn-block-content {
    font-size: 16px;
  }
  
  .blocknote-viewer-wrapper .bn-inline-content code {
    background-color: #eef2f7;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 14px;
    color: #c2410c;
  }

  .blocknote-viewer-wrapper [data-inline-content-type="inlineMath"],
  .blocknote-viewer-wrapper .math-inline {
    display: inline-flex;
    align-items: center;
    min-height: 1.2em;
    margin: 0 0.03rem;
    padding: 0 0.06rem;
    border-radius: 4px;
    border: 1px solid transparent;
    background: transparent;
    vertical-align: baseline;
  }

  .blocknote-viewer-wrapper [data-inline-content-type="inlineMath"] .katex,
  .blocknote-viewer-wrapper .math-inline .katex {
    font-size: 1em;
    color: #37352f;
    line-height: 1.25;
  }

  .blocknote-viewer-wrapper [data-content-type="mathBlock"] {
    margin: 0.95rem 0;
    text-align: center;
  }

  .blocknote-viewer-wrapper [data-content-type="mathBlock"] .bn-editor-math-block,
  .blocknote-viewer-wrapper [data-content-type="mathBlock"] .math-block {
    border: 0;
    border-radius: 0;
    background: transparent;
    padding: 0.15rem 0;
    text-align: center;
  }

  .blocknote-viewer-wrapper [data-content-type="mathBlock"] .bn-editor-math-block-affordance {
    display: none !important;
  }

  .blocknote-viewer-wrapper [data-content-type="mathBlock"] .bn-editor-math-block-render .katex-display,
  .blocknote-viewer-wrapper [data-content-type="mathBlock"] .math-block .katex-display {
    margin: 0;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .blocknote-viewer-wrapper .math-empty {
    color: #9b9a97;
    font-size: 0.9em;
    font-style: italic;
  }

  .blocknote-viewer-wrapper .math-fallback {
    color: #b42318;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 0.9em;
    white-space: pre-wrap;
  }
  
  .blocknote-viewer-wrapper pre,
  .blocknote-viewer-wrapper [data-content-type="codeBlock"] {
    background-color: #edf3fa !important;
    color: #1f2937;
    border: 1px solid #cfdae8;
    border-radius: 10px;
    padding: 16px 0;
    overflow-x: auto;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 14px;
    line-height: 1.15;
  }

  .blocknote-viewer-wrapper .bn-code-shell {
    position: relative;
  }

  .blocknote-viewer-wrapper .bn-code-shell pre {
    margin: 0;
  }

  .blocknote-viewer-wrapper .bn-code-shell pre code {
    display: block;
    counter-reset: code-line;
  }

  .blocknote-viewer-wrapper .bn-code-shell pre code .line {
    position: relative;
    display: block;
    min-height: 1.15em;
    padding: 0 1rem 0 3.25rem;
  }

  .blocknote-viewer-wrapper .bn-code-shell pre code .line::before {
    counter-increment: code-line;
    content: counter(code-line);
    position: absolute;
    left: 0;
    width: 2.5rem;
    padding-right: 0.75rem;
    text-align: right;
    color: #6f7d92;
    border-right: 1px solid #d3deeb;
    user-select: none;
  }

  .blocknote-viewer-wrapper .bn-code-copy-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 3;
    width: 32px;
    height: 32px;
    border: 1px solid #dbe3ee;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.92) !important;
    background-color: rgba(255, 255, 255, 0.92) !important;
    color: #5c6b80;
    cursor: pointer;
    display: inline-flex !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1);
    transition: all 0.15s ease;
  }

  .blocknote-viewer-wrapper .bn-code-copy-button:hover {
    border-color: #c6d4e3;
    background: #ffffff !important;
    background-color: #ffffff !important;
    color: #334155;
  }

  .blocknote-viewer-wrapper .bn-code-copy-button svg {
    width: 15px;
    height: 15px;
  }

  .blocknote-viewer-wrapper .bn-code-copy-button .icon-copied {
    display: none;
  }

  .blocknote-viewer-wrapper .bn-code-copy-button.is-copied {
    border-color: #b8deca;
    background: #edf9f1 !important;
    background-color: #edf9f1 !important;
    color: #18794e;
  }

  .blocknote-viewer-wrapper .bn-code-copy-button.is-copied .icon-copy {
    display: none;
  }

  .blocknote-viewer-wrapper .bn-code-copy-button.is-copied .icon-copied {
    display: inline-flex;
  }

  .blocknote-viewer-wrapper .bn-code-copy-button.is-error {
    border-color: #f2c8ce;
    background: #fff4f5 !important;
    background-color: #fff4f5 !important;
    color: #b42318;
  }

  .blocknote-viewer-wrapper .bn-block-content[data-content-type="codeBlock"] > div > select {
    display: none !important;
  }
  
  /* Prevent doubled heading spacing when wrapper and nested heading both get margins. */
  .blocknote-viewer-wrapper h1,
  .blocknote-viewer-wrapper h2,
  .blocknote-viewer-wrapper h3,
  .blocknote-viewer-wrapper h4 {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }

  /* Heading margins should be applied on block containers only, not inline content. */
  .blocknote-viewer-wrapper .bn-block-content[data-content-type="heading"][data-level="2"],
  .blocknote-viewer-wrapper .bn-block-content[data-content-type="heading"][data-level="3"] {
    margin: 0;
  }

  .blocknote-viewer-wrapper .bn-block-content[data-content-type="heading"][data-level="1"] {
    margin-top: 28px !important;
    margin-bottom: 8px !important;
  }

  .blocknote-viewer-wrapper [data-content-type="heading"][data-level="1"] {
    font-size: 2rem;
    font-weight: 700;
    margin-top: 28px !important;
    margin-bottom: 8px !important;
    line-height: 1.3;
    scroll-margin-top: 50px;
  }
  
  .blocknote-viewer-wrapper [data-content-type="heading"][data-level="2"] {
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 20px !important;
    margin-bottom: 8px !important;
    line-height: 1.35;
    scroll-margin-top: 50px;
  }
  
  .blocknote-viewer-wrapper [data-content-type="heading"][data-level="3"] {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 15px !important;
    margin-bottom: 8px !important;
    scroll-margin-top: 50px;
  }

  .blocknote-viewer-wrapper .bn-inline-content h1,
  .blocknote-viewer-wrapper .bn-inline-content h2,
  .blocknote-viewer-wrapper .bn-inline-content h3 {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }

  .blocknote-viewer-wrapper .bn-inline-content [data-content-type="heading"][data-level="1"],
  .blocknote-viewer-wrapper .bn-inline-content [data-content-type="heading"][data-level="2"],
  .blocknote-viewer-wrapper .bn-inline-content [data-content-type="heading"][data-level="3"] {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }
  
  .blocknote-viewer-wrapper blockquote,
  .blocknote-viewer-wrapper [data-content-type="quote"] {
    border-left: 4px solid #6096ba;
    padding-left: 16px;
    color: #6b7280;
    margin: 16px 0;
    font-style: italic;
  }
  
  .blocknote-viewer-wrapper ul, 
  .blocknote-viewer-wrapper ol {
    padding-left: 1.5rem;
  }
  
  .blocknote-viewer-wrapper [data-content-type="bulletListItem"],
  .blocknote-viewer-wrapper [data-content-type="numberedListItem"] {
    margin: 4px 0;
  }
  
  .blocknote-viewer-wrapper [data-content-type="checkListItem"] input[type="checkbox"] {
    margin-right: 8px;
    width: 16px;
    height: 16px;
    accent-color: #6096ba;
  }
  
  .blocknote-viewer-wrapper a {
    color: #6096ba;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  
  .blocknote-viewer-wrapper a:hover {
    color: #4a7a9e;
  }
  
  .blocknote-viewer-wrapper hr {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 12px 0;
  }
  
  .blocknote-viewer-wrapper img {
    max-width: 100%;
    margin: 16px 0;
  }
  
  .blocknote-viewer-wrapper table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }
  
  .blocknote-viewer-wrapper th,
  .blocknote-viewer-wrapper td {
    border: 1px solid #e5e5e5;
    padding: 10px 14px;
    text-align: left;
  }
  
  .blocknote-viewer-wrapper th {
    background-color: #f9fafb;
    font-weight: 600;
  }
  
  /* Preserve text colors from BlockNote */
  .blocknote-viewer-wrapper [data-text-color="red"] { color: #e03131; }
  .blocknote-viewer-wrapper [data-text-color="orange"] { color: #e8590c; }
  .blocknote-viewer-wrapper [data-text-color="yellow"] { color: #fcc419; }
  .blocknote-viewer-wrapper [data-text-color="green"] { color: #2f9e44; }
  .blocknote-viewer-wrapper [data-text-color="blue"] { color: #1971c2; }
  .blocknote-viewer-wrapper [data-text-color="purple"] { color: #9c36b5; }
  
  /* Remove background color distinctions - keep transparent */
  .blocknote-viewer-wrapper [data-background-color] {
    background-color: transparent !important;
  }
`
