#region Using declarations
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using System.Xml.Serialization;
using NinjaTrader.Cbi;
using NinjaTrader.Gui;
using NinjaTrader.Gui.Chart;
using NinjaTrader.Gui.SuperDom;
using NinjaTrader.Gui.Tools;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript;
using NinjaTrader.Core.FloatingPoint;
using NinjaTrader.NinjaScript.Indicators;
using NinjaTrader.NinjaScript.DrawingTools;
#endregion

namespace NinjaTrader.NinjaScript.Strategies
{
    public class SimpleMovingAverageCrossover : Strategy
    {
        private SMA fastMA;
        private SMA slowMA;

        [NinjaScriptProperty]
        [Range(10, 200)]
        [Display(Name = "Período MA Lenta", Order = 1, GroupName = "Parámetros")]
        public int SlowMAPeriod { get; set; } = 30; // Período configurable

        [NinjaScriptProperty]
        [Display(Name = "Solo en largo", Order = 1, GroupName = "Parámetros")]
        public bool OnlyLongTrades { get; set; } = false; // Ignora los cruces bajistas

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Name = "Cruce de Medias Simple";
                Calculate = Calculate.OnBarClose;
                EntriesPerDirection = 1;
                EntryHandling = EntryHandling.AllEntries;
                IsExitOnSessionCloseStrategy = true;
                ExitOnSessionCloseSeconds = 30;
                DefaultQuantity = 1;
            }
            else if (State == State.Configure)
            {
                fastMA = SMA(SlowMAPeriod / 2);  // MA rápida = MA lenta / 2
                slowMA = SMA(SlowMAPeriod);

                // Set the color of the fast moving average to blue
                fastMA.Plots[0].Brush = Brushes.Blue;
                
                // Set the color of the slow moving average to red
                slowMA.Plots[0].Brush = Brushes.Red;
                
                AddChartIndicator(fastMA);
                AddChartIndicator(slowMA);
            }
        }

        protected override void OnBarUpdate()
        {
            if (CurrentBar < SlowMAPeriod) return;

            // Compra cuando la media rápida cruza por encima de la lenta
            if (CrossAbove(fastMA, slowMA, 1))
                EnterLong("Compra");

            // Venta cuando la media rápida cruza por debajo de la lenta
            else if (CrossBelow(fastMA, slowMA, 1))
            {
                ExitLong();

                if (!OnlyLongTrades)
                {
                    EnterShort("Venta");
                }
            }
        }
    }
}
