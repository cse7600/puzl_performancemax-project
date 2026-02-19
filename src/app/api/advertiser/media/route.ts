import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdvertiserSession } from '@/lib/auth'

// GET: 미디어 목록
export async function GET() {
  try {
    const session = await getAdvertiserSession()
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: media } = await supabase
      .from('program_media')
      .select('*')
      .eq('advertiser_id', session.advertiserUuid)
      .order('sort_order')
      .order('created_at', { ascending: false })

    return NextResponse.json({ media: media || [] })
  } catch (error) {
    console.error('Media GET error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST: 파일 업로드 또는 유튜브 링크 등록
export async function POST(request: NextRequest) {
  try {
    const session = await getAdvertiserSession()
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const supabase = await createClient()
    const contentType = request.headers.get('content-type') || ''

    // JSON 요청: 유튜브 링크 등록
    if (contentType.includes('application/json')) {
      const { url, name, description } = await request.json()

      if (!url) {
        return NextResponse.json({ error: 'URL이 필요합니다' }, { status: 400 })
      }

      // 유튜브 URL 검증
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)/
      if (!youtubeRegex.test(url)) {
        return NextResponse.json({ error: '올바른 유튜브 URL을 입력해주세요' }, { status: 400 })
      }

      const { data: media, error: insertError } = await supabase
        .from('program_media')
        .insert({
          advertiser_id: session.advertiserUuid,
          type: 'youtube',
          url,
          name: name || '유튜브 영상',
          description: description || null,
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: '등록에 실패했습니다' }, { status: 500 })
      }

      return NextResponse.json({ media }, { status: 201 })
    }

    // FormData: 파일 업로드
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mediaName = formData.get('name') as string | null
    const mediaDescription = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다' }, { status: 400 })
    }

    // 파일 크기 제한: 이미지 10MB, 영상 50MB
    const isVideo = file.type.startsWith('video/')
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    const maxLabel = isVideo ? '50MB' : '10MB'

    if (file.size > maxSize) {
      return NextResponse.json({ error: `파일 크기가 ${maxLabel}를 초과합니다` }, { status: 400 })
    }

    // 파일 확장자
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const filePath = `${session.advertiserUuid}/${Date.now()}.${ext}`

    // Supabase Storage 업로드
    const { error: uploadError } = await supabase.storage
      .from('program-media')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: '파일 업로드에 실패했습니다' }, { status: 500 })
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('program-media')
      .getPublicUrl(filePath)

    // DB에 기록
    const { data: media, error: insertError } = await supabase
      .from('program_media')
      .insert({
        advertiser_id: session.advertiserUuid,
        type: isVideo ? 'video' : 'image',
        url: urlData.publicUrl,
        name: mediaName || file.name,
        description: mediaDescription || null,
        size_bytes: file.size,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Media record error:', insertError)
    }

    return NextResponse.json({ media }, { status: 201 })
  } catch (error) {
    console.error('Media POST error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// DELETE: 미디어 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdvertiserSession()
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const supabase = await createClient()
    const { media_id } = await request.json()

    // 미디어 조회
    const { data: media } = await supabase
      .from('program_media')
      .select('*')
      .eq('id', media_id)
      .eq('advertiser_id', session.advertiserUuid)
      .single()

    if (!media) {
      return NextResponse.json({ error: '미디어를 찾을 수 없습니다' }, { status: 404 })
    }

    // Storage에서 삭제 (유튜브 링크는 스킵)
    if (media.type !== 'youtube' && media.url.includes('program-media')) {
      const path = media.url.split('/program-media/')[1]
      if (path) {
        await supabase.storage.from('program-media').remove([path])
      }
    }

    // DB에서 삭제
    await supabase.from('program_media').delete().eq('id', media_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Media DELETE error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
