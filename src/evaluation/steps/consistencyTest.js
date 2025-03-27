const moment = require('moment');
const _ = require('lodash');

class ConsistencyTest {
    constructor(api, strategy) {
        this.api = api;
        this.strategy = strategy;
    }

    async run() {
        // Get the best parameters from previous analysis
        const bestParameters = await this.getBestParameters();
        
        // Generate yearly periods from 2001 to 2007
        const years = this.generateYearlyPeriods(2001, 2007);
        
        const results = [];
        
        for (const year of years) {
            const performance = await this.runBacktest(year, bestParameters);
            results.push({
                year: year.year,
                ...performance
            });
        }

        return this.analyzeResults(results);
    }

    async getBestParameters() {
        // This would typically come from the previous analysis steps
        // For now, we'll use default values
        return {
            timeframe: 25,
            slowMA: 270,
            fastMA: 10,
            periodMaxADX: 150,
            bandSize: 0.5
        };
    }

    generateYearlyPeriods(startYear, endYear) {
        const periods = [];
        for (let year = startYear; year <= endYear; year++) {
            periods.push({
                year,
                start: moment(`${year}-01-01`).format('YYYY-MM-DD'),
                end: moment(`${year}-12-31`).format('YYYY-MM-DD')
            });
        }
        return periods;
    }

    async runBacktest(period, parameters) {
        const testParameters = {
            ...parameters,
            startDate: period.start,
            endDate: period.end
        };

        const results = await this.api.runBacktest(this.strategy, testParameters);
        return {
            return: this.calculateReturn(results),
            maxDrawdown: this.calculateMaxDrawdown(results),
            totalTrades: results.trades.length,
            winRate: this.calculateWinRate(results),
            profitFactor: this.calculateProfitFactor(results)
        };
    }

    calculateReturn(results) {
        const totalProfit = results.trades.reduce((sum, trade) => sum + trade.profit, 0);
        return totalProfit;
    }

    calculateMaxDrawdown(results) {
        let peak = 0;
        let maxDrawdown = 0;
        let currentEquity = 0;

        for (const trade of results.trades) {
            currentEquity += trade.profit;
            peak = Math.max(peak, currentEquity);
            maxDrawdown = Math.max(maxDrawdown, peak - currentEquity);
        }

        return maxDrawdown;
    }

    calculateWinRate(results) {
        const winningTrades = results.trades.filter(trade => trade.profit > 0).length;
        return (winningTrades / results.trades.length) * 100;
    }

    calculateProfitFactor(results) {
        const grossProfit = results.trades
            .filter(trade => trade.profit > 0)
            .reduce((sum, trade) => sum + trade.profit, 0);
        
        const grossLoss = Math.abs(results.trades
            .filter(trade => trade.profit < 0)
            .reduce((sum, trade) => sum + trade.profit, 0));

        return grossLoss === 0 ? Infinity : grossProfit / grossLoss;
    }

    analyzeResults(results) {
        // Calculate yearly statistics
        const yearlyStats = this.calculateYearlyStats(results);

        // Calculate consistency metrics
        const consistencyMetrics = this.calculateConsistencyMetrics(results);

        // Identify any problematic years
        const problematicYears = this.identifyProblematicYears(results);

        return {
            results,
            yearlyStats,
            summary: {
                averageReturn: _.mean(results.map(r => r.return)),
                averageDrawdown: _.mean(results.map(r => r.maxDrawdown)),
                averageWinRate: _.mean(results.map(r => r.winRate)),
                averageProfitFactor: _.mean(results.map(r => r.profitFactor)),
                consistencyScore: consistencyMetrics.score,
                returnConsistency: consistencyMetrics.returnConsistency,
                drawdownConsistency: consistencyMetrics.drawdownConsistency,
                problematicYears
            }
        };
    }

    calculateYearlyStats(results) {
        return {
            returns: results.map(r => r.return),
            drawdowns: results.map(r => r.maxDrawdown),
            winRates: results.map(r => r.winRate),
            profitFactors: results.map(r => r.profitFactor),
            trades: results.map(r => r.totalTrades)
        };
    }

    calculateConsistencyMetrics(results) {
        // Calculate standard deviation of returns
        const returns = results.map(r => r.return);
        const returnStdDev = _.std(returns);
        const returnMean = _.mean(returns);
        const returnConsistency = (returnMean / returnStdDev) * 100;

        // Calculate standard deviation of drawdowns
        const drawdowns = results.map(r => r.maxDrawdown);
        const drawdownStdDev = _.std(drawdowns);
        const drawdownMean = _.mean(drawdowns);
        const drawdownConsistency = (drawdownMean / drawdownStdDev) * 100;

        // Overall consistency score (higher is better)
        const score = (returnConsistency + drawdownConsistency) / 2;

        return {
            score,
            returnConsistency,
            drawdownConsistency
        };
    }

    identifyProblematicYears(results) {
        const problematicYears = [];
        
        // Calculate thresholds
        const returnThreshold = _.mean(results.map(r => r.return)) * 0.5; // 50% below average
        const drawdownThreshold = _.mean(results.map(r => r.maxDrawdown)) * 1.5; // 50% above average
        const winRateThreshold = _.mean(results.map(r => r.winRate)) * 0.8; // 20% below average

        // Identify problematic years
        results.forEach(result => {
            const problems = [];
            
            if (result.return < returnThreshold) problems.push('Low return');
            if (result.maxDrawdown > drawdownThreshold) problems.push('High drawdown');
            if (result.winRate < winRateThreshold) problems.push('Low win rate');
            
            if (problems.length > 0) {
                problematicYears.push({
                    year: result.year,
                    problems
                });
            }
        });

        return problematicYears;
    }
}

module.exports = { ConsistencyTest }; 