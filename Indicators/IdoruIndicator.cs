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
using NinjaTrader.NinjaScript.DrawingTools;
#endregion

//This namespace holds Indicators in this folder and is required. Do not change it. 
namespace NinjaTrader.NinjaScript.Indicators
{
	public class IdoruIndicator : Indicator
	{
		protected override void OnStateChange()
		{
			if (State == State.SetDefaults)
			{
				Description									= @"Indicador del sistema IDORU";
				Name										= "IdoruIndicator";
				Calculate									= Calculate.OnBarClose;
				IsOverlay									= true;
				DisplayInDataBox							= true;
				DrawOnPricePanel							= true;
				DrawHorizontalGridLines						= true;
				DrawVerticalGridLines						= true;
				PaintPriceMarkers							= true;
				ScaleJustification							= NinjaTrader.Gui.Chart.ScaleJustification.Right;
				//Disable this property if your indicator requires custom values that cumulate with each new market data event. 
				//See Help Guide for additional information.
				IsSuspendedWhileInactive					= true;
				LongEntry					= 20;
				ShortEntry					= 20;
				AddPlot(Brushes.Tomato, "Id_Largo");
				AddPlot(Brushes.Teal, "Id_Corto");
			}
			else if (State == State.Configure)
			{
			}
		}

		protected override void OnBarUpdate()
		{
			//Add your custom indicator logic here.
			if (CurrentBar < LongEntry) return;
			Id_Largo[0]=EMA(High,LongEntry)[0]+StdDev(LongEntry )[0];
			Id_Corto[0]=EMA(ShortEntry)[0]-StdDev(ShortEntry)[0];
		}

		#region Properties
		[NinjaScriptProperty]
		[Range(1, int.MaxValue)]
		[Display(Name="LongEntry", Order=1, GroupName="Parameters")]
		public int LongEntry
		{ get; set; }

		[NinjaScriptProperty]
		[Range(1, int.MaxValue)]
		[Display(Name="ShortEntry", Order=2, GroupName="Parameters")]
		public int ShortEntry
		{ get; set; }

		[Browsable(false)]
		[XmlIgnore]
		public Series<double> Id_Largo
		{
			get { return Values[0]; }
		}

		[Browsable(false)]
		[XmlIgnore]
		public Series<double> Id_Corto
		{
			get { return Values[1]; }
		}
		#endregion

	}
}

#region NinjaScript generated code. Neither change nor remove.

namespace NinjaTrader.NinjaScript.Indicators
{
	public partial class Indicator : NinjaTrader.Gui.NinjaScript.IndicatorRenderBase
	{
		private IdoruIndicator[] cacheIdoruIndicator;
		public IdoruIndicator IdoruIndicator(int longEntry, int shortEntry)
		{
			return IdoruIndicator(Input, longEntry, shortEntry);
		}

		public IdoruIndicator IdoruIndicator(ISeries<double> input, int longEntry, int shortEntry)
		{
			if (cacheIdoruIndicator != null)
				for (int idx = 0; idx < cacheIdoruIndicator.Length; idx++)
					if (cacheIdoruIndicator[idx] != null && cacheIdoruIndicator[idx].LongEntry == longEntry && cacheIdoruIndicator[idx].ShortEntry == shortEntry && cacheIdoruIndicator[idx].EqualsInput(input))
						return cacheIdoruIndicator[idx];
			return CacheIndicator<IdoruIndicator>(new IdoruIndicator(){ LongEntry = longEntry, ShortEntry = shortEntry }, input, ref cacheIdoruIndicator);
		}
	}
}

namespace NinjaTrader.NinjaScript.MarketAnalyzerColumns
{
	public partial class MarketAnalyzerColumn : MarketAnalyzerColumnBase
	{
		public Indicators.IdoruIndicator IdoruIndicator(int longEntry, int shortEntry)
		{
			return indicator.IdoruIndicator(Input, longEntry, shortEntry);
		}

		public Indicators.IdoruIndicator IdoruIndicator(ISeries<double> input , int longEntry, int shortEntry)
		{
			return indicator.IdoruIndicator(input, longEntry, shortEntry);
		}
	}
}

namespace NinjaTrader.NinjaScript.Strategies
{
	public partial class Strategy : NinjaTrader.Gui.NinjaScript.StrategyRenderBase
	{
		public Indicators.IdoruIndicator IdoruIndicator(int longEntry, int shortEntry)
		{
			return indicator.IdoruIndicator(Input, longEntry, shortEntry);
		}

		public Indicators.IdoruIndicator IdoruIndicator(ISeries<double> input , int longEntry, int shortEntry)
		{
			return indicator.IdoruIndicator(input, longEntry, shortEntry);
		}
	}
}

#endregion
