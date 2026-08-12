// Format angka buat DITAMPILKAN di field input (kasih titik ribuan ala
// Indonesia, misal 50000 -> "50.000"). Karakter non-angka apapun yang
// nyelip (misal user paste teks aneh) otomatis dibuang duluan.
export function formatAngkaInput(value) {
  const digitsOnly = String(value ?? '').replace(/\D/g, '')
  if (!digitsOnly) return ''
  return Number(digitsOnly).toLocaleString('id-ID')
}

// Kebalikannya -- dipanggil di onChange, buang semua titik/karakter non-angka
// dari yang baru diketik user, biar STATE yang kesimpen tetap angka polos
// (gampang dipakai buat hitung-hitungan & disimpan ke Supabase apa adanya).
export function parseAngkaInput(value) {
  return String(value ?? '').replace(/\D/g, '')
}
