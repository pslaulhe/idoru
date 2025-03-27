const ExcelJS = require('exceljs');
const path = require('path');

class ExcelReport {
    constructor() {
        this.workbook = new ExcelJS.Workbook();
        this.sheets = {};
    }

    async initialize() {
        // Create sheets for each analysis step
        this.sheets.timing = this.workbook.addWorksheet('Timing Analysis');
        this.sheets.session = this.workbook.addWorksheet('Session Analysis');
        this.sheets.ema = this.workbook.addWorksheet('EMA Analysis');
        this.sheets.adx = this.workbook.addWorksheet('ADX Filter Analysis');
        this.sheets.sensitivity = this.workbook.addWorksheet('Sensitivity Test');
        this.sheets.consistency = this.workbook.addWorksheet('Consistency Test');
        this.sheets.summary = this.workbook.addWorksheet('Summary');

        // Initialize sheet headers
        await this.initializeSheetHeaders();
    }

    async initializeSheetHeaders() {
        // Timing Analysis sheet
        this.sheets.timing.columns = [
            { header: 'Timeframe', key: 'timeframe' },
            { header: 'Slow MA', key: 'slowMA' },
            { header: 'Fast MA', key: 'fastMA' },
            { header: 'SQN', key: 'sqn' },
            { header: 'Profit Factor', key: 'profitFactor' },
            { header: 'Max Drawdown', key: 'maxDrawdown' },
            { header: 'Total Trades', key: 'totalTrades' }
        ];

        // Session Analysis sheet
        this.sheets.session.columns = [
            { header: 'Start Time', key: 'startTime' },
            { header: 'End Time', key: 'endTime' },
            { header: 'SQN', key: 'sqn' },
            { header: 'Profit Factor', key: 'profitFactor' },
            { header: 'Total Trades', key: 'totalTrades' }
        ];

        // EMA Analysis sheet
        this.sheets.ema.columns = [
            { header: 'Slow MA', key: 'slowMA' },
            { header: 'Fast MA', key: 'fastMA' },
            { header: 'SQN', key: 'sqn' },
            { header: 'Profit Factor', key: 'profitFactor' },
            { header: 'Total Trades', key: 'totalTrades' }
        ];

        // ADX Filter Analysis sheet
        this.sheets.adx.columns = [
            { header: 'Period Max ADX', key: 'periodMaxADX' },
            { header: 'Band Size', key: 'bandSize' },
            { header: 'SQN', key: 'sqn' },
            { header: 'Profit Factor', key: 'profitFactor' },
            { header: 'Total Trades', key: 'totalTrades' }
        ];

        // Sensitivity Test sheet
        this.sheets.sensitivity.columns = [
            { header: 'Timeframe', key: 'timeframe' },
            { header: 'SQN', key: 'sqn' },
            { header: 'Profit Factor', key: 'profitFactor' },
            { header: 'Total Trades', key: 'totalTrades' }
        ];

        // Consistency Test sheet
        this.sheets.consistency.columns = [
            { header: 'Year', key: 'year' },
            { header: 'Return', key: 'return' },
            { header: 'Max Drawdown', key: 'maxDrawdown' },
            { header: 'Total Trades', key: 'totalTrades' }
        ];

        // Summary sheet
        this.sheets.summary.columns = [
            { header: 'Parameter', key: 'parameter' },
            { header: 'Value', key: 'value' },
            { header: 'Notes', key: 'notes' }
        ];
    }

    async addTimingAnalysis(results) {
        const { results: timingResults, summary } = results;
        
        // Add detailed results
        for (const result of timingResults) {
            await this.sheets.timing.addRows(result.results);
        }

        // Add summary to summary sheet
        await this.sheets.summary.addRows([
            { parameter: 'Recommended Timeframe', value: summary.recommendedTimeframe, notes: 'Based on highest average SQN' },
            { parameter: 'Average SQN', value: summary.averageSQN, notes: 'Across all parameter combinations' },
            { parameter: 'Max SQN', value: summary.maxSQN, notes: 'Best performing combination' }
        ]);
    }

    async addSessionAnalysis(results) {
        await this.sheets.session.addRows(results);
    }

    async addEMAAnalysis(results) {
        await this.sheets.ema.addRows(results);
    }

    async addADXAnalysis(results) {
        await this.sheets.adx.addRows(results);
    }

    async addSensitivityTest(results) {
        await this.sheets.sensitivity.addRows(results);
    }

    async addConsistencyTest(results) {
        await this.sheets.consistency.addRows(results);
    }

    async generateReport() {
        // Add some styling
        for (const sheet of Object.values(this.sheets)) {
            sheet.getRow(1).font = { bold: true };
            sheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
        }

        // Save the workbook
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `evaluation_report_${timestamp}.xlsx`;
        const filepath = path.join(process.cwd(), 'reports', filename);
        
        await this.workbook.xlsx.writeFile(filepath);
        return filepath;
    }
}

module.exports = { ExcelReport }; 