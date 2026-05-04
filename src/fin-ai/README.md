# FIN AI - TypeChat Implementation

Modul ini mengimplementasikan asisten keuangan cerdas (FIN AI) menggunakan pendekatan **Microsoft TypeChat**. Fokus utama modul ini adalah perhitungan **OPEX (Operating Expenses)** yang akurat dan bebas dari halusinasi angka.

## Arsitektur

Implementasi ini menggunakan skema TypeScript sebagai kontrak antara kode aplikasi dan Model Bahasa Besar (LLM).

### Komponen Utama:

1.  **`FinancialSchema.ts`**: Definisi interface TypeScript yang memaksa LLM untuk menghasilkan output terstruktur. Skema ini mendefinisikan bahwa `opex` harus merupakan hasil penjumlahan dari `beban_pokok` dan `biaya_variabel`.
2.  **`finAI.js`**: Modul integrasi yang menggunakan TypeChat untuk menerjemahkan input teks/data ke dalam objek JSON yang valid sesuai skema.
3.  **`validator.ts`**: Lapisan validasi tambahan yang melakukan pengecekan aritmatika (`opex === beban_pokok + biaya_variabel`) dan pengecekan integritas data untuk memastikan tidak ada angka yang dihalusinasi oleh AI.
4.  **`prompts.ts`**: Kumpulan instruksi sistem yang memperkuat aturan bisnis dan batasan operasional AI.

## Aturan Bisnis OPEX

Dalam sistem ini, OPEX dihitung dengan rumus:
**OPEX = Beban Pokok + Biaya Variabel**

*   **Beban Pokok**: Biaya tetap seperti Gaji Pokok.
*   **Biaya Variabel**: Biaya fluktuatif seperti Bonus Rajin, Potongan Telat, atau Biaya Operasional lainnya.

## Cara Kerja (Repair Loop)

Jika AI menghasilkan output yang tidak valid (misalnya salah hitung atau menggunakan angka yang tidak ada di input), sistem akan:
1.  Mendeteksi kesalahan melalui `validator.ts`.
2.  Mengirimkan kembali pesan kesalahan tersebut ke AI.
3.  Meminta AI untuk memperbaiki outputnya (maksimal 3 kali percobaan).

## Persyaratan Environment

Pastikan variabel lingkungan berikut tersedia:
*   `OPENAI_API_KEY`: API Key untuk mengakses model OpenAI.
*   `OPENAI_MODEL`: (Opsional) Model yang digunakan, defaultnya adalah `gpt-4` atau yang dikonfigurasi di TypeChat.

## Penggunaan

```javascript
import { processFinancialData } from './src/fin-ai/finAI.js';

const dataKaryawan = [
  { name: "Budi", gaji_pokok: 3000000, bonus_rajin: 50000 },
  // ... data lainnya
];

const report = await processFinancialData(dataKaryawan);
console.log(report.opex_data.opex);
```
