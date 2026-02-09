export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-orange-200 rounded-full animate-pulse" />
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-orange-500 rounded-full animate-spin border-t-transparent" />
        </div>
        <p className="text-sm text-slate-500 animate-pulse">로딩 중...</p>
      </div>
    </div>
  )
}
