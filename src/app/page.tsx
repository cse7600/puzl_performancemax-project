import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Zap,
  BarChart3,
  Link2,
  Users,
  Shield,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import PricingSection from '@/components/landing/PricingSection'
import EarningsSimulator from '@/components/landing/EarningsSimulator'

const INTEGRATIONS = [
  { name: 'Recatch', category: 'CRM' },
  { name: 'Salesmap', category: 'CRM' },
  { name: 'HubSpot', category: 'CRM' },
  { name: 'Salesforce', category: 'CRM' },
  { name: 'Slack', category: '커뮤니케이션' },
  { name: 'Google Sheets', category: '데이터' },
  { name: 'Zapier', category: '자동화' },
  { name: 'Webhook', category: 'API' },
]

export default function Home() {
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
            <a href="#features" className="hover:text-slate-900 transition-colors">기능</a>
            <a href="#integrations" className="hover:text-slate-900 transition-colors">연동</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">요금제</a>
            <Link href="/blog" className="hover:text-slate-900 transition-colors">블로그</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">로그인</Button>
            </Link>
            <Link href="/advertiser/signup">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                무료로 시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.08),transparent)]" />
        <div className="container mx-auto px-4 pt-24 pb-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600 mb-8">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              크리에이터와 함께하는 B2B 어필리에이트 플랫폼
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
              파트너 추천이 만드는<br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                B2B 파이프라인
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              B2B 무형 서비스는 퍼포먼스 마케팅으로 설득하기 어렵습니다.<br />
              블로거, 유튜버, 에이전시 파트너가 만드는 신뢰 기반 추천으로<br />
              리드 유입부터 CRM 연동, 자동 정산까지 한 번에.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/advertiser/signup">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 h-14 gap-2">
                  무료로 시작하기 <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                  파트너로 참여하기
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              Free 요금제로 바로 시작 &middot; 신용카드 불필요 &middot; 5분 안에 세팅 완료
            </p>
          </div>
        </div>
      </section>

      {/* 문제 제기 */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              B2B 파트너 영업,<br />아직 스프레드시트로 관리하고 있나요?
            </h2>
            <p className="text-lg text-slate-500">
              리드가 어디서 왔는지 모르고, 파트너 성과는 추적이 안 되고, 정산은 매번 수작업.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                problem: '리드 출처 불명',
                desc: '파트너가 보낸 리드인지, 자체 유입인지 구분이 안 됩니다.',
                icon: '😵',
              },
              {
                problem: '수작업 정산',
                desc: '매달 엑셀로 수수료를 계산하고, 세금계산서를 발행합니다.',
                icon: '😫',
              },
              {
                problem: 'CRM 단절',
                desc: '파트너 리드가 기존 세일즈 파이프라인에 연결되지 않습니다.',
                icon: '😤',
              },
              {
                problem: '퍼포먼스 마케팅 한계',
                desc: 'B2B 무형 서비스는 타겟팅이 어렵고 설득 주기가 길어 광고 효율이 낮습니다.',
                icon: '📉',
              },
            ].map((item) => (
              <div key={item.problem} className="bg-white rounded-2xl p-8 border border-slate-200">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.problem}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 기능 */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              추천 링크 하나로<br />B2B 파트너 프로그램을 완성합니다
            </h2>
            <p className="text-lg text-slate-500">
              복잡한 어필리에이트 운영을 자동화하고, 기존 세일즈 스택과 연결하세요.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Link2,
                title: '추천 링크 자동 생성',
                desc: '파트너별 고유 추천 코드와 랜딩 페이지 URL을 자동으로 발급합니다. 파트너는 링크만 공유하면 됩니다.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: Zap,
                title: 'CRM 자동 연동',
                desc: '유입된 리드를 리캐치, 세일즈맵, 허브스팟에 자동으로 전달합니다. 기존 파이프라인이 끊기지 않습니다.',
                color: 'bg-violet-50 text-violet-600',
              },
              {
                icon: BarChart3,
                title: '실시간 성과 대시보드',
                desc: '파트너별 리드 수, 전환율, 매출 기여도를 실시간으로 추적합니다. 데이터 기반 파트너 관리.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: Users,
                title: '크리에이터 & 에이전시 파트너 관리',
                desc: '블로거, 유튜버, 에이전시 등 다양한 파트너 유형을 맞춤 관리합니다. 모집부터 승인까지 한 곳에서.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: Shield,
                title: '자동 정산 관리',
                desc: '리드 → 계약 → 수수료 산정 → 정산까지 전 과정을 자동화합니다. 수작업 엑셀 정산은 끝.',
                color: 'bg-rose-50 text-rose-600',
              },
              {
                icon: RefreshCw,
                title: '티어 & 인센티브',
                desc: '성과에 따라 파트너 등급을 자동 조정하고, 차등 수수료를 적용합니다. 우수 파트너에게 동기를 부여하세요.',
                color: 'bg-cyan-50 text-cyan-600',
              },
            ].map((feature) => (
              <div key={feature.title} className="group p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-5`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 히어로 파트너 만들기 */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(99,102,241,0.1),transparent)]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm text-indigo-300 mb-6">
              <span className="text-xs">PREMIUM SERVICE</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              어필리에이트 프로그램의 첫 히어로 파트너,<br />
              Referio가 만들어 드립니다
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              프로그램을 개설했지만 파트너가 없으신가요?<br />
              Referio가 크리에이터를 섭외하고, 콘텐츠를 제작해 바이럴을 만들어드립니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            {[
              {
                step: '01',
                title: '프로그램 분석',
                desc: '제품 특성, 타겟 고객, 경쟁 환경을 분석하고 최적의 파트너 전략을 설계합니다.',
                icon: '🔍',
              },
              {
                step: '02',
                title: '크리에이터 매칭',
                desc: '업계 영향력 있는 블로거, 유튜버를 직접 섭외하고 파트너로 온보딩합니다.',
                icon: '🤝',
              },
              {
                step: '03',
                title: '콘텐츠 제작 & 론칭',
                desc: '리뷰, 비교 분석, 사용기 등 전환에 최적화된 콘텐츠를 제작하고 론칭합니다.',
                icon: '🚀',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="text-sm font-bold text-indigo-400 mb-2">STEP {item.step}</div>
                <h3 className="font-semibold text-white text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="mailto:sales@referio.kr">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 h-14 gap-2">
                히어로 파트너 문의하기 <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 브랜디드 콘텐츠 협업 */}
      <section className="py-24 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(16,185,129,0.08),transparent)]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-sm text-emerald-700 mb-6">
              <span className="font-bold">NEW</span> 브랜디드 콘텐츠
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              우수 파트너와의<br />브랜디드 콘텐츠 협업
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              실적이 검증된 파트너에게 직접 콘텐츠 제작을 의뢰하세요.<br />
              Referio가 안전하게 중개합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            {[
              {
                step: '01',
                title: '우수 파트너 발견',
                desc: '성과 대시보드에서 전환율 높은 파트너를 확인하고, 협업 제안을 보내세요.',
                icon: '🔍',
                color: 'text-emerald-600',
              },
              {
                step: '02',
                title: '협업 제안 & 브리프 전달',
                desc: '콘텐츠 유형, 예산, 마감일을 설정하고 상세한 브리프를 전달합니다.',
                icon: '📋',
                color: 'text-teal-600',
              },
              {
                step: '03',
                title: '콘텐츠 제작 & 정산',
                desc: '파트너가 콘텐츠를 제작하고, 검수 후 자동으로 정산이 완료됩니다.',
                icon: '💰',
                color: 'text-cyan-600',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-sm">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className={`text-sm font-bold ${item.color} mb-2`}>STEP {item.step}</div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500 mb-2">
              플랫폼 수수료 10% &middot; 안전 에스크로 결제 &middot; Growth 플랜 이상
            </p>
          </div>
        </div>
      </section>

      {/* 연동 */}
      <section id="integrations" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              이미 쓰고 있는 툴과<br />바로 연결됩니다
            </h2>
            <p className="text-lg text-slate-500">
              CRM, 메신저, 자동화 도구. 기존 세일즈 스택을 바꿀 필요 없습니다.<br />
              Referio가 파트너 채널만 추가합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {INTEGRATIONS.map((item) => (
              <div
                key={item.name}
                className="bg-white rounded-xl p-6 border border-slate-200 text-center hover:border-slate-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-slate-200 transition-colors">
                  <span className="font-bold text-slate-700 text-xs">{item.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                <p className="text-xs text-slate-400 mt-1">{item.category}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-slate-500">
              Webhook과 Zapier를 통해 <span className="font-medium text-slate-700">어떤 도구든</span> 연결할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              5분 만에 파트너 프로그램을 런칭하세요
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {[
              {
                step: '01',
                title: '프로그램 개설',
                desc: '회사 정보와 수수료 정책을 설정하면 프로그램이 마켓플레이스에 공개됩니다.',
              },
              {
                step: '02',
                title: '파트너 모집 & 승인',
                desc: '파트너가 신청하면 검토 후 승인합니다. 승인 즉시 추천 링크가 발급됩니다.',
              },
              {
                step: '03',
                title: '리드 유입 & 자동 정산',
                desc: '추천 링크로 유입된 리드가 CRM에 전달되고, 계약 시 수수료가 자동 산정됩니다.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-6xl font-bold text-slate-100 mb-4">{item.step}</div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 요금제 */}
      <PricingSection />

      {/* Referio 추천 프로그램 */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,255,255,0.1),transparent)]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm text-white mb-6">
              <span className="font-bold">SPECIAL</span> 추천 프로그램
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Referio를 추천하고<br />매달 수익을 받으세요
            </h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto">
              Referio를 추천하고, 추천인이 유료 플랜을 시작하면<br />
              플랜 요금의 <span className="font-bold text-white">20%</span>를 매달 받으세요.
            </p>
          </div>

          <EarningsSimulator />

          <div className="text-center mt-10">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-slate-100 text-lg px-8 h-14 gap-2">
                추천 프로그램 참여하기 <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 블로그 미리보기 */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">블로그</h2>
              <p className="text-slate-500 mt-1">B2B 어필리에이트 마케팅 인사이트</p>
            </div>
            <Link href="/blog" className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1">
              전체 보기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                slug: 'what-is-b2b-affiliate',
                title: 'B2B 어필리에이트 마케팅이란? 2026 완벽 가이드',
                excerpt: '인플루언서 마케팅과 다른, B2B 전용 파트너 프로그램의 모든 것.',
                tag: '가이드',
                gradient: 'from-blue-500 to-indigo-600',
                emoji: '📚',
              },
              {
                slug: 'crm-integration-guide',
                title: '리캐치·세일즈맵과 어필리에이트를 연동하는 방법',
                excerpt: 'CRM에 파트너 리드를 자동으로 보내는 3가지 연동 패턴.',
                tag: '연동',
                gradient: 'from-emerald-500 to-teal-600',
                emoji: '🔗',
              },
              {
                slug: 'why-b2b-sales-need-partners',
                title: 'B2B 세일즈팀이 파트너 프로그램을 운영해야 하는 5가지 이유',
                excerpt: '아웃바운드만으로는 부족합니다. 파트너 채널이 답인 이유.',
                tag: '전략',
                gradient: 'from-violet-500 to-purple-600',
                emoji: '🎯',
              },
            ].map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <div className={`bg-gradient-to-br ${post.gradient} rounded-2xl aspect-[16/9] flex flex-col items-center justify-center mb-4 relative overflow-hidden`}>
                  <span className="text-5xl mb-2">{post.emoji}</span>
                  <span className="text-xs font-medium text-white/80 px-3 py-1 bg-white/20 rounded-full">{post.tag}</span>
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-500">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            파트너가 만드는 매출,<br />지금 시작하세요
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            5분 안에 프로그램을 개설하고, 첫 파트너를 초대하세요.<br />
            Free 요금제로 바로 시작, 신용카드 불필요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/advertiser/signup">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 h-14 gap-2">
                무료로 시작하기 <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="mailto:sales@referio.kr">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 h-14">
                영업팀에 문의하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-slate-950 text-slate-400 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">R</span>
                </div>
                <span className="text-white font-bold">Referio</span>
              </div>
              <p className="text-sm leading-relaxed">
                B2B 기업을 위한 어필리에이트 플랫폼.<br />
                파트너 프로그램의 모든 것을 자동화합니다.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">제품</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">기능</a></li>
                <li><a href="#integrations" className="hover:text-white transition-colors">연동</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">요금제</a></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">블로그</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">시작하기</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/advertiser/signup" className="hover:text-white transition-colors">광고주 가입</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">파트너 가입</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">파트너 로그인</Link></li>
                <li><Link href="/advertiser/login" className="hover:text-white transition-colors">광고주 로그인</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">문의</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:sales@referio.kr" className="hover:text-white transition-colors">sales@referio.kr</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">&copy; 2026 Referio. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
