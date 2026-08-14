import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CustomSelect from './CustomSelect'
import { EVENT_OPTIONS, EVENT_CUSTOM_SENTINEL } from '../lib/constants'
import { formatAngkaInput, parseAngkaInput } from '../lib/format'
import { cariAtauBuatKlien } from '../lib/klien'
import './BookingModal.css'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function blankPeserta(nama = '') {
  return {
    nama, peran: '',
    jenisPaket: 'Reguler', dikerjakanOlehMakeup: 'Me',
    biayaMakeup: '', komisiMakeup: '',
    layananTambahan: 'Tidak Ada', dikerjakanOlehTambahan: 'Me',
    biayaTambahan: '', komisiTambahan: '',
  }
}

export default function BookingModal({ onClose, onSaved }) {
  const { user } = useAuth()

  const [tanggalBooking, setTanggalBooking] = useState(todayStr())
  const [namaKlien, setNamaKlien] = useState('')
  const [nomorWhatsApp, setNomorWhatsApp] = useState('')
  const [sumber, setSumber] = useState('Instagram')
  const [tanggalAcara, setTanggalAcara] = useState('')
  const [jamStartMakeup, setJamStartMakeup] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [event, setEvent] = useState(EVENT_OPTIONS[0])
  const [eventCustom, setEventCustom] = useState('')
  const [biayaTransport, setBiayaTransport] = useState('')
  const [dp, setDp] = useState('')
  const [dpMetode, setDpMetode] = useState('Transfer Bank')
  const [catatan, setCatatan] = useState('')
  const [pesertaList, setPesertaList] = useState([blankPeserta()])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [existingClients, setExistingClients] = useState([])
  const [showSuggest, setShowSuggest] = useState(false)

  // Ambil daftar klien (dari tabel `klien`, yang masing-masing punya ID unik
  // asli) buat autocomplete di field Nama klien -- biar klien yang booking
  // ulang nggak perlu ngetik ulang nomor WA-nya. Karena sumbernya sekarang
  // tabel klien asli (bukan nebak dari nama di bookings), 2 klien beda orang
  // yang kebetulan namanya sama bakal tetap muncul terpisah (beda nomor WA).
  useEffect(() => {
    async function loadExistingClients() {
      const { data } = await supabase
        .from('klien')
        .select('id, nama, nomor_whatsapp')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setExistingClients(data)
    }
    if (user) loadExistingClients()
  }, [user])

  const namaKlienTrim = namaKlien.trim().toLowerCase()
  const clientSuggestions = namaKlienTrim
    ? existingClients
        .filter((c) => c.nama.toLowerCase().includes(namaKlienTrim) && c.nama.toLowerCase() !== namaKlienTrim)
        .slice(0, 5)
    : []

  function pilihKlien(c) {
    setNamaKlien(c.nama)
    if (c.nomor_whatsapp) setNomorWhatsApp(c.nomor_whatsapp)
    setShowSuggest(false)
  }


  function updatePeserta(i, field, value) {
    setPesertaList((list) => list.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)))
  }
  function addPeserta() {
    setPesertaList((list) => [...list, blankPeserta()])
  }
  function removePeserta(i) {
    setPesertaList((list) => list.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!namaKlien.trim()) { setError('Nama klien wajib diisi.'); return }
    if (!tanggalAcara) { setError('Tanggal acara wajib diisi.'); return }
    if (pesertaList.length === 0) { setError('Tambahkan minimal 1 peserta.'); return }

    setSaving(true)

    let klienId = null
    try {
      klienId = await cariAtauBuatKlien(user.id, namaKlien, nomorWhatsApp)
    } catch (klienErr) {
      setError('Gagal memproses data klien: ' + klienErr.message)
      setSaving(false)
      return
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        klien_id: klienId,
        tanggal_booking: tanggalBooking,
        nama_klien: namaKlien.trim(),
        nomor_whatsapp: nomorWhatsApp.trim(),
        sumber,
        tanggal_acara: tanggalAcara,
        jam_start_makeup: jamStartMakeup || null,
        lokasi: lokasi.trim(),
        event: event === EVENT_CUSTOM_SENTINEL ? (eventCustom.trim() || 'Lainnya') : event,
        biaya_transport: Number(biayaTransport) || 0,
        catatan: catatan.trim(),
      })
      .select()
      .single()

    if (bookingError) {
      setError(bookingError.message)
      setSaving(false)
      return
    }

    const pesertaRows = pesertaList.map((p) => ({
      booking_id: booking.id,
      user_id: user.id,
      nama_anggota: p.nama.trim(),
      peran: p.peran.trim(),
      jenis_paket: p.jenisPaket,
      dikerjakan_oleh_makeup: p.dikerjakanOlehMakeup,
      biaya_makeup: Number(p.biayaMakeup) || 0,
      komisi_makeup_tim: Number(p.komisiMakeup) || 0,
      layanan_tambahan: p.layananTambahan,
      dikerjakan_oleh_tambahan: p.dikerjakanOlehTambahan,
      biaya_tambahan: Number(p.biayaTambahan) || 0,
      komisi_tambahan: Number(p.komisiTambahan) || 0,
    }))

    const { error: pesertaError } = await supabase.from('peserta').insert(pesertaRows)

    if (pesertaError) {
      setSaving(false)
      setError('Booking tersimpan, tapi gagal simpan peserta: ' + pesertaError.message)
      return
    }

    if (Number(dp) > 0) {
      const { error: dpError } = await supabase.from('payments').insert({
        booking_id: booking.id,
        user_id: user.id,
        tanggal: tanggalBooking,
        jumlah: Number(dp),
        metode: dpMetode,
      })
      if (dpError) {
        setSaving(false)
        setError('Booking & peserta tersimpan, tapi gagal simpan DP: ' + dpError.message)
        return
      }
    }

    setSaving(false)
    onSaved(booking.kode_booking)
  }

  return (
    <div className="modal-overlay booking-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <h2>Booking Baru</h2>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body">
            {error && <div className="modal-error">{error}</div>}

            <div className="section-label">IINFO BOOKING</div>
            <div className="field-grid">
              <div className="field">
                <label>Tanggal Booking</label>
                <input type="date" value={tanggalBooking} onChange={(e) => setTanggalBooking(e.target.value)} required />
              </div>
              <div className="field" style={{ position: 'relative' }}>
                <label>Nama Klien</label>
                <input
                  type="text"
                  placeholder="contoh: Jenny Black Pink"
                  value={namaKlien}
                  onChange={(e) => { setNamaKlien(e.target.value); setShowSuggest(true) }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
                  autoComplete="off"
                  required
                />
                {showSuggest && clientSuggestions.length > 0 && (
                  <div className="klien-suggest">
                    {clientSuggestions.map((c) => (
                      <div
                        key={c.id}
                        className="klien-suggest-item"
                        onMouseDown={() => pilihKlien(c)}
                      >
                        <span className="klien-suggest-name">{c.nama}</span>
                        {c.nomor_whatsapp && <span className="klien-suggest-wa">{c.nomor_whatsapp}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="field">
                <label>Nomor WhatsApp</label>
                <input type="text" placeholder="0812xxxxxxx" value={nomorWhatsApp} onChange={(e) => setNomorWhatsApp(e.target.value)} />
              </div>
            </div>
            <div className="field-grid cols-2" style={{ marginTop: 12 }}>
              <div className="field">
                <label>Sumber</label>
                <CustomSelect
                  options={['Instagram', 'WhatsApp', 'TikTok', 'Facebook', 'Referral']}
                  value={sumber}
                  onChange={setSumber}
                />
              </div>
              <div className="field">
                <label>Event</label>
                <CustomSelect
                  options={EVENT_OPTIONS}
                  value={event}
                  onChange={setEvent}
                />
                {event === EVENT_CUSTOM_SENTINEL && (
                  <input
                    type="text"
                    placeholder="Tulis nama event..."
                    value={eventCustom}
                    onChange={(e) => setEventCustom(e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>
            </div>

            <div className="section-label">DETAIL ACARA</div>
            <div className="field-grid detail-acara-grid">
              <div className="field">
                <label>Tanggal Acara</label>
                <input type="date" value={tanggalAcara} onChange={(e) => setTanggalAcara(e.target.value)} required />
              </div>
              <div className="field">
                <label>Jam Mulai</label>
                <input type="time" value={jamStartMakeup} onChange={(e) => setJamStartMakeup(e.target.value)} />
              </div>
              <div className="field">
                <label>Lokasi</label>
                <input type="text" placeholder="Kecamatan, Kota/Kabupaten" value={lokasi} onChange={(e) => setLokasi(e.target.value)} />
              </div>
            </div>

            <div className="section-label">BIAYA TAMBAHAN</div>
            <div className="field-grid cols-2">
              <div className="field">
                <label>Biaya Transport</label>
                <input type="text" inputMode="numeric" placeholder="Rp 0" value={formatAngkaInput(biayaTransport)} onChange={(e) => setBiayaTransport(parseAngkaInput(e.target.value))} />
              </div>
              <div className="field">
                <label>DP Masuk</label>
                <input type="text" inputMode="numeric" placeholder="Rp 0" value={formatAngkaInput(dp)} onChange={(e) => setDp(parseAngkaInput(e.target.value))} />
              </div>
            </div>
            <div className="field-grid cols-2" style={{ marginTop: 12 }}>
              {Number(dp) > 0 && (
                <div className="field">
                  <label>Metode DP</label>
                  <CustomSelect
                    options={['Transfer Bank', 'E-Wallet', 'QRIS', 'Cash']}
                    value={dpMetode}
                    onChange={setDpMetode}
                  />
                </div>
              )}
              <div className="field">
                <label>Catatan</label>
                <input type="text" placeholder="Opsional" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
              </div>
            </div>

            <div className="section-label">Peserta</div>
            <div>
              {pesertaList.map((p, i) => {
                const hairdoOff = p.layananTambahan === 'Tidak Ada'
                return (
                  <div className="peserta-card" key={i}>
                    <div className="peserta-head">
                      <div className="peserta-title"><span className="peserta-num">{i + 1}</span>Peserta {i + 1}</div>
                      {pesertaList.length > 1 && (
                        <button type="button" className="peserta-remove" onClick={() => removePeserta(i)}>Hapus</button>
                      )}
                    </div>
                    <div className="peserta-body">
                      <div className="field-grid cols-2">
                        <div className="field">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label>Nama Klien</label>
                            {i === 0 && namaKlien.trim() && (
                              <button
                                type="button"
                                className="quickfill-btn"
                                onClick={() => updatePeserta(0, 'nama', namaKlien.trim())}
                              >
                                Pakai nama klien utama
                              </button>
                            )}
                          </div>
                          <input type="text" placeholder="contoh: Jenny Black Pink" value={p.nama} onChange={(e) => updatePeserta(i, 'nama', e.target.value)} />
                        </div>
                        <div className="field">
                          <label>Peran</label>
                          <input type="text" placeholder="contoh: Klien Utama/Wisudawati" value={p.peran} onChange={(e) => updatePeserta(i, 'peran', e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <div className="sb-label">Layanan Makeup</div>
                        <div className="toggle-row">
                          <div className={`toggle-opt${p.jenisPaket === 'Reguler' ? ' sel' : ''}`} onClick={() => updatePeserta(i, 'jenisPaket', 'Reguler')}>Reguler</div>
                          <div className={`toggle-opt${p.jenisPaket === 'VIP' ? ' sel' : ''}`} onClick={() => updatePeserta(i, 'jenisPaket', 'VIP')}>VIP</div>
                        </div>
                      </div>
                      <div className="field-grid cols-2">
                        <div className="field">
                          <label>Biaya Makeup</label>
                          <input type="text" inputMode="numeric" placeholder="Rp 0" value={formatAngkaInput(p.biayaMakeup)} onChange={(e) => updatePeserta(i, 'biayaMakeup', parseAngkaInput(e.target.value))} />
                        </div>
                        <div className="field">
                          <label>&nbsp;</label>
                          <div className="toggle-row">
                            <div className={`toggle-opt${p.dikerjakanOlehMakeup === 'Me' ? ' sel' : ''}`} onClick={() => updatePeserta(i, 'dikerjakanOlehMakeup', 'Me')}>Me</div>
                            <div className={`toggle-opt${p.dikerjakanOlehMakeup === 'Tim' ? ' sel' : ''}`} onClick={() => updatePeserta(i, 'dikerjakanOlehMakeup', 'Tim')}>Tim</div>
                          </div>
                        </div>
                      </div>
                      {p.dikerjakanOlehMakeup === 'Tim' && (
                        <div className="field">
                          <label>Komisi untuk Kamu</label>
                          <input type="text" inputMode="numeric" placeholder="Rp 0" value={formatAngkaInput(p.komisiMakeup)} onChange={(e) => updatePeserta(i, 'komisiMakeup', parseAngkaInput(e.target.value))} />
                        </div>
                      )}

                      <div>
                        <div className="sb-label">Tambahan Layanan Rambut</div>
                        <div className="toggle-row">
                          <div className={`toggle-opt${p.layananTambahan === 'Tidak Ada' ? ' sel' : ''}`} onClick={() => updatePeserta(i, 'layananTambahan', 'Tidak Ada')}>Tidak ada</div>
                          <div className={`toggle-opt${p.layananTambahan === 'Hairdo' ? ' sel' : ''}`} onClick={() => updatePeserta(i, 'layananTambahan', 'Hairdo')}>Hairdo</div>
                          <div className={`toggle-opt${p.layananTambahan === 'Hijabdo Plus' ? ' sel' : ''}`} onClick={() => updatePeserta(i, 'layananTambahan', 'Hijabdo Plus')}>Hijabdo+</div>
                        </div>
                      </div>
                      {!hairdoOff && (
                        <>
                          <div className="field-grid cols-2">
                            <div className="field">
                              <label>Biaya Layanan Tambahan</label>
                              <input type="text" inputMode="numeric" placeholder="Rp 0" value={formatAngkaInput(p.biayaTambahan)} onChange={(e) => updatePeserta(i, 'biayaTambahan', parseAngkaInput(e.target.value))} />
                            </div>
                            <div className="field">
                              <label>&nbsp;</label>
                              <div className="toggle-row">
                                <div className={`toggle-opt${p.dikerjakanOlehTambahan === 'Me' ? ' sel' : ''}`} onClick={() => updatePeserta(i, 'dikerjakanOlehTambahan', 'Me')}>Me</div>
                                <div className={`toggle-opt${p.dikerjakanOlehTambahan === 'Tim' ? ' sel' : ''}`} onClick={() => updatePeserta(i, 'dikerjakanOlehTambahan', 'Tim')}>Tim</div>
                              </div>
                            </div>
                          </div>
                          {p.dikerjakanOlehTambahan === 'Tim' && (
                            <div className="field">
                              <label>Komisi untuk Kamu</label>
                              <input type="text" inputMode="numeric" placeholder="Rp 0" value={formatAngkaInput(p.komisiTambahan)} onChange={(e) => updatePeserta(i, 'komisiTambahan', parseAngkaInput(e.target.value))} />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
              <button type="button" className="add-peserta" onClick={addPeserta}>+ Tambah Peserta</button>
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
