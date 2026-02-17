const MATH_POPOVER_MIN_WIDTH = 264

export type MathPopoverOptions = {
  anchor: HTMLElement
  initialLatex: string
  ariaLabel: string
  allowMultiline?: boolean
  onSave: (latex: string) => void
}

export function createMathPopover({
  anchor,
  initialLatex,
  ariaLabel,
  allowMultiline = false,
  onSave,
}: MathPopoverOptions) {
  const popover = document.createElement("div")
  popover.className = "bn-editor-math-popover"
  popover.contentEditable = "false"
  popover.style.position = "fixed"
  popover.style.minWidth = `${MATH_POPOVER_MIN_WIDTH}px`
  popover.style.zIndex = "120"
  popover.hidden = true

  const row = document.createElement("div")
  row.className = "bn-editor-math-popover-row"

  const input = allowMultiline
    ? document.createElement("textarea")
    : document.createElement("input")
  input.className = "bn-editor-math-popover-input"
  input.setAttribute("aria-label", ariaLabel)
  input.placeholder = String.raw`e.g. \int_C \vec{F} \cdot d\vec{s}`
  input.value = initialLatex
  if (input instanceof HTMLInputElement) {
    input.type = "text"
  } else {
    input.rows = 1
    input.wrap = "off"
  }

  const saveButton = document.createElement("button")
  saveButton.type = "button"
  saveButton.className = "bn-editor-math-popover-save"
  saveButton.textContent = "완료"

  row.append(input, saveButton)
  popover.append(row)
  document.body.append(popover)

  let draftLatex = initialLatex
  let isOpen = false

  const positionPopover = () => {
    const rect = anchor.getBoundingClientRect()
    const maxWidth = Math.min(540, window.innerWidth - 24)
    const left = Math.min(
      Math.max(12, rect.left),
      Math.max(12, window.innerWidth - maxWidth - 12),
    )
    const preferredTop = rect.bottom + 10
    const top = Math.max(12, Math.min(preferredTop, window.innerHeight - 52))

    popover.style.width = `${maxWidth}px`
    popover.style.left = `${left}px`
    popover.style.top = `${top}px`
  }

  const closePopover = () => {
    if (!isOpen) return
    isOpen = false
    popover.hidden = true

    document.removeEventListener("mousedown", handleOutsideMouseDown, true)
    window.removeEventListener("resize", positionPopover)
    window.removeEventListener("scroll", positionPopover, true)
  }

  const handleOutsideMouseDown = (event: MouseEvent) => {
    const target = event.target as Node | null
    if (!target) return
    if (popover.contains(target) || anchor.contains(target)) return
    closePopover()
  }

  const save = () => {
    onSave(draftLatex)
    closePopover()
    anchor.focus()
  }

  const openPopover = (latex: string) => {
    draftLatex = latex
    input.value = latex

    if (!isOpen) {
      isOpen = true
      popover.hidden = false

      document.addEventListener("mousedown", handleOutsideMouseDown, true)
      window.addEventListener("resize", positionPopover)
      window.addEventListener("scroll", positionPopover, true)
    }

    positionPopover()
    requestAnimationFrame(() => {
      input.focus()
      const cursor = input.value.length
      input.selectionStart = cursor
      input.selectionEnd = cursor
    })
  }

  popover.addEventListener("mousedown", (event) => {
    event.stopPropagation()
  })

  input.addEventListener("input", () => {
    draftLatex = input.value
  })

  input.addEventListener("keydown", (event) => {
    const keyboardEvent = event as KeyboardEvent
    if (keyboardEvent.key === "Enter" && !(allowMultiline && keyboardEvent.shiftKey)) {
      keyboardEvent.preventDefault()
      save()
      return
    }

    if (keyboardEvent.key === "Escape") {
      keyboardEvent.preventDefault()
      keyboardEvent.stopPropagation()
      closePopover()
      anchor.focus()
    }
  })

  saveButton.addEventListener("click", save)

  return {
    open: openPopover,
    destroy: () => {
      closePopover()
      popover.remove()
    },
  }
}

export { MATH_POPOVER_MIN_WIDTH }
