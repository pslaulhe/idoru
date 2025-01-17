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
	public class DivergenceIndex : Indicator
	{
		private Series<double>vprecios;
		protected override void OnStateChange()
		{
			if (State == State.SetDefaults)
			{
				Description									= @"Índice de divergencia";
				Name										= "DivergenceIndex";
				Calculate									= Calculate.OnBarClose;
				IsOverlay									= false;
				DisplayInDataBox							= true;
				DrawOnPricePanel							= true;
				DrawHorizontalGridLines						= true;
				DrawVerticalGridLines						= true;
				PaintPriceMarkers							= true;
				ScaleJustification							= NinjaTrader.Gui.Chart.ScaleJustification.Right;
				//Disable this property if your indicator requires custom values that cumulate with each new market data event. 
				//See Help Guide for additional information.
				IsSuspendedWhileInactive					= true;
				MomentoLargo					= 40;
				MomentoCorto					= 10;
				AddPlot(Brushes.Teal, "DI");
				AddLine(Brushes.Orange, 0, "DiLine");
			}
				else if (State == State.DataLoaded)
				{
					vprecios = new Series<double>(this);
					
				}
			
			else if (State == State.Configure)
			{
			}
		}

		protected override void OnBarUpdate()
		{
			//Add your custom indicator logic here.
			
			if (CurrentBar<MomentoLargo) {return;}
			
			// Diferencia de precios
			
			vprecios[0]=(Math.Abs(Close[0]-Close[1]));
			
			// Varianza de precioes
			
			double pvar = Math.Pow((StdDev(vprecios,MomentoLargo)[0]),2);
			
			DI[0] = ((Momentum(Close,MomentoCorto)[0]*Momentum(Close,MomentoLargo)[0])/pvar);
			
		}

		#region Properties
		[NinjaScriptProperty]
		[Range(1, int.MaxValue)]
		[Display(Name="MomentoLargo", Order=1, GroupName="Parameters")]
		public int MomentoLargo
		{ get; set; }

		[NinjaScriptProperty]
		[Range(1, int.MaxValue)]
		[Display(Name="MomentoCorto", Order=2, GroupName="Parameters")]
		public int MomentoCorto
		{ get; set; }

		[Browsable(false)]
		[XmlIgnore]
		public Series<double> DI
		{
			get { return Values[0]; }
		}

		#endregion

	}
}

#region NinjaScript generated code. Neither change nor remove.

namespace NinjaTrader.NinjaScript.Indicators
{
	public partial class Indicator : NinjaTrader.Gui.NinjaScript.IndicatorRenderBase
	{
		private DivergenceIndex[] cacheDivergenceIndex;
		public DivergenceIndex DivergenceIndex(int momentoLargo, int momentoCorto)
		{
			return DivergenceIndex(Input, momentoLargo, momentoCorto);
		}

		public DivergenceIndex DivergenceIndex(ISeries<double> input, int momentoLargo, int momentoCorto)
		{
			if (cacheDivergenceIndex != null)
				for (int idx = 0; idx < cacheDivergenceIndex.Length; idx++)
					if (cacheDivergenceIndex[idx] != null && cacheDivergenceIndex[idx].MomentoLargo == momentoLargo && cacheDivergenceIndex[idx].MomentoCorto == momentoCorto && cacheDivergenceIndex[idx].EqualsInput(input))
						return cacheDivergenceIndex[idx];
			return CacheIndicator<DivergenceIndex>(new DivergenceIndex(){ MomentoLargo = momentoLargo, MomentoCorto = momentoCorto }, input, ref cacheDivergenceIndex);
		}
	}
}

namespace NinjaTrader.NinjaScript.MarketAnalyzerColumns
{
	public partial class MarketAnalyzerColumn : MarketAnalyzerColumnBase
	{
		public Indicators.DivergenceIndex DivergenceIndex(int momentoLargo, int momentoCorto)
		{
			return indicator.DivergenceIndex(Input, momentoLargo, momentoCorto);
		}

		public Indicators.DivergenceIndex DivergenceIndex(ISeries<double> input , int momentoLargo, int momentoCorto)
		{
			return indicator.DivergenceIndex(input, momentoLargo, momentoCorto);
		}
	}
}

namespace NinjaTrader.NinjaScript.Strategies
{
	public partial class Strategy : NinjaTrader.Gui.NinjaScript.StrategyRenderBase
	{
		public Indicators.DivergenceIndex DivergenceIndex(int momentoLargo, int momentoCorto)
		{
			return indicator.DivergenceIndex(Input, momentoLargo, momentoCorto);
		}

		public Indicators.DivergenceIndex DivergenceIndex(ISeries<double> input , int momentoLargo, int momentoCorto)
		{
			return indicator.DivergenceIndex(input, momentoLargo, momentoCorto);
		}
	}
}

#endregion
