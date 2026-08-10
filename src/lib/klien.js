import { supabase } from './supabase'

// Cari klien yang sudah ada (cocok nama + nomor WA, huruf besar/kecil &
// spasi diabaikan), atau bikin baris klien baru kalau belum ada. Ini yang
// bikin setiap klien punya ID unik asli di database -- 2 klien beda orang
// dengan nama sama tapi nomor WA beda akan dianggap 2 ID yang berbeda.
//
// Dipakai bareng-bareng oleh BookingModal.jsx (booking baru) dan
// BookingDetailModal.jsx (edit booking), biar konsisten.
export async function cariAtauBuatKlien(userId, nama, whatsapp) {
  const namaTrim = (nama || '').trim()
  const waTrim = (whatsapp || '').trim() || null

  if (!namaTrim) return null

  let query = supabase
    .from('klien')
    .select('id')
    .eq('user_id', userId)
    .ilike('nama', namaTrim)

  query = waTrim ? query.eq('nomor_whatsapp', waTrim) : query.is('nomor_whatsapp', null)

  const { data: existing, error: findError } = await query.maybeSingle()
  if (findError) throw findError
  if (existing) return existing.id

  const { data: created, error: createError } = await supabase
    .from('klien')
    .insert({ user_id: userId, nama: namaTrim, nomor_whatsapp: waTrim })
    .select('id')
    .single()

  if (createError) {
    // Kalau race condition (2 booking disimpan hampir bersamaan dengan
    // klien baru yang sama) bentrok sama unique index di database,
    // coba cari ulang -- kemungkinan besar baris klien-nya sudah kebuat.
    if (createError.code === '23505') {
      const { data: retryFound } = await query.maybeSingle()
      if (retryFound) return retryFound.id
    }
    throw createError
  }
  return created.id
}
