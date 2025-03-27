const moment = require('moment');
const _ = require('lodash');

class TimingAnalysis {
    constructor(api, strategy) {
        this.api = api;
        this.strategy = strategy;
    }

    async run() {
        const timeframes = this.generateTimeframes(10, 30, 5); // 10 to 30 minutes in 5-minute increments
        const results = [];

        for (const timeframe of timeframes) {
            const optimizationResults = await this.optimizeParameters(timeframe);
            results.push({
                timeframe,
                ...optimizationResults
            });
        }

        return this.analyzeResults(results);
    }

    generateTimeframes(start, end, increment) {
        const timeframes = [];
        for (let i = start; i <= end; i += increment) {
            timeframes.push(i);
        }
        return timeframes;
    }

    async optimizeParameters(timeframe) {
        const slowMA = this.generateParameterRange(50, 300, 50);
        const fastMA = this.generateParameterRange(5, 35, 5);
        
        const results = [];
        
        for (const slow of slowMA) {
            for (const fast of fastMA) {
                const performance = await this.runBacktest(timeframe, slow, fast);
                results.push({
                    slowMA,
                    fastMA,
                    ...performance
                });
            }
        }

        return this.calculateStatistics(results);
    }

    generateParameterRange(start, end, increment) {
        const range = [];
        for (let i = start; i <= end; i += increment) {
            range.push(i);
        }
        return range;
    }

    async runBacktest(timeframe, slowMA, fastMA) {
        const parameters = {
            timeframe,
            slowMA,
            fastMA
        };

        const results = await this.api.runBacktest(this.strategy, parameters);
        return {
            sqn: this.calculateSQN(results),
            profitFactor: this.calculateProfitFactor(results),
            maxDrawdown: this.calculateMaxDrawdown(results),
            totalTrades: results.trades.length
        };
    }

    calculateSQN(results) {
        // Implementation of SQN calculation
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

    calculateStatistics(results) {
        const sqnValues = results.map(r => r.sqn);
        const profitFactorValues = results.map(r => r.profitFactor);

        return {
            averageSQN: _.mean(sqnValues),
            maxSQN: _.max(sqnValues),
            averageProfitFactor: _.mean(profitFactorValues),
            maxProfitFactor: _.max(profitFactorValues),
            parameterCombinations: results.length
        };
    }

    analyzeResults(results) {
        const bestTimeframe = _.maxBy(results, 'averageSQN');
        
        return {
            results,
            bestTimeframe,
            summary: {
                recommendedTimeframe: bestTimeframe.timeframe,
                averageSQN: bestTimeframe.averageSQN,
                maxSQN: bestTimeframe.maxSQN,
                averageProfitFactor: bestTimeframe.averageProfitFactor,
                maxProfitFactor: bestTimeframe.maxProfitFactor
            }
        };
    }
}

module.exports = { TimingAnalysis }; 