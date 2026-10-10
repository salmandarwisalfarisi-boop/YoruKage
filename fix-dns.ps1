# YoruKage DNS Fixer — Ganti DNS ke Cloudflare untuk bypass blokir ISP Telkomsel
# Jalankan dengan: klik kanan → "Run as Administrator"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  YoruKage DNS Fixer (Cloudflare)" -ForegroundColor Cyan  
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }

foreach ($adapter in $adapters) {
    Write-Host "Mengubah DNS pada: $($adapter.Name) (index $($adapter.InterfaceIndex))..." -ForegroundColor Yellow
    try {
        Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses "1.1.1.1","1.0.0.1"
        Write-Host "  OK - DNS diubah ke 1.1.1.1 (Cloudflare)" -ForegroundColor Green
    } catch {
        Write-Host "  GAGAL: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Flush DNS cache..." -ForegroundColor Yellow
Clear-DnsClientCache
Write-Host "  OK - DNS cache dibersihkan" -ForegroundColor Green

Write-Host ""
Write-Host "Verifikasi DNS saat ini:" -ForegroundColor Cyan
Get-DnsClientServerAddress | Where-Object { $_.AddressFamily -eq 2 } | Select-Object InterfaceAlias, ServerAddresses | Format-Table -AutoSize

Write-Host ""
Write-Host "Test koneksi ke animepahe.ru..." -ForegroundColor Yellow
try {
    $resolved = Resolve-DnsName "animepahe.ru" -ErrorAction Stop
    Write-Host "  OK - Domain berhasil di-resolve: $($resolved[0].IPAddress)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Sekarang restart npm run dev dan coba lagi!" -ForegroundColor Cyan
} catch {
    Write-Host "  Domain masih terblokir via DNS." -ForegroundColor Red
    Write-Host "  Coba aktifkan VPN lalu ulangi." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Tekan Enter untuk keluar..."
Read-Host
