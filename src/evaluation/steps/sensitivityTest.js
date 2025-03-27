const _ = require('lodash');

class SensitivityTest {
    constructor(api, strategy) {
        this.api = api;
        this.strategy = strategy;
    }

    async run() {
        // Get the best parameters from previous analysis
        const bestParameters = await this.getBestParameters();
        
        // Test different timeframes around the optimal one
        const timeframes = this.generateTimeframes(
            bestParameters.timeframe - 5,
            bestParameters.timeframe + 5,
            1
        );
        
        const results = [];
        
        for (const timeframe of timeframes) {
            const performance = await this.runBacktest(timeframe, bestParameters);
            results.push({
                timeframe,
                ...performance
            });
        }

        return this.analyzeResults(results, bestParameters);
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

    generateTimeframes(start, end, increment) {
        const timeframes = [];
        for (let i = start; i <= end; i += increment) {
            timeframes.push(i);
        }
        return timeframes;
    }

    async runBacktest(timeframe, parameters) {
        const testParameters = {
            ...parameters,
            timeframe
        };

        const results = await this.api.runBacktest(this.strategy, testParameters);
        return {
            sqn: this.calculateSQN(results),
            profitFactor: this.calculateProfitFactor(results),
            totalTrades: results.trades.length,
            averageProfitPerTrade: this.calculateAverageProfitPerTrade(results)
        };
    }

    calculateSQN(results) {
        const returns = results.trades.map(trade => trade.profit);
        const avgReturn = _.mean(returns);
        const stdDev = _.std(returns);
        return avgReturn / stdDev;
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

    calculateAverageProfitPerTrade(results) {
        const totalProfit = results.trades.reduce((sum, trade) => sum + trade.profit, 0);
        return totalProfit / results.trades.length;
    }

    analyzeResults(results, bestParameters) {
        // Calculate performance degradation
        const optimalResult = results.find(r => r.timeframe === bestParameters.timeframe);
        const performanceDegradation = results.map(result => ({
            timeframe: result.timeframe,
            sqnDegradation: ((optimalResult.sqn - result.sqn) / optimalResult.sqn) * 100,
            profitFactorDegradation: ((optimalResult.profitFactor - result.profitFactor) / optimalResult.profitFactor) * 100,
            tradesDegradation: ((optimalResult.totalTrades - result.totalTrades) / optimalResult.totalTrades) * 100
        }));

        // Find acceptable ranges (where degradation is less than 10%)
        const acceptableRanges = this.findAcceptableRanges(performanceDegradation);

        return {
            results,
            performanceDegradation,
            summary: {
                optimalTimeframe: bestParameters.timeframe,
                optimalSQN: optimalResult.sqn,
                optimalProfitFactor: optimalResult.profitFactor,
                optimalTrades: optimalResult.totalTrades,
                acceptableRanges,
                sensitivityScore: this.calculateSensitivityScore(performanceDegradation)
            }
        };
    }

    findAcceptableRanges(performanceDegradation) {
        const acceptableResults = performanceDegradation.filter(r => 
            r.sqnDegradation < 10 && 
            r.profitFactorDegradation < 10 && 
            r.tradesDegradation < 10
        );

        return {
            minTimeframe: _.min(acceptableResults.map(r => r.timeframe)),
            maxTimeframe: _.max(acceptableResults.map(r => r.timeframe)),
            totalAcceptableCombinations: acceptableResults.length
        };
    }

    calculateSensitivityScore(performanceDegradation) {
        // Calculate average degradation across all metrics
        const avgDegradation = performanceDegradation.reduce((sum, r) => 
            sum + (r.sqnDegradation + r.profitFactorDegradation + r.tradesDegradation) / 3, 0
        ) / performanceDegradation.length;

        // Lower score means less sensitive
        return 100 - avgDegradation;
    }
}

module.exports = { SensitivityTest }; 