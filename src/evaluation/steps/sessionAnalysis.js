const moment = require('moment');
const _ = require('lodash');

class SessionAnalysis {
    constructor(api, strategy) {
        this.api = api;
        this.strategy = strategy;
    }

    async run() {
        const startTimes = this.generateTimeRange('09:00', '12:00', 25);
        const endTimes = this.generateTimeRange('17:00', '19:15', 25);
        
        const results = [];
        
        for (const startTime of startTimes) {
            for (const endTime of endTimes) {
                const performance = await this.runBacktest(startTime, endTime);
                results.push({
                    startTime,
                    endTime,
                    ...performance
                });
            }
        }

        return this.analyzeResults(results);
    }

    generateTimeRange(start, end, incrementMinutes) {
        const times = [];
        const startMoment = moment(start, 'HH:mm');
        const endMoment = moment(end, 'HH:mm');
        
        while (startMoment.isSameOrBefore(endMoment)) {
            times.push(startMoment.format('HH:mm'));
            startMoment.add(incrementMinutes, 'minutes');
        }
        
        return times;
    }

    async runBacktest(startTime, endTime) {
        const parameters = {
            sessionStart: startTime,
            sessionEnd: endTime
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
        const startTimes = [...new Set(results.map(r => r.startTime))];
        const endTimes = [...new Set(results.map(r => r.endTime))];
        
        const performanceMatrix = startTimes.map(start => {
            return endTimes.map(end => {
                const result = results.find(r => r.startTime === start && r.endTime === end);
                return result ? result.sqn : null;
            });
        });

        // Find the best performing combination
        const bestResult = _.maxBy(results, 'sqn');

        return {
            results,
            performanceMatrix: {
                startTimes,
                endTimes,
                matrix: performanceMatrix
            },
            summary: {
                recommendedStartTime: bestResult.startTime,
                recommendedEndTime: bestResult.endTime,
                bestSQN: bestResult.sqn,
                bestProfitFactor: bestResult.profitFactor,
                totalTrades: bestResult.totalTrades
            }
        };
    }
}

module.exports = { SessionAnalysis }; 