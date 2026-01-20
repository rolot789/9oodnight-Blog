export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-12">
          <h1 className="mb-8 text-center text-2xl font-light tracking-wide text-[#080f18]">SEARCH</h1>
          <div className="relative mx-auto max-w-2xl">
            <div className="h-14 w-full animate-pulse rounded-full border border-[#e5e5e5] bg-gray-100" />
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <span className="text-sm text-[#8b8c89]">Loading...</span>
        </div>
      </main>
    </div>
  )
}
