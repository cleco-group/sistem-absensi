/**
 * Definisi skema finansial untuk FIN AI.
 * Skema ini bertindak sebagai kontrak yang memaksa LLM untuk menghasilkan
 * output yang terstruktur dan mematuhi aturan perhitungan OPEX.
 */

export interface FinancialReport {
    /**
     * Ringkasan laporan finansial
     */
    summary: string;
    
    /**
     * Data perhitungan OPEX (Operating Expenses)
     */
    opex_data: OPEXCalculation;
    
    /**
     * Sumber data yang digunakan untuk mengisi angka-angka di bawah ini.
     * Harus berupa referensi ke data input yang diberikan.
     */
    data_sources: string[];
}

export interface OPEXCalculation {
    /**
     * Beban Pokok (Cost of Goods Sold / Direct Costs).
     * Contoh: Gaji pokok karyawan, biaya bahan baku langsung.
     */
    beban_pokok: number;
    
    /**
     * Biaya Variabel (Variable Costs).
     * Contoh: Bonus rajin, lembur, biaya utilitas yang berubah-ubah.
     */
    biaya_variabel: number;
    
    /**
     * Total OPEX.
     * ATURAN MUTLAK: opex = beban_pokok + biaya_variabel.
     * AI dilarang keras menghalusinasi angka ini; harus hasil penjumlahan manual.
     */
    opex: number;
    
    /**
     * Penjelasan rincian dari mana angka-angka di atas berasal berdasarkan data input.
     */
    breakdown: {
        beban_pokok_items: FinancialItem[];
        biaya_variabel_items: FinancialItem[];
    };
}

export interface FinancialItem {
    name: string;
    amount: number;
    description: string;
}
