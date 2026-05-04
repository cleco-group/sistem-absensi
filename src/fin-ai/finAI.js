import fs from 'fs';
import path from 'path';
import { createJsonTranslator, createLanguageModel } from 'typechat';
import { validateFinancialReport } from './validator.js';
import { FIN_AI_SYSTEM_PROMPT, createUserPrompt } from './prompts.js';

// Konfigurasi model bahasa menggunakan environment variable
const model = createLanguageModel(process.env);

// Membaca skema TypeScript
const schemaPath = path.join(process.cwd(), 'src/fin-ai/FinancialSchema.ts');
const schema = fs.readFileSync(schemaPath, 'utf8');

/**
 * Translator TypeChat untuk FinancialReport
 */
const translator = createJsonTranslator(model, schema, 'FinancialReport');

/**
 * Fungsi utama FIN AI untuk memproses data keuangan
 * @param {any} inputData - Data mentah dari database atau input user
 * @param {number} maxRetries - Jumlah maksimal percobaan perbaikan (repair loop)
 */
export async function processFinancialData(inputData, maxRetries = 3) {
    console.log('FIN AI: Memulai pemrosesan data...');
    
    let currentPrompt = createUserPrompt(inputData);
    let attempt = 0;

    while (attempt < maxRetries) {
        attempt++;
        console.log(`Percobaan ${attempt}...`);

        // 1. Terjemahkan input ke JSON menggunakan TypeChat
        const response = await translator.translate(currentPrompt);

        if (!response.success) {
            console.error(`TypeChat Error: ${response.message}`);
            continue;
        }

        const report = response.data;

        // 2. Validasi tambahan menggunakan validator kustom (Business Logic & Anti-Hallucination)
        const validation = validateFinancialReport(report, inputData);

        if (validation.isValid) {
            console.log('FIN AI: Validasi berhasil.');
            return report;
        }

        console.warn('FIN AI: Validasi gagal. Memulai repair loop...');
        console.warn('Errors:', validation.errors.join(', '));

        // 3. Repair Loop: Berikan feedback ke LLM untuk memperbaiki outputnya
        currentPrompt += `\n\nKESALAHAN SEBELUMNYA:
${validation.errors.map(e => `- ${e}`).join('\n')}
Mohon perbaiki data di atas agar sesuai dengan aturan dan data sumber.`;
    }

    throw new Error(`FIN AI gagal menghasilkan laporan yang valid setelah ${maxRetries} percobaan.`);
}
