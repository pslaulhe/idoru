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
	public class IDORU : Strategy
	{
		// User Variables
				
				
				private int priortradesCount =1;
				private int TradesToday;
				
		
		protected override void OnStateChange()
		{
			if (State == State.SetDefaults)
			{
				Description									= @"Sistema Intradiario tipo VBO";
				Name										= "IDORU";
				Calculate									= Calculate.OnBarClose;
				EntriesPerDirection							= 1;
				EntryHandling								= EntryHandling.AllEntries;
				IsExitOnSessionCloseStrategy				= true;
				ExitOnSessionCloseSeconds					= 30;
				IsFillLimitOnTouch							= false;
				MaximumBarsLookBack							= MaximumBarsLookBack.Infinite;
				OrderFillResolution							= OrderFillResolution.Standard;
				Slippage									= 0;
				StartBehavior								= StartBehavior.WaitUntilFlat;
				TimeInForce									= TimeInForce.Day;
				TraceOrders									= false;
				RealtimeErrorHandling						= RealtimeErrorHandling.StopCancelClose;
				StopTargetHandling							= StopTargetHandling.PerEntryExecution;
				BarsRequiredToTrade							= 20;
				// Disable this property for performance gains in Strategy Analyzer optimizations
				// See the Help Guide for additional information
				IsInstantiatedOnEachOptimizationIteration	= true;
				// Valores de muestra para el FDAX en TF = 20 min. y plantilla de mercado: 9:00-20:00 h.
				ChopLine					= 31;
				HoraComienzo				= 1540;
				HoraFin						= 1840;
				StopLoss					= 2.7;
				TriggerC					= 10;
				TriggerV					= 0;
				MaxOps						= 1;
				PeriodoMC					= 58;
				VolatFilter					= 1000;
				PeriodoML					= 150;
				
				
			}
			else if (State == State.Configure)
			{
				
				
				
				AddChartIndicator(IdoruIndicator(PeriodoML+TriggerC,PeriodoMC+TriggerV));
				AddChartIndicator(EMA(Close,PeriodoML));
				
			}
			
			else if (State == State.DataLoaded)
			{				
				
			}
			
			
		}

		protected override void OnBarUpdate()
		{
			//Núm. de contratos
			
			if (Bars.IsFirstBarOfSession)
			{
				priortradesCount = SystemPerformance.AllTrades.Count;
				TradesToday = 0;
			}
			
		
			if(SystemPerformance.AllTrades.Count !=priortradesCount)
				
			{ 	TradesToday++;
				priortradesCount = SystemPerformance.AllTrades.Count;
			}

			 
			// Salida por tiempo
			
			if (ToTime(Time[0])>=HoraFin*100)
			{
				ExitLong("","");
				ExitShort("","");
				return;
			}

			if (ToTime(Time[0]) < HoraComienzo*100) return;

			// Evaluación de los filtros
			// ChoppinesIndex y Divergence Index
			
			bool filtervalue = (ChoppinessIndex(PeriodoML)[0]>ChopLine && ChoppinessIndex(PeriodoML)[0]<20+ChopLine) 
							&& (DivergenceIndex(Math.Abs(PeriodoML/4),PeriodoML)[0]<VolatFilter
						 && TradesToday<MaxOps);
			if (!filtervalue) return;
			
			// Calculamos las medias y desviaciones de las patas larga y corta.
			
			double EntrarLargo = EMA(High,PeriodoMC+TriggerC)[0]+StdDev(PeriodoMC+TriggerC)[0];
			double EntrarCorto = EMA(Low,PeriodoMC+TriggerV)[0]-StdDev(PeriodoMC+TriggerV)[0];
			
			// Calculamos el stop loss.
			
			double stopsup = (EntrarLargo - EMA(Close,PeriodoMC)[0])*StopLoss*Instrument.MasterInstrument.PointValue;
			double stopinf = (EMA(Close,PeriodoMC)[0]- EntrarCorto)*StopLoss*Instrument.MasterInstrument.PointValue;
			
			// Fijamos los MMStop para cortos y largos.
			
			 if (Position.MarketPosition == MarketPosition.Long)
			 {
				 SetStopLoss(CalculationMode.Currency, stopsup);
			 }
			 
			 if (Position.MarketPosition == MarketPosition.Short)
			 {
				 SetStopLoss(CalculationMode.Currency, stopinf);
			 }
			 
			// Entramos Largos
			if (Close[0]>EMA(Close,PeriodoML)[0] && Close[0] > EntrarLargo)
			{
				double TC = MAX(High,2)[0];
				EnterLongStopLimit(1,TC-0*TickSize, TC, "");			
			}
			
			// Entramos Cortos
			if (Close[0]< EMA(Close,PeriodoML)[0] && Close[0] < EntrarCorto)
			{
				double TV = MIN(Low,2)[0];
				EnterShortStopLimit(1,TV+0*TickSize, TV, "");
			}
		}

		#region Properties
		[NinjaScriptProperty]
		[Range(1, int.MaxValue)]
		[Display(Name="ChopLine", Description="Periodo del filtro de ADX", Order=1, GroupName="Parameters")]
		public int ChopLine
		{ get; set; }

		[NinjaScriptProperty]
		[Range(1, int.MaxValue)]
		[Display(Name="HoraComienzo", Description="Hora de Comienzo", Order=2, GroupName="Parameters")]
		public int HoraComienzo
		{ get; set; }

		[NinjaScriptProperty]
		[Range(1, int.MaxValue)]
		[Display(Name="HoraFin", Description="Hora de fin de la operativa", Order=3, GroupName="Parameters")]
		public int HoraFin
		{ get; set; }

		[NinjaScriptProperty]
		[Range(1, double.MaxValue)]
		[Display(Name="StopLoss", Description="Stop en dólares", Order=4, GroupName="Parameters")]
		public double StopLoss
		{ get; set; }

		[NinjaScriptProperty]
		[Range(-100, int.MaxValue)]
		[Display(Name="TriggerC", Description="Coeficiente del máximo", Order=5, GroupName="Parameters")]
		public int TriggerC
		{ get; set; }

		[NinjaScriptProperty]
		[Range(-100, int.MaxValue)]
		[Display(Name="TriggerV", Description="Coeficiente del mínimo", Order=6, GroupName="Parameters")]
		public int TriggerV
		{ get; set; }

		[NinjaScriptProperty]
		[Range(0, int.MaxValue)]
		[Display(Name="MaxOps", Description="Máximo de operaciones por día", Order=7, GroupName="Parameters")]
		public int MaxOps
		{ get; set; }

		[NinjaScriptProperty]
		[Range(1, int.MaxValue)]
		[Display(Name="PeriodoMC", Description="Media del ADX", Order=8, GroupName="Parameters")]
		public int PeriodoMC
		{ get; set; }

		[NinjaScriptProperty]
		[Range(1, int.MaxValue)]
		[Display(Name="VolatFilter", Description="Barras del Qstick", Order=9, GroupName="Parameters")]
		public int VolatFilter
		{ get; set; }

		

		[NinjaScriptProperty]
		[Range(1, int.MaxValue)]
		[Display(Name="PeriodoML", Description="EMA larga de contexto", Order=11, GroupName="Parameters")]
		public int PeriodoML
		{ get; set; }
		#endregion

	}
}
