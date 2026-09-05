import { useAuth } from '../context/AuthContext'
import './InvoiceModal.css'

function formatRupiah(n) {
  return 'Rp' + (Number(n) || 0).toLocaleString('id-ID')
}
function formatTanggal(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function InvoiceModal({ booking, peserta, payments, onClose }) {
  const { profile } = useAuth()

  const totalDibayar = payments.reduce((s, p) => s + Number(p.jumlah), 0)
  const sisa = (booking.belanja_klien || 0) - totalDibayar

  function handlePrint() {
    window.print()
  }

  function handleWhatsApp() {
  const nomor = (booking.nomor_whatsapp || '').replace(/[^0-9]/g, '').replace(/^0/, '62')
  const namaStudio = profile?.studio_name || 'Makeup by'
  const pesan = `Halo, Kak!\n\nBerikut kami kirimkan ringkasan invoice makeup untuk *Kak ${booking.nama_klien}*.\n\n*Kode Booking*: ${booking.kode_booking}\n*Tanggal Makeup*: ${formatTanggal(booking.tanggal_acara)}\n*Event*: ${booking.event}\n\n*Total Biaya*: ${formatRupiah(booking.belanja_klien)}\n\n*Sudah Dibayar*: ${formatRupiah(totalDibayar)}\n*Kekurangan*: ${formatRupiah(sisa)}\n\nTerima kasih!\n\nSalam hangat,\n*${namaStudio}*.`
  const pesanEncoded = encodeURIComponent(pesan)
  const waUrl = `https://wa.me/${nomor}?text=${pesanEncoded}`

  // Link wa.me biasa itu "universal" -- OS yang mutusin app mana yang
  // kebuka kalau WhatsApp reguler & Business dua-duanya keinstall.
  // Di iPhone, iOS otomatis nawarin pilihan "Message" vs "Open in
  // WhatsApp Business" duluan, jadi link biasa aja udah cukup di sana.
  // Di Android, TIDAK ada pilihan itu -- langsung ke WhatsApp reguler.
  // Satu-satunya cara maksa app spesifik di Android: Intent URI yang
  // nunjuk LANGSUNG ke package WhatsApp Business (com.whatsapp.w4b).
  // `S.browser_fallback_url` jaga-jaga andaikan WhatsApp Business
  // TERNYATA nggak keinstall di HP klien yang buka link ini -- otomatis
  // balik ke link wa.me biasa, bukan macet/dead-end.
  const isAndroid = /Android/i.test(navigator.userAgent)

  if (isAndroid) {
    const intentUrl = `intent://wa.me/${nomor}?text=${pesanEncoded}#Intent;scheme=https;package=com.whatsapp.w4b;S.browser_fallback_url=${encodeURIComponent(waUrl)};end`
    window.location.href = intentUrl
  } else {
    window.open(waUrl, '_blank')
  }
}

  return (
    <div className="modal-overlay invoice-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal invoice-modal">
        <div className="modal-head invoice-no-print">
          <h2>Invoice</h2>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>

        <div className="modal-body invoice-paper">
          <div className="inv-header">
            <div>
              <div className="inv-studio">{profile?.studio_name || 'Makeup by'}</div>
              {profile?.whatsapp && <div className="inv-studio-meta">WA: {profile.whatsapp}</div>}
              {profile?.instagram && <div className="inv-studio-meta">IG: {profile.instagram}</div>}
            </div>
            <div className="inv-title-block">
              <div className="inv-title">INVOICE</div>
              <div className="inv-kode">{booking.kode_booking}</div>
            </div>
          </div>

          <div className="inv-divider"></div>

          <div className="inv-grid">
            <div>
              <div className="inv-label">Ditagihkan kepada</div>
              <div className="inv-name">{booking.nama_klien}</div>
              {booking.nomor_whatsapp && <div className="inv-sub">{booking.nomor_whatsapp}</div>}
            </div>
            <div>
              <div className="inv-label">Detail Acara</div>
              <div className="inv-sub-event">{booking.event}</div>
              <div className="inv-sub-date">{formatTanggal(booking.tanggal_acara)}{booking.jam_start_makeup ? ` · ${booking.jam_start_makeup.slice(0, 5)} WIB` : ''}</div>
              {booking.lokasi && <div className="inv-sub-loc">{booking.lokasi}</div>}
            </div>
          </div>

          <table className="inv-table">
            <thead>
              <tr>
                <th>Peserta</th>
                <th>Layanan</th>
                <th className="right">Biaya</th>
              </tr>
            </thead>
            <tbody>
              {peserta.flatMap((p) => {
                const rows = [
                  <tr key={p.id + '-mkp'}>
                    <td>{p.nama_anggota}{p.peran ? ` (${p.peran})` : ''}</td>
                    <td>Makeup {p.jenis_paket}</td>
                    <td className="right">{formatRupiah(p.biaya_makeup)}</td>
                  </tr>,
                ]
                if (p.layanan_tambahan !== 'Tidak Ada') {
                  rows.push(
                    <tr key={p.id + '-tmb'}>
                      <td></td>
                      <td>{p.layanan_tambahan}</td>
                      <td className="right">{formatRupiah(p.biaya_tambahan)}</td>
                    </tr>
                  )
                }
                return rows
              })}
              {Number(booking.biaya_transport) > 0 && (
                <tr>
                  <td></td>
                  <td>Transport</td>
                  <td className="right">{formatRupiah(booking.biaya_transport)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="inv-summary">
            <div className="inv-summary-row"><span>Total Tagihan</span><b>{formatRupiah(booking.belanja_klien)}</b></div>
            <div className="inv-summary-row"><span>Sudah Dibayar</span><b>{formatRupiah(totalDibayar)}</b></div>
            <div className="inv-summary-row inv-summary-final"><span>Sisa Tagihan</span><b>{formatRupiah(sisa)}</b></div>
          </div>

          {payments.length > 0 && (
            <>
              <div className="inv-label" style={{ marginTop: 20, marginBottom: 8 }}>Riwayat Pembayaran</div>
              {payments.map((p) => (
                <div className="inv-pay-row" key={p.id}>
                  <span>{formatTanggal(p.tanggal)}</span>
                  <span>{p.metode}</span>
                  <span>{formatRupiah(p.jumlah)}</span>
                </div>
              ))}
            </>
          )}

          <div className="inv-note">
            <div className="inv-label">Catatan</div>
            <div className="inv-sub">{booking.catatan || '—'}</div>
          </div>

          <div className="inv-footer">Terima kasih atas kepercayaan Anda karena telah menggunakan jasa kami.</div>
        </div>

        <div className="modal-foot invoice-no-print">
          <button className="btn-ghost" onClick={onClose}>Tutup</button>
          <button className="btn-ghost" onClick={handleWhatsApp} type="button">Kirim ke WhatsApp</button>
          <button className="btn-ghost" onClick={handlePrint} type="button">Cetak / Simpan PDF</button>
        </div>
      </div>
    </div>
  )
}
