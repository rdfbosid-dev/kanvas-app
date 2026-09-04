import { createClient } from '@supabase/supabase-js'

function pad(n) {
  return String(n).padStart(2, '0')
}

// Karakter khusus (koma, titik-koma, newline, backslash) WAJIB di-escape
// di format iCalendar, kalau nggak bisa bikin file .ics-nya rusak/nggak
// kebaca sama app kalender.
function escapeICS(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function formatDateUTC(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
}

export default async function handler(req, res) {
  const { kode } = req.query

  if (!kode) {
    res.status(400).send('Kode kalender tidak ditemukan di URL.')
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  // SENGAJA pakai Service Role Key (bukan anon key yang dipakai React di
  // browser) -- soalnya endpoint ini diakses TANPA login (app Kalender di
  // HP nggak bisa "login" ke akun Dapur MUA), jadi butuh akses yang bisa
  // nembus RLS. Keamanannya digantiin sama `kode` yang acak & rahasia,
  // BUKAN dari sesi login. Env var ini WAJIB di-set di Vercel Dashboard
  // (Settings > Environment Variables), JANGAN pernah ditaruh di file
  // .env yang di-bundle ke React (itu kenapa namanya nggak diawalin
  // "VITE_" -- biar nggak ke-ikut kebundle ke kode yang jalan di browser).
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).send('Konfigurasi server belum lengkap (SUPABASE_SERVICE_ROLE_KEY belum di-set di Vercel).')
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, studio_name')
    .eq('kode_kalender', kode)
    .maybeSingle()

  if (profileError || !profile) {
    res.status(404).send('Kode kalender tidak valid atau tidak ditemukan.')
    return
  }

  const { data: bookings, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id, nama_klien, event, tanggal_acara, jam_start_makeup, lokasi')
    .eq('user_id', profile.id)
    .order('tanggal_acara', { ascending: true })

  if (bookingError) {
    res.status(500).send('Gagal mengambil data booking.')
    return
  }

  const studioName = profile.studio_name || 'Dapur MUA'
  const now = formatDateUTC(new Date())

  const events = (bookings || []).map((b) => {
    const [y, m, d] = b.tanggal_acara.split('-').map(Number)
    let dtStart, dtEnd
    let allDay = false

    if (b.jam_start_makeup) {
      const [jam, menit] = b.jam_start_makeup.slice(0, 5).split(':').map(Number)
      dtStart = `${y}${pad(m)}${pad(d)}T${pad(jam)}${pad(menit)}00`
      // Data kita nggak nyimpen jam SELESAI eksplisit -- default durasi
      // 3 jam per booking (angka wajar buat sesi makeup, bisa disesuaikan
      // di sini kalau perlu).
      const end = new Date(y, m - 1, d, jam, menit)
      end.setHours(end.getHours() + 3)
      dtEnd = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`
    } else {
      allDay = true
      dtStart = `${y}${pad(m)}${pad(d)}`
      const end = new Date(y, m - 1, d + 1)
      dtEnd = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}`
    }

    const summary = escapeICS(`${b.event || 'Booking'} - ${b.nama_klien || ''}`)
    const location = escapeICS(b.lokasi || '')

    return [
      'BEGIN:VEVENT',
      `UID:${b.id}@dapurmua.app`,
      `DTSTAMP:${now}`,
      allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART;TZID=Asia/Jakarta:${dtStart}`,
      allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND;TZID=Asia/Jakarta:${dtEnd}`,
      `SUMMARY:${summary}`,
      location ? `LOCATION:${location}` : null,
      'END:VEVENT',
    ].filter(Boolean).join('\r\n')
  })

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dapur MUA//Kalender Booking//ID',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:Jadwal Booking - ${escapeICS(studioName)}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'inline; filename="dapurmua-kalender.ics"')
  res.status(200).send(ics)
}
