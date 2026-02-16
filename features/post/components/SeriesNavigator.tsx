import Link from "next/link"
import type { SeriesContext } from "@/lib/types"
import { toPostPath } from "@/lib/shared/slug"

interface SeriesNavigatorProps {
  series: SeriesContext
}

export default function SeriesNavigator({ series }: SeriesNavigatorProps) {
  return (
    <section className="mt-10 rounded border border-[#e5e5e5] bg-white p-6">
      <div className="mb-2 text-[11px] tracking-widest text-[#8b8c89]">SERIES</div>
      <h3 className="text-base font-medium text-[#080f18]">{series.title}</h3>
      <p className="mt-1 text-xs tracking-wider text-[#8b8c89]">
        Part {series.index} of {series.total}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {series.previous ? (
          <Link
            href={toPostPath(series.previous.slug || series.previous.postId)}
            className="rounded border border-[#e5e5e5] bg-[#fafbfc] px-4 py-3 text-sm text-[#080f18] transition-colors hover:border-[#080f18]"
          >
            <span className="block text-[10px] tracking-wider text-[#8b8c89]">PREVIOUS</span>
            <span className="line-clamp-2">{series.previous.title}</span>
          </Link>
        ) : (
          <div className="rounded border border-[#e5e5e5] bg-[#fafbfc] px-4 py-3 text-sm text-[#c0c0c0]">
            <span className="block text-[10px] tracking-wider">PREVIOUS</span>
            <span>첫 글입니다.</span>
          </div>
        )}

        {series.next ? (
          <Link
            href={toPostPath(series.next.slug || series.next.postId)}
            className="rounded border border-[#e5e5e5] bg-[#fafbfc] px-4 py-3 text-sm text-[#080f18] transition-colors hover:border-[#080f18]"
          >
            <span className="block text-[10px] tracking-wider text-[#8b8c89]">NEXT</span>
            <span className="line-clamp-2">{series.next.title}</span>
          </Link>
        ) : (
          <div className="rounded border border-[#e5e5e5] bg-[#fafbfc] px-4 py-3 text-sm text-[#c0c0c0]">
            <span className="block text-[10px] tracking-wider">NEXT</span>
            <span>마지막 글입니다.</span>
          </div>
        )}
      </div>
    </section>
  )
}
