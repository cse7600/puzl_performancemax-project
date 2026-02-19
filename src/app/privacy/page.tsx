import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PrivacyPage() {
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
        <h2 className="text-3xl font-bold mb-8">개인정보처리방침</h2>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h3 className="text-xl font-semibold mb-3">1. 개인정보의 수집 및 이용 목적</h3>
            <p className="text-gray-600 leading-relaxed">
              Referio는 다음의 목적을 위하여 개인정보를 수집 및 이용합니다:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
              <li>파트너 가입 및 관리: 이름, 이메일, 연락처, 활동 채널 정보</li>
              <li>수수료 정산: 은행명, 계좌번호, 예금주명</li>
              <li>고객 추천 관리: 추천 고객 이름, 연락처</li>
              <li>서비스 이용 분석 및 개선</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">2. 수집하는 개인정보 항목</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>필수 항목:</strong> 이름, 이메일 주소</li>
              <li><strong>선택 항목:</strong> 전화번호, 활동 채널 링크, 은행 계좌 정보</li>
              <li><strong>자동 수집 항목:</strong> 접속 IP, 쿠키, 서비스 이용 기록</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">3. 개인정보의 보유 및 이용 기간</h3>
            <p className="text-gray-600 leading-relaxed">
              개인정보는 서비스 이용 기간 동안 보유하며, 탈퇴 시 지체 없이 파기합니다.
              단, 관계 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
              <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
              <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">4. 개인정보의 제3자 제공</h3>
            <p className="text-gray-600 leading-relaxed">
              서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 이용자의 동의가 있거나 법령에 의한 경우에는 예외로 합니다.
              파트너의 추천 활동 관련 정보는 해당 광고주에게 제공될 수 있습니다.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">5. 개인정보의 안전성 확보 조치</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>비밀번호 암호화 (bcrypt)</li>
              <li>SSL/TLS를 통한 데이터 전송 암호화</li>
              <li>접근 권한 관리 및 제한</li>
              <li>개인정보 마스킹 처리</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">6. 이용자의 권리</h3>
            <p className="text-gray-600 leading-relaxed">
              이용자는 언제든지 자신의 개인정보에 대해 열람, 수정, 삭제를 요청할 수 있으며,
              서비스 탈퇴를 통해 개인정보 처리를 중단할 수 있습니다.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">7. 쿠키 사용</h3>
            <p className="text-gray-600 leading-relaxed">
              서비스는 로그인 세션 관리를 위해 쿠키를 사용합니다.
              쿠키는 HttpOnly 속성으로 설정되어 JavaScript를 통한 접근이 차단됩니다.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">8. 개인정보 보호 책임자</h3>
            <p className="text-gray-600 leading-relaxed">
              개인정보 처리에 관한 업무를 담당하는 부서 및 책임자는 다음과 같습니다.
              개인정보 관련 문의사항은 아래 연락처로 문의해 주시기 바랍니다.
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
