import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, Users, TrendingUp, Award } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* 헤더 */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <h1 className="text-orange-500 text-2xl font-bold">keeper mate</h1>
        <div className="flex items-center gap-4">
          <Link href="/advertiser/login">
            <Button variant="ghost" size="sm" className="text-xs">
              🏢 광고주
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">로그인</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-orange-500 hover:bg-orange-600">
              파트너 가입
            </Button>
          </Link>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          키퍼와 함께<br />
          <span className="text-orange-500">새로운 수익</span>을 만드세요
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          한화비전 키퍼 어필리에이트 프로그램에 참여하고
          보안 시장의 새로운 기회를 잡으세요
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8">
              지금 시작하기
            </Button>
          </Link>
          <Link href="/security">
            <Button size="lg" variant="outline" className="text-lg px-8">
              보안 상담 받기
            </Button>
          </Link>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-2xl font-bold text-center mb-12">
          왜 키퍼 메이트인가요?
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-orange-500" />
            </div>
            <h4 className="font-semibold mb-2">믿을 수 있는 브랜드</h4>
            <p className="text-gray-600 text-sm">
              한화비전의 프리미엄 보안 솔루션
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
            <h4 className="font-semibold mb-2">높은 수수료</h4>
            <p className="text-gray-600 text-sm">
              업계 최고 수준의 파트너 보상
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="font-semibold mb-2">전문 지원</h4>
            <p className="text-gray-600 text-sm">
              채널별 맞춤 마케팅 가이드 제공
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-purple-500" />
            </div>
            <h4 className="font-semibold mb-2">티어 혜택</h4>
            <p className="text-gray-600 text-sm">
              성과에 따른 단계별 보상 시스템
            </p>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="bg-orange-500 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h3>
          <p className="text-orange-100 mb-8 max-w-xl mx-auto">
            블로거, 유튜버, 인플루언서 누구나 키퍼 메이트가 될 수 있습니다
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-orange-600 text-lg px-8">
              무료로 가입하기
            </Button>
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 한화비전 키퍼. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/terms" className="hover:text-gray-700">이용약관</Link>
          <Link href="/privacy" className="hover:text-gray-700">개인정보처리방침</Link>
        </div>
      </footer>
    </div>
  )
}
// deploy trigger
