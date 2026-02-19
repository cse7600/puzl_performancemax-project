import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Clock, Tag } from 'lucide-react'
import { blogPosts, getBlogPost } from '@/lib/blog-data'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return {}

  return {
    title: `${post.title} | Referio 블로그`,
    description: post.metaDescription,
    keywords: `B2B 어필리에이트, ${post.tag}, 파트너 마케팅, CRM 연동, Referio`,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: 'article',
      publishedTime: post.date,
      locale: 'ko_KR',
    },
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function extractHeadings(content: string): { level: number; text: string; id: string }[] {
  const lines = content.split('\n')
  const headings: { level: number; text: string; id: string }[] = []

  for (const line of lines) {
    if (line.startsWith('### ')) {
      const text = line.slice(4)
      headings.push({ level: 3, text, id: slugify(text) })
    } else if (line.startsWith('## ')) {
      const text = line.slice(3)
      headings.push({ level: 2, text, id: slugify(text) })
    }
  }

  return headings
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    notFound()
  }

  const headings = extractHeadings(post.content)

  // Simple markdown-ish rendering
  const renderContent = (content: string) => {
    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let inTable = false
    let tableRows: string[][] = []
    let tableHeader: string[] = []

    const flushTable = () => {
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table-${elements.length}`} className="overflow-x-auto my-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  {tableHeader.map((cell, i) => (
                    <th key={i} className="text-left py-3 px-4 font-semibold text-slate-900">{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-slate-100">
                    {row.map((cell, ci) => (
                      <td key={ci} className="py-3 px-4 text-slate-600">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        tableRows = []
        tableHeader = []
      }
      inTable = false
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Table
      if (line.startsWith('|')) {
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
        if (!inTable) {
          inTable = true
          tableHeader = cells
        } else if (line.includes('---')) {
          continue
        } else {
          tableRows.push(cells)
        }
        continue
      } else if (inTable) {
        flushTable()
      }

      // Empty line
      if (!line.trim()) continue

      // H2
      if (line.startsWith('## ')) {
        const text = line.slice(3)
        elements.push(
          <h2 key={i} id={slugify(text)} className="text-2xl font-bold text-slate-900 mt-12 mb-4">{text}</h2>
        )
        continue
      }

      // H3
      if (line.startsWith('### ')) {
        const text = line.slice(4)
        elements.push(
          <h3 key={i} id={slugify(text)} className="text-xl font-semibold text-slate-900 mt-8 mb-3">{text}</h3>
        )
        continue
      }

      // Blockquote
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="border-l-4 border-blue-500 bg-blue-50 pl-6 py-4 my-6 text-slate-700 italic rounded-r-lg">
            {line.slice(2)}
          </blockquote>
        )
        continue
      }

      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        elements.push(
          <li key={i} className="text-slate-600 leading-relaxed ml-4 list-decimal">{renderInline(line.replace(/^\d+\.\s/, ''))}</li>
        )
        continue
      }

      // List item
      if (line.startsWith('- ')) {
        elements.push(
          <li key={i} className="text-slate-600 leading-relaxed ml-4 list-disc">{renderInline(line.slice(2))}</li>
        )
        continue
      }

      // Regular paragraph
      elements.push(
        <p key={i} className="text-slate-600 leading-relaxed mb-4">{renderInline(line)}</p>
      )
    }

    if (inTable) flushTable()
    return elements
  }

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-700">{part.slice(1, -1)}</code>
      }
      return part
    })
  }

  const currentIndex = blogPosts.findIndex(p => p.slug === slug)
  const nextPost = blogPosts[currentIndex + 1]
  const prevPost = blogPosts[currentIndex - 1]

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
          <div className="flex items-center gap-3">
            <Link href="/blog">
              <Button variant="ghost" size="sm">블로그</Button>
            </Link>
            <Link href="/advertiser/signup">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">무료로 시작하기</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 아티클 */}
      <article className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* 메타 */}
            <Link href="/blog" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-8">
              <ArrowLeft className="w-4 h-4" /> 블로그 목록
            </Link>

            {/* 썸네일 */}
            <div className={`bg-gradient-to-br ${post.thumbnailGradient} rounded-2xl aspect-[16/9] flex flex-col items-center justify-center mb-8 relative overflow-hidden`}>
              <span className="text-7xl mb-3">{post.thumbnailEmoji}</span>
              <span className="text-sm font-medium text-white/80 px-4 py-1.5 bg-white/20 rounded-full">{post.tag}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
              <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{post.tag}</span>
              <time>{new Date(post.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.readTime}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-8">
              {post.title}
            </h1>

            {/* 목차 (TOC) */}
            {headings.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-6 mb-10">
                <h2 className="font-semibold text-slate-900 mb-3 text-sm">목차</h2>
                <nav className="space-y-1.5">
                  {headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className={`block text-sm text-slate-600 hover:text-indigo-600 transition-colors ${
                        heading.level === 3 ? 'pl-4' : ''
                      }`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* 본문 */}
            <div className="prose-custom">
              {renderContent(post.content)}
            </div>

            {/* CTA 박스 */}
            <div className="mt-16 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold text-white mb-2">
                파트너 프로그램, 직접 시작해보세요
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                30일 무료 체험. 5분 안에 세팅. 리캐치·세일즈맵 즉시 연동.
              </p>
              <Link href="/advertiser/signup">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 gap-2">
                  무료로 시작하기 <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* 이전/다음 글 */}
            <div className="mt-12 grid grid-cols-2 gap-4">
              {prevPost ? (
                <Link href={`/blog/${prevPost.slug}`} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <span className="text-xs text-slate-400">이전 글</span>
                  <p className="text-sm font-medium text-slate-900 mt-1 line-clamp-2">{prevPost.title}</p>
                </Link>
              ) : <div />}
              {nextPost ? (
                <Link href={`/blog/${nextPost.slug}`} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors text-right">
                  <span className="text-xs text-slate-400">다음 글</span>
                  <p className="text-sm font-medium text-slate-900 mt-1 line-clamp-2">{nextPost.title}</p>
                </Link>
              ) : <div />}
            </div>
          </div>
        </div>
      </article>

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
