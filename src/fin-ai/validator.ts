import { FinancialReport } from './FinancialSchema';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Memvalidasi objek FinancialReport terhadap aturan bisnis dan integritas data.
 */
export function validateFinancialReport(report: FinancialReport, sourceData: any): ValidationResult {
    const errors: string[] = [];
    const { opex_data } = report;

    // 1. Validasi Aritmatika OPEX
    const expectedOpex = opex_data.beban_pokok + opex_data.biaya_variabel;
    // Gunakan toleransi kecil untuk floating point math jika diperlukan, tapi di sini kita asumsikan integer/fixed decimal
    if (Math.abs(opex_data.opex - expectedOpex) > 0.01) {
        errors.push(`Kesalahan Aritmatika: OPEX (${opex_data.opex}) tidak sama dengan Beban Pokok (${opex_data.beban_pokok}) + Biaya Variabel (${opex_data.biaya_variabel}). Seharusnya ${expectedOpex}.`);
    }

    // 2. Validasi Sumber Data (Mencegah Halusinasi)
    // Kita kumpulkan semua angka unik dari source data untuk pengecekan sederhana
    const sourceNumbers = extractNumbers(sourceData);
    const reportItems = [
        ...opex_data.breakdown.beban_pokok_items,
        ...opex_data.breakdown.biaya_variabel_items
    ];

    for (const item of reportItems) {
        if (item.amount !== 0 && !sourceNumbers.has(item.amount)) {
            // Catatan: Dalam skenario nyata, validasi ini mungkin lebih kompleks (misal: penjumlahan beberapa angka)
            // Namun untuk instruksi ini, kita pastikan angka dasar berasal dari input.
            errors.push(`Potensi Halusinasi: Angka ${item.amount} untuk '${item.name}' tidak ditemukan di data sumber.`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Helper untuk mengekstrak semua angka dari objek data sumber secara rekursif.
 */
function extractNumbers(obj: any, found: Set<number> = new Set()): Set<number> {
    if (typeof obj === 'number') {
        found.add(obj);
    } else if (Array.isArray(obj)) {
        obj.forEach(item => extractNumbers(item, found));
    } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(val => extractNumbers(val, found));
    }
    return found;
}
