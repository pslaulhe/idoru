const _ = require('lodash');

class ADXFilterAnalysis {
    constructor(api, strategy) {
        this.api = api;
        this.strategy = strategy;
    }

    async run() {
        const periodMaxADX = this.generateParameterRange(50, 800, 50);
        const bandSize = this.generateParameterRange(0.3, 1, 0.05);
        
        const results = [];
        
        for (const period of periodMaxADX) {
            for (const band of bandSize) {
                const performance = await this.runBacktest(period, band);
                results.push({
                    periodMaxADX: period,
                    bandSize: band,
                    ...performance
                });
            }
        }

        return this.analyzeResults(results);
    }

    generateParameterRange(start, end, increment) {
        const range = [];
        for (let i = start; i <= end; i += increment) {
            range.push(i);
        }
        return range;
    }

    async runBacktest(periodMaxADX, bandSize) {
        const parameters = {
            periodMaxADX,
            bandSize
        };

        const results = await this.api.runBacktest(this.strategy, parameters);
        return {
            sqn: this.calculateSQN(results),
            profitFactor: this.calculateProfitFactor(results),
            totalTrades: results.trades.length,
            filteredTrades: results.trades.filter(trade => trade.adxFilter).length
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

    analyzeResults(results) {
        // Create a 3D data structure for visualization
        const periods = [...new Set(results.map(r => r.periodMaxADX))];
        const bands = [...new Set(results.map(r => r.bandSize))];
        
        const performanceMatrix = periods.map(period => {
            return bands.map(band => {
                const result = results.find(r => r.periodMaxADX === period && r.bandSize === band);
                return result ? result.sqn : null;
            });
        });

        // Find the best performing combination
        const bestResult = _.maxBy(results, 'sqn');

        // Find robust parameter ranges
        const robustRanges = this.findRobustRanges(results);

        // Calculate filter effectiveness
        const filterEffectiveness = this.calculateFilterEffectiveness(results);

        return {
            results,
            performanceMatrix: {
                periods,
                bands,
                matrix: performanceMatrix
            },
            summary: {
                recommendedPeriodMaxADX: bestResult.periodMaxADX,
                recommendedBandSize: bestResult.bandSize,
                bestSQN: bestResult.sqn,
                bestProfitFactor: bestResult.profitFactor,
                totalTrades: bestResult.totalTrades,
                filteredTrades: bestResult.filteredTrades,
                robustRanges,
                filterEffectiveness
            }
        };
    }

    findRobustRanges(results) {
        // Sort results by SQN
        const sortedResults = [...results].sort((a, b) => b.sqn - a.sqn);
        
        // Take top 20% of results
        const topResults = sortedResults.slice(0, Math.floor(sortedResults.length * 0.2));
        
        return {
            periodMaxADX: {
                min: _.min(topResults.map(r => r.periodMaxADX)),
                max: _.max(topResults.map(r => r.periodMaxADX))
            },
            bandSize: {
                min: _.min(topResults.map(r => r.bandSize)),
                max: _.max(topResults.map(r => r.bandSize))
            }
        };
    }

    calculateFilterEffectiveness(results) {
        const bestResult = _.maxBy(results, 'sqn');
        const filteredTrades = bestResult.filteredTrades;
        const totalTrades = bestResult.totalTrades;
        
        return {
            percentage: (filteredTrades / totalTrades) * 100,
            filteredTrades,
            totalTrades
        };
    }
}

module.exports = { ADXFilterAnalysis }; 