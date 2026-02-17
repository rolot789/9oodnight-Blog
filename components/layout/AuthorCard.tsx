export default function AuthorCard() {
  return (
    <div>
      <div className="my-12 border-t border-[#e5e5e5]"></div>
      <div className="flex items-center gap-4 rounded bg-white p-6 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#080f18] text-lg font-light text-white">
          A
        </div>
        <div>
          <p className="text-sm font-medium tracking-wide text-[#080f18]">Admin</p>
          <p className="text-xs text-[#8b8c89]">Developer & Mathematician</p>
        </div>
      </div>
    </div>
  )
}
