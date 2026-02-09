export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 border-4 border-orange-200 rounded-full animate-pulse" />
          <div className="absolute top-0 left-0 w-10 h-10 border-4 border-orange-500 rounded-full animate-spin border-t-transparent" />
        </div>
        <p className="text-sm text-slate-500">대시보드 로딩 중...</p>
      </div>
    </div>
  )
}
