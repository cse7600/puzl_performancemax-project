import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { blogPosts } from '@/lib/blog-data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'B2B 어필리에이트 마케팅 블로그 | Referio',
  description: 'B2B 세일즈팀을 위한 어필리에이트 마케팅 인사이트. 파트너 프로그램 운영 전략, CRM 연동 가이드, 실전 사례를 공유합니다.',
  keywords: 'B2B 어필리에이트, 파트너 마케팅, CRM 연동, 세일즈 전략, 리캐치, 세일즈맵',
  openGraph: {
    title: 'B2B 어필리에이트 마케팅 블로그 | Referio',
    description: 'B2B 세일즈팀을 위한 어필리에이트 마케팅 인사이트. 파트너 프로그램 운영 전략, CRM 연동 가이드.',
  },
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-slate-900 text-xl font-bold tracking-tight">Referio</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link href="/#features" className="hover:text-slate-900 transition-colors">기능</Link>
            <Link href="/#integrations" className="hover:text-slate-900 transition-colors">연동</Link>
            <Link href="/#pricing" className="hover:text-slate-900 transition-colors">요금제</Link>
            <Link href="/blog" className="text-slate-900 font-medium">블로그</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">로그인</Button>
            </Link>
            <Link href="/advertiser/signup">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">무료로 시작하기</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-6">
              <ArrowLeft className="w-4 h-4" /> 홈으로
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">블로그</h1>
            <p className="text-xl text-slate-500">
              B2B 어필리에이트 마케팅의 모든 것.<br />
              파트너 프로그램 전략부터 CRM 연동 실전 가이드까지.
            </p>
          </div>
        </div>
      </section>

      {/* 포스트 리스트 */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <article>
                  <div className={`bg-gradient-to-br ${post.thumbnailGradient} rounded-2xl aspect-[16/9] flex flex-col items-center justify-center mb-5 relative overflow-hidden`}>
                    <span className="text-5xl mb-2">{post.thumbnailEmoji}</span>
                    <span className="text-xs font-medium text-white/80 px-3 py-1 bg-white/20 rounded-full">{post.tag}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    <time>{new Date(post.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                  </div>
                  <h2 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors mb-2 leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-blue-600 mt-3 group-hover:gap-2 transition-all">
                    읽기 <ArrowRight className="w-4 h-4" />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            파트너 프로그램, 읽기만 하지 마세요
          </h2>
          <p className="text-slate-400 mb-6">
            30일 무료 체험으로 직접 시작해보세요. 5분이면 됩니다.
          </p>
          <Link href="/advertiser/signup">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 gap-2">
              무료로 시작하기 <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">&copy; 2026 Referio. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
