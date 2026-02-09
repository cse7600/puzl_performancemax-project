// 비밀번호를 bcrypt로 해시하는 스크립트
// 사용법: node scripts/hash-password.js password123

const bcrypt = require('bcryptjs')

const password = process.argv[2]

if (!password) {
  console.error('Usage: node scripts/hash-password.js <password>')
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 10)
console.log('\nPassword:', password)
console.log('Hash:', hash)
console.log('\nSQL INSERT example:')
console.log(`
INSERT INTO advertisers (advertiser_id, company_name, user_id, password_hash, status, primary_color)
VALUES ('your_company', 'Your Company Name', 'admin', '${hash}', 'active', '#f97316');
`)
