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

//This namespace holds Strategies in this folder and is required. Do not change it. 
namespace NinjaTrader.NinjaScript.Strategies
{
	public class Practica1 : Strategy
	{
		private MAX MAX1;
		private MIN MIN1;		
		//private EMA EMA1;


		protected override void OnStateChange()
		{
			if (State == State.SetDefaults)
			{
				Description									= @"Creación de un sistema de trading";
				Name										= "MixManCrossover";
				Calculate									= Calculate.OnBarClose;
				EntriesPerDirection							= 1;
				EntryHandling								= EntryHandling.AllEntries;
				IsExitOnSessionCloseStrategy				= true;
				ExitOnSessionCloseSeconds					= 30;
				IsFillLimitOnTouch							= false;
				MaximumBarsLookBack							= MaximumBarsLookBack.TwoHundredFiftySix;
				OrderFillResolution							= OrderFillResolution.Standard;
				Slippage									= 0;
				StartBehavior								= StartBehavior.WaitUntilFlat;
				TimeInForce									= TimeInForce.Gtc;
				TraceOrders									= false;
				RealtimeErrorHandling						= RealtimeErrorHandling.StopCancelClose;
				StopTargetHandling							= StopTargetHandling.PerEntryExecution;
				BarsRequiredToTrade							= 20;
				// Disable this property for performance gains in Strategy Analyzer optimizations
				// See the Help Guide for additional information
				IsInstantiatedOnEachOptimizationIteration	= false;
				PeriodoMAX					= 30;
				PeriodoMIN					= 10;
				//PeriodosEMA				= 30;
			}
			else if (State == State.Configure)
			{
			}
			else if (State == State.DataLoaded)
			{				
				MAX1				= MAX(Close, Convert.ToInt32(PeriodoMAX));
				MIN1				= MIN(Close, Convert.ToInt32(PeriodoMIN));				
				//EMA1				= EMA(Close, Convert.ToInt32(PeriodoEMA));

				//EMA1.Plots[0].Brush = Brushes.Goldenrod;
				MIN1.Plots[0].Brush = Brushes.DarkCyan;
				MAX1.Plots[0].Brush = Brushes.Goldenrod;

				//AddChartIndicator(EMA1);
				AddChartIndicator(MAX1);
				AddChartIndicator(MIN1);
			}
		}

		protected override void OnBarUpdate()
		{
			if (BarsInProgress != 0) 
				return;

			if (CurrentBars[0] < PeriodoMAX)
				return;

			 // Set 1
				if (Close[0] == MAX1[0])
			{
				EnterLong(Convert.ToInt32(DefaultQuantity), @"Compra long por MAX");
			}
			
			 // Set 2
			if (Close[0] == MIN1[0])
			{
				ExitLong(Convert.ToInt32(DefaultQuantity), @"Exit long por MIN", @"");		
			}
		}

		#region Properties
		[NinjaScriptProperty]
		[Range(1, int.MaxValue)]
		[Display(Name="PeriodoMIN", Order=1, GroupName="Parameters")]
		public int PeriodoMIN
		{ get; set; }

		[NinjaScriptProperty]
		[Range(1, int.MaxValue)]
		[Display(Name="PeriodoMAX", Order=2, GroupName="Parameters")]
		public int PeriodoMAX
		{ get; set; }
		#endregion
	}
}
