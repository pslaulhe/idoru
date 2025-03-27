const _ = require('lodash');

class EMAAnalysis {
    constructor(api, strategy) {
        this.api = api;
        this.strategy = strategy;
    }

    async run() {
        const slowMA = this.generateParameterRange(50, 350, 10);
        const fastMA = this.generateParameterRange(2, 35, 1);
        
        const results = [];
        
        for (const slow of slowMA) {
            for (const fast of fastMA) {
                const performance = await this.runBacktest(slow, fast);
                results.push({
                    slowMA: slow,
                    fastMA: fast,
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

    async runBacktest(slowMA, fastMA) {
        const parameters = {
            slowMA,
            fastMA
        };

        const results = await this.api.runBacktest(this.strategy, parameters);
        return {
            sqn: this.calculateSQN(results),
            profitFactor: this.calculateProfitFactor(results),
            totalTrades: results.trades.length
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
        const slowMAs = [...new Set(results.map(r => r.slowMA))];
        const fastMAs = [...new Set(results.map(r => r.fastMA))];
        
        const performanceMatrix = slowMAs.map(slow => {
            return fastMAs.map(fast => {
                const result = results.find(r => r.slowMA === slow && r.fastMA === fast);
                return result ? result.sqn : null;
            });
        });

        // Find the best performing combination
        const bestResult = _.maxBy(results, 'sqn');

        // Find robust parameter ranges
        const robustRanges = this.findRobustRanges(results);

        return {
            results,
            performanceMatrix: {
                slowMAs,
                fastMAs,
                matrix: performanceMatrix
            },
            summary: {
                recommendedSlowMA: bestResult.slowMA,
                recommendedFastMA: bestResult.fastMA,
                bestSQN: bestResult.sqn,
                bestProfitFactor: bestResult.profitFactor,
                totalTrades: bestResult.totalTrades,
                robustRanges
            }
        };
    }

    findRobustRanges(results) {
        // Sort results by SQN
        const sortedResults = [...results].sort((a, b) => b.sqn - a.sqn);
        
        // Take top 20% of results
        const topResults = sortedResults.slice(0, Math.floor(sortedResults.length * 0.2));
        
        return {
            slowMA: {
                min: _.min(topResults.map(r => r.slowMA)),
                max: _.max(topResults.map(r => r.slowMA))
            },
            fastMA: {
                min: _.min(topResults.map(r => r.fastMA)),
                max: _.max(topResults.map(r => r.fastMA))
            }
        };
    }
}

module.exports = { EMAAnalysis }; 