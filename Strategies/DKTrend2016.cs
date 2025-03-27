#region Using declarations
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Xml.Serialization;
using NinjaTrader.Cbi;
using NinjaTrader.Data;
using NinjaTrader.Indicator;
using NinjaTrader.Gui.Chart;
using NinjaTrader.Strategy;
#endregion

// This namespace holds all strategies and is required. Do not change it.
namespace NinjaTrader.Strategy
{
    /// <summary>
    /// Enter the description of your strategy here
    /// </summary>
    [Description("Enter the description of your strategy here")]
    public class DKTrend2016 : Strategy
    {
        #region Variables
        // Wizard generated variables
        private int mediaLenta = 100;     // Periodo de la Media Móvil Lenta		
		private int mediaRapida = 25;     // Periodo de la Media Móvil Rápida
		private int comienzoDia = 930;    // Horario de comienzo de día
		private int finDia = 2200;        // Horario de Cierre de Posiciones		
		private int periodoMaxADX = 500;  // Periodo de cálculo del Máximo del ADX
		private double tamañoBanda = 0.5; // Tamaño de la banda dinámica del ADX
		private int nTrades = 1;		  // Número de operaciones permitidas de cada pata. 
										  // P.Eje. Un valor de 2 permitirá 4 operaciones en la sesión, 2 de largos y 2 de cortos.
		
		// Variables internas.
		private double MaxADX = 0;		  // Esta variable nos servirá para almacenar el valor más alto	alcanzado en el ADX en el periodo seleccionado.
		private int OpesAlcistas = 0;     // Nos servirá para almacenar el número de operaciones alcistas realizadas durante la sesión.
		private int OpesBajistas = 0;     // Nos servirá para almacenar el número de operaciones bajistas realizadas durante la sesión.
			
        #endregion
        protected override void Initialize()
        {	
			//Añadimos las tres medias móviles exponenciales y el indicador ADXBdinámica.
			Add(EMA(High,MediaLenta));
			Add(EMA(Low,MediaLenta));
			Add(EMA(MediaRapida));
			Add(ADXBDinamica(14,TamañoBanda,PeriodoMaxADX));
			
			// Modificamos los colores de las medias móviles lentas.
			EMA(High,MediaLenta).Plots[0].Pen.Color = Color.Green;
			EMA(Low,MediaLenta).Plots[0].Pen.Color = Color.Red;
			
			// Modificamos el estilo de la media móvil rápida.
			EMA(MediaRapida).Plots[0].Pen.DashStyle = DashStyle.Dash;
			
            CalculateOnBarClose = true;
        }
		
        protected override void OnBarUpdate()
        {	
			
			// Exigimos que haya suficientes barras en el gráfico y que no sea viernes.
			if ( CurrentBar < MediaLenta || Time[0].DayOfWeek == DayOfWeek.Friday) return; 
			
			// Ajustamos el formato de las variables horarias.
			int FD = FinDia * 100;
			int CD = comienzoDia *100;
            
			// Reseteamos el valor de las variables en la primera vela de la sesión.
			if(Bars.FirstBarOfSession)
			{
				OpesAlcistas = 0;
				OpesBajistas = 0;
			}
			
			// Almacenamos el mayor valor alcanzado en el ADX en el periodo seleccionado.
			MaxADX = MAX(ADX(14), PeriodoMaxADX) [0];
			
			// Condiciones para entrar largos.				
			if (CrossAbove(Close, EMA(High, MediaLenta), 1) 
			&& Close[0] > EMA(MediaRapida)[0]
			&& ToTime(Time[0])>= CD
			&& ToTime(Time[0])< FD	
			&& ADX(14)[0] < MaxADX * TamañoBanda
			&& OpesAlcistas < NTrades)
           	{					
				EnterLong(1, "");
				OpesAlcistas ++;
			}
			
			// Condiciones para entrar Cortos.		
			if (CrossBelow(Close, EMA(Low, MediaLenta), 1) 
			&& Close[0] < EMA(MediaRapida)[0]
			&& ToTime(Time[0])>= CD
			&& ToTime(Time[0])< FD				
			&& ADX(14)[0] < MaxADX * tamañoBanda
			&& OpesBajistas < NTrades)			
            {
				EnterShort(1, "");
				OpesBajistas ++;								
            }
			
			// Condiciones para cerrar Largos.
            if (CrossBelow(Close, EMA(MediaRapida), 1)|| ToTime(Time[0]) >= FD)
            	ExitLong("", "");
            	
			// Condiciones para cerrar Cortos.
            if (CrossAbove(Close, EMA(MediaRapida), 1) || ToTime(Time[0]) >= FD)
            	ExitShort("", "");
			
			// Salida de Largos en el mínimo diario.
			ExitLongStop (CurrentDayOHL().CurrentLow[0], "","");
			
			// Salida de Cortos en máximo diario.
			ExitShortStop (CurrentDayOHL().CurrentHigh[0], "","");			
			
			// Coloreamos el panel de precios cuando el ADX está por debajo de su banda dinámica.
			if (ADX(14)[0] < MaxADX * TamañoBanda) BackColorAll = Color.LightBlue;
            
        }

        #region Properties
        [Description("")]
        [Category("Parameters")]
        public int MediaLenta
        {
            get { return mediaLenta; }
            set { mediaLenta = Math.Max(1, value); }
        }
		[Description("")]
        [Category("Parameters")]
        public int MediaRapida
        {
            get { return mediaRapida; }
            set { mediaRapida = Math.Max(1, value); }
        }
        [Description("")]
        [Category("Parameters")]
        public int FinDia
        {
            get { return finDia; }
            set { finDia = Math.Max(1, value); }
        }
		[Description("")]
        [Category("Parameters")]
        public int ComienzoDia
        {
            get { return comienzoDia; }
            set { comienzoDia = Math.Max(1, value); }
        }
		[Description("")]
        [Category("Parameters")]
        public double TamañoBanda
        {
            get { return tamañoBanda; }
            set { tamañoBanda = Math.Max(0, value); }
        }
		[Description("")]
        [Category("Parameters")]
        public int PeriodoMaxADX
        {
            get { return periodoMaxADX; }
            set { periodoMaxADX = Math.Max(0, value); }
        }
		[Description("")]
        [Category("Parameters")]
        public int NTrades
        {
            get { return nTrades; }
            set { nTrades = Math.Max(0, value); }
        }
				
        #endregion
    }
}
