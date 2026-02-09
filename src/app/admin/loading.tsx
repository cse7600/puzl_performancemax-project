export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 border-4 border-blue-200 rounded-full animate-pulse" />
          <div className="absolute top-0 left-0 w-10 h-10 border-4 border-blue-600 rounded-full animate-spin border-t-transparent" />
        </div>
        <p className="text-sm text-slate-500">어드민 로딩 중...</p>
      </div>
    </div>
  )
}
