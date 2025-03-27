const { NinjaTraderAPI } = require('ninjatrader');
const { TimingAnalysis } = require('./steps/timingAnalysis');
const { SessionAnalysis } = require('./steps/sessionAnalysis');
const { EMAAnalysis } = require('./steps/emaAnalysis');
const { ADXFilterAnalysis } = require('./steps/adxFilterAnalysis');
const { SensitivityTest } = require('./steps/sensitivityTest');
const { ConsistencyTest } = require('./steps/consistencyTest');
const { ExcelReport } = require('./utils/excelReport');

class EvaluationRunner {
    constructor(config) {
        this.config = config;
        this.api = new NinjaTraderAPI();
        this.excelReport = new ExcelReport();
    }

    async initialize() {
        await this.api.connect();
        await this.excelReport.initialize();
    }

    async runEvaluation(strategy) {
        try {
            await this.initialize();

            // Step 1: Timing Analysis
            const timingAnalysis = new TimingAnalysis(this.api, strategy);
            const timingResults = await timingAnalysis.run();
            await this.excelReport.addTimingAnalysis(timingResults);

            // Step 2: Session Analysis
            const sessionAnalysis = new SessionAnalysis(this.api, strategy);
            const sessionResults = await sessionAnalysis.run();
            await this.excelReport.addSessionAnalysis(sessionResults);

            // Step 3: EMA Analysis
            const emaAnalysis = new EMAAnalysis(this.api, strategy);
            const emaResults = await emaAnalysis.run();
            await this.excelReport.addEMAAnalysis(emaResults);

            // Step 4: ADX Filter Analysis
            const adxAnalysis = new ADXFilterAnalysis(this.api, strategy);
            const adxResults = await adxAnalysis.run();
            await this.excelReport.addADXAnalysis(adxResults);

            // Step 5: Sensitivity Test
            const sensitivityTest = new SensitivityTest(this.api, strategy);
            const sensitivityResults = await sensitivityTest.run();
            await this.excelReport.addSensitivityTest(sensitivityResults);

            // Step 6: Consistency Test
            const consistencyTest = new ConsistencyTest(this.api, strategy);
            const consistencyResults = await consistencyTest.run();
            await this.excelReport.addConsistencyTest(consistencyResults);

            // Generate final report
            await this.excelReport.generateReport();

            return {
                timingResults,
                sessionResults,
                emaResults,
                adxResults,
                sensitivityResults,
                consistencyResults
            };
        } catch (error) {
            console.error('Error during evaluation:', error);
            throw error;
        } finally {
            await this.api.disconnect();
        }
    }
}

// Example usage
const config = {
    evaluationPeriod: {
        start: '2001-01-01',
        end: '2007-12-31'
    },
    instruments: {
        usa: ['ES', 'TF', 'EMD', 'YM', 'NQ'],
        eu: ['FDAX', 'FESX', 'CAC', 'FIBEX', 'FTI']
    },
    sessionTemplates: {
        usa: { start: '15:30', end: '22:15' },
        eu: { start: '09:00', end: '19:15' }
    },
    costs: {
        FESX: 12,
        FDAX: 16,
        FTI: 16,
        CAC: 15,
        FIBEX: 22,
        ES: 12,
        YM: 12,
        NQ: 12,
        TF: 16,
        EMD: 18
    }
};

module.exports = { EvaluationRunner, config }; 