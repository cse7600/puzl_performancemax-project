import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between border-b">
        <Link href="/">
          <h1 className="text-indigo-600 text-2xl font-bold">Referio</h1>
        </Link>
        <Link href="/">
          <Button variant="ghost">홈으로</Button>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h2 className="text-3xl font-bold mb-8">이용약관</h2>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h3 className="text-xl font-semibold mb-3">제1조 (목적)</h3>
            <p className="text-gray-600 leading-relaxed">
              본 약관은 Referio(이하 &quot;서비스&quot;)가 제공하는 어필리에이트 파트너 프로그램 관련 서비스의 이용 조건 및 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">제2조 (정의)</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>&quot;파트너&quot;란 본 서비스에 가입하여 추천 활동을 수행하는 개인 또는 법인을 말합니다.</li>
              <li>&quot;광고주&quot;란 파트너 프로그램을 운영하는 기업 계정을 말합니다.</li>
              <li>&quot;추천 코드&quot;란 파트너에게 부여되는 고유 식별 코드를 말합니다.</li>
              <li>&quot;정산&quot;이란 파트너의 추천 성과에 따른 수수료 지급을 말합니다.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">제3조 (서비스의 내용)</h3>
            <p className="text-gray-600 leading-relaxed">
              서비스는 다음의 기능을 제공합니다:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
              <li>파트너 등록 및 추천 코드 발급</li>
              <li>추천 고객 관리 및 추적</li>
              <li>정산 관리 및 수수료 지급</li>
              <li>대시보드를 통한 성과 확인</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">제4조 (파트너 가입)</h3>
            <p className="text-gray-600 leading-relaxed">
              파트너 가입은 서비스에서 제공하는 가입 절차를 통해 이루어지며, 광고주의 승인 후 활동을 시작할 수 있습니다. 허위 정보를 입력한 경우 서비스 이용이 제한될 수 있습니다.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">제5조 (수수료 및 정산)</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>수수료는 광고주가 설정한 캠페인 기준에 따라 산정됩니다.</li>
              <li>중복 추천, 허위 추천 등 부정행위가 확인된 경우 수수료가 지급되지 않을 수 있습니다.</li>
              <li>정산은 광고주의 확인 후 진행되며, 정산 주기는 광고주에 따라 다를 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">제6조 (금지 행위)</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>허위 또는 과장된 정보로 추천하는 행위</li>
              <li>스팸, 불법적인 방법을 이용한 마케팅 행위</li>
              <li>타인의 추천 코드를 도용하는 행위</li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">제7조 (서비스 변경 및 중단)</h3>
            <p className="text-gray-600 leading-relaxed">
              서비스는 운영상, 기술적 필요에 따라 서비스의 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">제8조 (면책)</h3>
            <p className="text-gray-600 leading-relaxed">
              서비스는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.
            </p>
          </section>

          <div className="pt-6 border-t text-sm text-gray-400">
            <p>시행일: 2025년 1월 1일</p>
          </div>
        </div>
      </main>
    </div>
  )
}
