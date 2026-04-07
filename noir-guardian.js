const https = require('https');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://www.noir.biz.id';
const LOG_FILE = path.join(__dirname, 'noir-monitor.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, entry);
    console.log(entry.trim());
}

function checkSiteHealth() {
    log('🔍 Memeriksa status Noir AI...');
    
    https.get(TARGET_URL, (res) => {
        if (res.statusCode === 200) {
            log('✅ Noir AI ONLINE dan Sehat.');
        } else {
            log(`⚠️ PERINGATAN: Noir AI merespons dengan status ${res.statusCode}.`);
            // Di sini bisa ditambahkan logika restart server jika diperlukan
        }
    }).on('error', (e) => {
        log(`❌ KRITIS: Noir AI TIDAK BISA DIAKSES - ${e.message}`);
        // Logika emergency: Coba restart PM2 atau kirim notifikasi ke Bos
    });
}

// Jalankan pengecekan
checkSiteHealth();
