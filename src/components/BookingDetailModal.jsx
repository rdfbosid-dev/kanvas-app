import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CustomSelect from './CustomSelect'
import { EVENT_OPTIONS, EVENT_CUSTOM_SENTINEL } from '../lib/constants'
import { cariAtauBuatKlien } from '../lib/klien'
import { formatAngkaInput, parseAngkaInput } from '../lib/format'
import InvoiceModal from './InvoiceModal'
import './BookingModal.css'
import './BookingDetailModal.css'

function formatRupiah(n) {
  return 'Rp' + (Number(n) || 0).toLocaleString('id-ID')
}
function formatTanggal(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function BookingDetailModal({ booking, onClose, onChanged }) {
  const { user } = useAuth()

  const [peserta, setPeserta] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editMode, setEditMode] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [confirmDeleteBooking, setConfirmDeleteBooking] = useState(false)
  const [saving, setSaving] = useState(false)

  // form state buat mode edit
  const [namaKlien, setNamaKlien] = useState('')
  const [nomorWhatsApp, setNomorWhatsApp] = useState('')
  const [sumber, setSumber] = useState('')
  const [tanggalAcara, setTanggalAcara] = useState('')
  const [jamStartMakeup, setJamStartMakeup] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [event, setEvent] = useState('')
  const [eventCustom, setEventCustom] = useState('')
  const [biayaTransport, setBiayaTransport] = useState('')
  const [catatan, setCatatan] = useState('')
  const [editPeserta, setEditPeserta] = useState([])
  const [removedPesertaIds, setRemovedPesertaIds] = useState([])

  // form pembayaran baru
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('Transfer Bank')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payNote, setPayNote] = useState('')

  // edit pembayaran yang udah ada
  const [editingPaymentId, setEditingPaymentId] = useState(null)
  const [editPayAmount, setEditPayAmount] = useState('')
  const [editPayMethod, setEditPayMethod] = useState('')
  const [editPayDate, setEditPayDate] = useState('')

  useEffect(() => {
    loadDetail()
  }, [booking.id])

  async function loadDetail() {
    setLoading(true)
    setError('')

    const [{ data: pesertaData, error: pesertaErr }, { data: paymentData, error: paymentErr }] = await Promise.all([
      supabase.from('peserta').select('*').eq('booking_id', booking.id).order('created_at'),
      supabase.from('payments').select('*').eq('booking_id', booking.id).order('tanggal', { ascending: false }),
    ])

    if (pesertaErr || paymentErr) {
      setError((pesertaErr || paymentErr).message)
    } else {
      setPeserta(pesertaData || [])
      setPayments(paymentData || [])
    }
    setLoading(false)
  }

  function enterEditMode() {
    setConfirmDeleteBooking(false)
    setNamaKlien(booking.nama_klien || '')
    setNomorWhatsApp(booking.nomor_whatsapp || '')
    setSumber(booking.sumber || 'Instagram')
    setTanggalAcara(booking.tanggal_acara || '')
    setJamStartMakeup(booking.jam_start_makeup || '')
    setLokasi(booking.lokasi || '')
    if (EVENT_OPTIONS.includes(booking.event)) {
      setEvent(booking.event)
      setEventCustom('')
    } else {
      setEvent(EVENT_CUSTOM_SENTINEL)
      setEventCustom(booking.event || '')
    }
    setBiayaTransport(booking.biaya_transport ?? '')
    setCatatan(booking.catatan || '')
    setEditPeserta(peserta.map((p) => ({ ...p })))
    setRemovedPesertaIds([])
    setEditMode(true)
  }

  function updateEditPeserta(i, field, value) {
    setEditPeserta((list) => list.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)))
  }
  function addEditPeserta() {
    setEditPeserta((list) => [...list, {
      nama_anggota: '', peran: '', jenis_paket: 'Reguler', dikerjakan_oleh_makeup: 'Me',
      biaya_makeup: 0, komisi_makeup_tim: 0, layanan_tambahan: 'Tidak Ada',
      dikerjakan_oleh_tambahan: 'Me', biaya_tambahan: 0, komisi_tambahan: 0,
    }])
  }
  function removeEditPeserta(i) {
    const p = editPeserta[i]
    if (p.id) setRemovedPesertaIds((ids) => [...ids, p.id])
    setEditPeserta((list) => list.filter((_, idx) => idx !== i))
  }

  async function handleSaveEdit() {
    setSaving(true)
    setError('')

    let klienId = null
    try {
      klienId = await cariAtauBuatKlien(user.id, namaKlien, nomorWhatsApp)
    } catch (klienErr) {
      setSaving(false)
      setError('Gagal memproses data klien: ' + klienErr.message)
      return
    }

    const { error: updateErr } = await supabase
      .from('bookings')
      .update({
        klien_id: klienId,
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
      .eq('id', booking.id)

    if (updateErr) {
      setSaving(false)
      setError(updateErr.message)
      return
    }

    if (removedPesertaIds.length > 0) {
      const { error: delErr } = await supabase.from('peserta').delete().in('id', removedPesertaIds)
      if (delErr) { setSaving(false); setError(delErr.message); return }
    }

    for (const p of editPeserta) {
      const payload = {
        nama_anggota: p.nama_anggota?.trim() || '',
        peran: p.peran?.trim() || '',
        jenis_paket: p.jenis_paket,
        dikerjakan_oleh_makeup: p.dikerjakan_oleh_makeup,
        biaya_makeup: Number(p.biaya_makeup) || 0,
        komisi_makeup_tim: Number(p.komisi_makeup_tim) || 0,
        layanan_tambahan: p.layanan_tambahan,
        dikerjakan_oleh_tambahan: p.dikerjakan_oleh_tambahan,
        biaya_tambahan: Number(p.biaya_tambahan) || 0,
        komisi_tambahan: Number(p.komisi_tambahan) || 0,
      }
      if (p.id) {
        const { error: upErr } = await supabase.from('peserta').update(payload).eq('id', p.id)
        if (upErr) { setSaving(false); setError(upErr.message); return }
      } else {
        const { error: insErr } = await supabase.from('peserta').insert({ ...payload, booking_id: booking.id, user_id: user.id })
        if (insErr) { setSaving(false); setError(insErr.message); return }
      }
    }

    setSaving(false)
    setEditMode(false)
    await loadDetail()
    onChanged()
  }

  function startEditPayment(p) {
    setEditingPaymentId(p.id)
    setEditPayAmount(p.jumlah)
    setEditPayMethod(p.metode || 'Transfer Bank')
    setEditPayDate(p.tanggal)
  }

  async function handleSaveEditPayment(paymentId) {
    if (!editPayAmount || Number(editPayAmount) <= 0) { setError('Jumlah pembayaran harus lebih dari 0.'); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('payments')
      .update({ jumlah: Number(editPayAmount), metode: editPayMethod, tanggal: editPayDate })
      .eq('id', paymentId)
    setSaving(false)
    if (err) { setError(err.message); return }
    setEditingPaymentId(null)
    await loadDetail()
    onChanged()
  }

  async function handleDeletePayment(paymentId) {
    if (!window.confirm('Hapus catatan pembayaran ini?')) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('payments').delete().eq('id', paymentId)
    setSaving(false)
    if (err) { setError(err.message); return }
    await loadDetail()
    onChanged()
  }

  async function handleDeleteBooking() {
    setSaving(true)
    setError('')
    // peserta & payments punya "on delete cascade" ke booking_id, jadi
    // ikut kehapus otomatis begitu baris booking-nya dihapus.
    const { error: err } = await supabase.from('bookings').delete().eq('id', booking.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    onChanged()
    onClose()
  }

  async function handleAddPayment(e) {
    e.preventDefault()
    if (!payAmount || Number(payAmount) <= 0) { setError('Jumlah pembayaran harus lebih dari 0.'); return }

    setSaving(true)
    setError('')
    const { error: payErr } = await supabase.from('payments').insert({
      booking_id: booking.id,
      user_id: user.id,
      tanggal: payDate,
      jumlah: Number(payAmount),
      metode: payMethod,
      catatan: payNote.trim(),
    })
    setSaving(false)

    if (payErr) { setError(payErr.message); return }

    setShowAddPayment(false)
    setPayAmount(''); setPayNote('')
    await loadDetail()
    onChanged()
  }

  const sisa = (booking.belanja_klien || 0) - payments.reduce((s, p) => s + Number(p.jumlah), 0)

  return (
    <div className="modal-overlay booking-detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <h2>{editMode ? 'Edit Booking' : booking.nama_klien}</h2>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}
          {loading && <div className="empty-state">Memuat detail...</div>}

          {!loading && !editMode && (
            <>
              <div className="detail-header">
                <span className={`status-pill ${booking.status_pembayaran === 'Lunas' ? 'lunas' : 'belum'}`}>
                  {booking.status_pembayaran}
                </span>
                <button className="btn-ghost" style={{ marginLeft: 'auto', marginRight: 10}} onClick={() => setShowInvoice(true)}>Invoice</button>
                <button className="btn-ghost" onClick={enterEditMode}>Edit</button>
              </div>

              <div className="detail-grid">
                <div><span className="detail-label">Event</span><div>{booking.event}</div></div>
                <div><span className="detail-label">Tanggal Acara</span><div>{formatTanggal(booking.tanggal_acara)}</div></div>
                <div><span className="detail-label">Jam Mulai</span><div>{booking.jam_start_makeup ? booking.jam_start_makeup.slice(0, 5) : '-'}</div></div>
                <div><span className="detail-label">Lokasi</span><div>{booking.lokasi || '-'}</div></div>
                <div><span className="detail-label">Nomor WhatsApp</span><div>{booking.nomor_whatsapp || '-'}</div></div>
                <div><span className="detail-label">Sumber</span><div>{booking.sumber || '-'}</div></div>
              </div>

              <div className="section-label">Pembayaran</div>
              <div className="pay-summary">
                <div><span className="detail-label-summary">Total Tagihan</span><div className="pay-value" style={{ color: 'var(--ink-faint)' }}>{formatRupiah(booking.belanja_klien)}</div></div>
                <div><span className="detail-label-summary">Sudah Dibayar</span><div className="pay-value" style={{ color: 'var(--value-done)' }}>{formatRupiah(booking.belanja_klien - sisa)}</div></div>
                <div><span className="detail-label-summary">Sisa Tagihan</span><div className="pay-value" style={{ color: sisa > 0 ? 'var(--value-sisa)' : 'var(--mint)' }}>{formatRupiah(sisa)}</div></div>
              </div>

              <div className="detail-label-history">Riwayat Pembayaran</div>
              {payments.length > 0 && (
                <div className="pay-history">
                  {payments.map((p) => (
                    editingPaymentId === p.id ? (
                      <div className="pay-edit-row" key={p.id}>
                        <div className="field-grid cols-2">
                          <div className="field"><label>Tanggal Pembayaran</label><input type="date" value={editPayDate} onChange={(e) => setEditPayDate(e.target.value)} /></div>
                          <div className="field"><label>Jumlah</label><input type="text" inputMode="numeric" value={formatAngkaInput(editPayAmount)} onChange={(e) => setEditPayAmount(parseAngkaInput(e.target.value))} /></div>
                        </div>
                        <div className="field-grid cols-2">
                        <div className="field">
                          <label>Metode Pembayaran</label>
                          <CustomSelect
                            options={['Transfer Bank', 'E-Wallet', 'QRIS', 'Cash']}
                            value={editPayMethod}
                            onChange={setEditPayMethod}
                          />
                        </div>
                        <div className="field"><label>Catatan</label><input type="text" placeholder="Opsional" value={payNote} onChange={(e) => setPayNote(e.target.value)} /></div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button type="button" className="btn-payment" onClick={() => setEditingPaymentId(null)}>Batal</button>
                          <button type="button" className="btn-payment" onClick={() => handleSaveEditPayment(p.id)} disabled={saving}>Simpan</button>
                        </div>
                      </div>
                    ) : (
                      <div className="pay-row" key={p.id}>
                        <span>{formatTanggal(p.tanggal)}</span>
                        <span>{p.metode}</span>
                        <span className="pay-amount">{formatRupiah(p.jumlah)}</span>
                        <div className="pay-actions">
                          <button type="button" onClick={() => startEditPayment(p)}>Edit</button>
                          <button type="button" onClick={() => handleDeletePayment(p.id)}>Hapus</button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}

              {!showAddPayment ? (
                <button type="button" className="add-payment" onClick={() => setShowAddPayment(true)}>+ Tambah Pembayaran</button>
              ) : (
                <form onSubmit={handleAddPayment} className="add-payment-card" style={{ marginTop: 8 }}>
                  <div className="field-grid cols-2">
                    <div className="field"><label>Tanggal Pembayaran</label><input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></div>
                    <div className="field"><label>Jumlah</label><input type="text" inputMode="numeric" placeholder="0" value={formatAngkaInput(payAmount)} onChange={(e) => setPayAmount(parseAngkaInput(e.target.value))} /></div>
                  </div>
                  <div className="field-grid cols-2">
                    <div className="field">
                      <label>Metode Pembayaran</label>
                      <CustomSelect
                        options={['Transfer Bank', 'E-Wallet', 'QRIS', 'Cash']}
                        value={payMethod}
                        onChange={setPayMethod}
                      />
                    </div>
                    <div className="field"><label>Catatan</label><input type="text" placeholder="Opsional" value={payNote} onChange={(e) => setPayNote(e.target.value)} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                    <button type="button" className="btn-payment" onClick={() => setShowAddPayment(false)}>Batal</button>
                    <button type="submit" className="btn-payment" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Pembayaran'}</button>
                  </div>
                </form>
              )}

              <div className="section-label">Klien ({peserta.length})</div>
              {peserta.map((p) => (
                <div className="peserta-view-row" key={p.id}>
                  <div className="b-avatar">{(p.nama_anggota || '?').slice(0, 2).toUpperCase()}</div>
                  <div className="b-info">
                    <div className="b-name">{p.nama_anggota} {p.peran ? `— (${p.peran})` : ''}</div>
                    <div className="b-meta">
                      {p.jenis_paket} ({p.dikerjakan_oleh_makeup}) — {formatRupiah(p.biaya_makeup)}
                      {p.layanan_tambahan !== 'Tidak Ada' ? ` · ${p.layanan_tambahan} (${p.dikerjakan_oleh_tambahan})` : ''}
                    </div>
                  </div>
                </div>
              ))}

              {booking.catatan && (
                <>
                  <div className="section-label">Catatan</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{booking.catatan}</div>
                </>
              )}
            </>
          )}

          {!loading && editMode && (
            <>
              <div className="section-label">Info Booking</div>
              <div className="field-grid">
                <div className="field"><label>Nama Klien</label><input type="text" value={namaKlien} onChange={(e) => setNamaKlien(e.target.value)} /></div>
                <div className="field"><label>Nomor WhatsApp</label><input type="text" value={nomorWhatsApp} onChange={(e) => setNomorWhatsApp(e.target.value)} /></div>
                <div className="field">
                  <label>Sumber</label>
                  <CustomSelect
                    options={['Instagram', 'WhatsApp', 'TikTok', 'Facebook', 'Referral']}
                    value={sumber}
                    onChange={setSumber}
                  />
                </div>
              </div>
              <div className="field-grid" style={{ marginTop: 12 }}>
                <div className="field"><label>Tanggal Acara</label><input type="date" value={tanggalAcara} onChange={(e) => setTanggalAcara(e.target.value)} /></div>
                <div className="field"><label>Jam Mulai</label><input type="time" value={jamStartMakeup} onChange={(e) => setJamStartMakeup(e.target.value)} /></div>
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
              <div className="field-grid cols-2" style={{ marginTop: 12 }}>
                <div className="field"><label>Lokasi</label><input type="text" value={lokasi} onChange={(e) => setLokasi(e.target.value)} /></div>
                <div className="field"><label>Biaya Transport</label><input type="text" inputMode="numeric" value={formatAngkaInput(biayaTransport)} onChange={(e) => setBiayaTransport(parseAngkaInput(e.target.value))} /></div>
              </div>
              <div className="field" style={{ marginTop: 12 }}><label>Catatan</label><textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} /></div>

              <div className="section-label">Peserta</div>
              {editPeserta.map((p, i) => (
                <div className="peserta-card" key={p.id || `new-${i}`}>
                  <div className="peserta-head">
                    <div className="peserta-title"><span className="peserta-num">{i + 1}</span>Peserta {i + 1}</div>
                    <button type="button" className="peserta-remove" onClick={() => removeEditPeserta(i)}>Hapus</button>
                  </div>
                  <div className="peserta-body">
                    <div className="field-grid cols-2">
                      <div className="field"><label>Nama</label><input type="text" value={p.nama_anggota} onChange={(e) => updateEditPeserta(i, 'nama_anggota', e.target.value)} /></div>
                      <div className="field"><label>Peran</label><input type="text" value={p.peran} onChange={(e) => updateEditPeserta(i, 'peran', e.target.value)} /></div>
                    </div>
                    <div className="toggle-row">
                      <div className={`toggle-opt${p.jenis_paket === 'Reguler' ? ' sel' : ''}`} onClick={() => updateEditPeserta(i, 'jenis_paket', 'Reguler')}>Reguler</div>
                      <div className={`toggle-opt${p.jenis_paket === 'VIP' ? ' sel' : ''}`} onClick={() => updateEditPeserta(i, 'jenis_paket', 'VIP')}>VIP</div>
                    </div>
                    <div className="field-grid cols-2">
                      <div className="field"><label>Biaya Makeup</label><input type="text" inputMode="numeric" value={formatAngkaInput(p.biaya_makeup)} onChange={(e) => updateEditPeserta(i, 'biaya_makeup', parseAngkaInput(e.target.value))} /></div>
                      <div className="field">
                        <label>&nbsp;</label>
                        <div className="toggle-row">
                          <div className={`toggle-opt${p.dikerjakan_oleh_makeup === 'Me' ? ' sel' : ''}`} onClick={() => updateEditPeserta(i, 'dikerjakan_oleh_makeup', 'Me')}>Me</div>
                          <div className={`toggle-opt${p.dikerjakan_oleh_makeup === 'Tim' ? ' sel' : ''}`} onClick={() => updateEditPeserta(i, 'dikerjakan_oleh_makeup', 'Tim')}>Tim</div>
                        </div>
                      </div>
                    </div>
                    {p.dikerjakan_oleh_makeup === 'Tim' && (
                      <div className="field"><label>Komisi</label><input type="text" inputMode="numeric" value={formatAngkaInput(p.komisi_makeup_tim)} onChange={(e) => updateEditPeserta(i, 'komisi_makeup_tim', parseAngkaInput(e.target.value))} /></div>
                    )}
                    <div className="toggle-row">
                      <div className={`toggle-opt${p.layanan_tambahan === 'Tidak Ada' ? ' sel' : ''}`} onClick={() => updateEditPeserta(i, 'layanan_tambahan', 'Tidak Ada')}>Tidak ada</div>
                      <div className={`toggle-opt${p.layanan_tambahan === 'Hairdo' ? ' sel' : ''}`} onClick={() => updateEditPeserta(i, 'layanan_tambahan', 'Hairdo')}>Hairdo</div>
                      <div className={`toggle-opt${p.layanan_tambahan === 'Hijabdo Plus' ? ' sel' : ''}`} onClick={() => updateEditPeserta(i, 'layanan_tambahan', 'Hijabdo Plus')}>Hijabdo+</div>
                    </div>
                    {p.layanan_tambahan !== 'Tidak Ada' && (
                      <div className="field-grid cols-2">
                        <div className="field"><label>Biaya Tambahan</label><input type="text" inputMode="numeric" value={formatAngkaInput(p.biaya_tambahan)} onChange={(e) => updateEditPeserta(i, 'biaya_tambahan', parseAngkaInput(e.target.value))} /></div>
                        <div className="field">
                          <label>&nbsp;</label>
                          <div className="toggle-row">
                            <div className={`toggle-opt${p.dikerjakan_oleh_tambahan === 'Me' ? ' sel' : ''}`} onClick={() => updateEditPeserta(i, 'dikerjakan_oleh_tambahan', 'Me')}>Me</div>
                            <div className={`toggle-opt${p.dikerjakan_oleh_tambahan === 'Tim' ? ' sel' : ''}`} onClick={() => updateEditPeserta(i, 'dikerjakan_oleh_tambahan', 'Tim')}>Tim</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" className="add-peserta" onClick={addEditPeserta}>+ Tambah Peserta</button>
            </>
          )}
        </div>

        {confirmDeleteBooking && (
          <div className="delete-confirm-banner">
            <div className="delete-confirm-text">
              <b>Hapus Booking {booking.nama_klien}?</b>
              <span>{peserta.length} peserta dan {payments.length} catatan pembayaran juga akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.</span>
            </div>
          </div>
        )}

        <div className="modal-foot">
          {editMode ? (
            <>
              <button className="btn-ghost" onClick={() => setEditMode(false)}>Batal</button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </>
          ) : confirmDeleteBooking ? (
            <>
              <button className="btn-ghost-delete" onClick={() => setConfirmDeleteBooking(false)}>Batal</button>
              <button className="btn-danger" onClick={handleDeleteBooking} disabled={saving}>
                {saving ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </>
          ) : (
            <>
              <button className="btn-danger-ghost" onClick={() => setConfirmDeleteBooking(true)}>Hapus Booking</button>
              <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={onClose}>Tutup</button>
            </>
          )}
        </div>
      </div>

      {showInvoice && (
        <InvoiceModal
          booking={booking}
          peserta={peserta}
          payments={payments}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  )
}
