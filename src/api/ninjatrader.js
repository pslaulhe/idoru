const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class NinjaTraderAPI {
    constructor() {
        this.connected = false;
        this.ninjatraderPath = process.env.NINJATRADER_PATH || 'C:\\Program Files\\NinjaTrader 8';
        this.strategiesPath = path.join(this.ninjatraderPath, 'bin', 'Custom', 'Strategies');
    }

    async connect() {
        if (this.connected) return;

        try {
            // Check if NinjaTrader is running
            await this.checkNinjaTraderRunning();
            
            // Initialize connection
            await this.initializeConnection();
            
            this.connected = true;
            console.log('Successfully connected to NinjaTrader');
        } catch (error) {
            console.error('Failed to connect to NinjaTrader:', error);
            throw error;
        }
    }

    async disconnect() {
        if (!this.connected) return;

        try {
            // Clean up any temporary files
            await this.cleanup();
            
            this.connected = false;
            console.log('Disconnected from NinjaTrader');
        } catch (error) {
            console.error('Error disconnecting from NinjaTrader:', error);
            throw error;
        }
    }

    async checkNinjaTraderRunning() {
        return new Promise((resolve, reject) => {
            exec('tasklist /FI "IMAGENAME eq NinjaTrader.exe"', (error, stdout) => {
                if (error) {
                    reject(new Error('Failed to check NinjaTrader status'));
                    return;
                }

                if (!stdout.includes('NinjaTrader.exe')) {
                    reject(new Error('NinjaTrader is not running'));
                    return;
                }

                resolve();
            });
        });
    }

    async initializeConnection() {
        // Create necessary directories if they don't exist
        await this.ensureDirectories();
        
        // Initialize any required NinjaTrader settings
        await this.initializeSettings();
    }

    async ensureDirectories() {
        const directories = [
            this.strategiesPath,
            path.join(this.ninjatraderPath, 'bin', 'Custom', 'Indicators'),
            path.join(this.ninjatraderPath, 'bin', 'Custom', 'AddOns')
        ];

        for (const dir of directories) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
            }
        }
    }

    async initializeSettings() {
        // Initialize any required NinjaTrader settings
        // This could include setting up data feeds, account connections, etc.
    }

    async runBacktest(strategy, parameters) {
        if (!this.connected) {
            throw new Error('Not connected to NinjaTrader');
        }

        try {
            // Prepare the backtest configuration
            const config = this.prepareBacktestConfig(strategy, parameters);
            
            // Execute the backtest
            const results = await this.executeBacktest(config);
            
            // Process and return the results
            return this.processBacktestResults(results);
        } catch (error) {
            console.error('Error running backtest:', error);
            throw error;
        }
    }

    prepareBacktestConfig(strategy, parameters) {
        return {
            strategy: strategy.name,
            instrument: parameters.instrument || 'ES',
            timeframe: parameters.timeframe || 25,
            startDate: parameters.startDate || '2001-01-01',
            endDate: parameters.endDate || '2007-12-31',
            parameters: {
                ...parameters,
                // Add any strategy-specific parameters
            }
        };
    }

    async executeBacktest(config) {
        // This would typically involve:
        // 1. Creating a temporary strategy file with the parameters
        // 2. Running the NinjaTrader backtest command
        // 3. Collecting the results
        
        // For now, we'll return a mock result
        return {
            trades: [
                {
                    entryTime: '2023-01-01 10:00:00',
                    exitTime: '2023-01-01 10:30:00',
                    entryPrice: 4000,
                    exitPrice: 4010,
                    profit: 10,
                    adxFilter: true
                }
                // ... more trades
            ],
            metrics: {
                totalTrades: 100,
                winningTrades: 60,
                losingTrades: 40,
                grossProfit: 1000,
                grossLoss: 500,
                netProfit: 500,
                maxDrawdown: 200
            }
        };
    }

    processBacktestResults(results) {
        return {
            trades: results.trades.map(trade => ({
                ...trade,
                profit: trade.exitPrice - trade.entryPrice
            })),
            metrics: results.metrics
        };
    }

    async cleanup() {
        // Clean up any temporary files created during the session
    }
}

module.exports = { NinjaTraderAPI }; 