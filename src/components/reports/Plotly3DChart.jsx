import React, { useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

function Plotly3DChart({ 
  filteredTasks, 
  timeframe, 
  categories, 
  selectedDayValue,
  selectedWeekValue,
  selectedMonth, 
  selectedYear,
  currentDate,
  selectableWeeks
}) {
  const plotly3DData = useMemo(() => {
    let dates = [];
    
    if (timeframe === 'Day') {
      // 24 hours of the selected calendar day
      for (let h = 0; h < 24; h++) {
        dates.push(h + ':00');
      }
    } else if (timeframe === 'Week') {
      // 7 calendar days of the selected week block
      const weekStart = new Date(selectedWeekValue);
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        dates.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      }
    } else if (timeframe === 'Month') {
      // All days of the selected calendar month
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        dates.push(day.toString());
      }
    } else {
      // 12 months of the year
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dates = months;
    }

    const xCoords = [];
    const yCoords = [];
    const zCoords = [];

    dates.forEach((dateLabel) => {
      categories.forEach((cat) => {
        // Group the completions count by category (Y) and the dateLabel (X)
        const count = filteredTasks.filter(comp => {
          if (comp.category !== cat) return false;
          if (!comp.completedAt) return false;
          const completedDate = new Date(comp.completedAt);
          if (isNaN(completedDate.getTime())) return false;
          
          if (timeframe === 'Day') {
            return (completedDate.getHours() + ':00') === dateLabel;
          }
          if (timeframe === 'Week') {
            const label = completedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            return label === dateLabel;
          }
          if (timeframe === 'Month') {
            return completedDate.getDate().toString() === dateLabel;
          }
          if (timeframe === 'Year') {
            const label = completedDate.toLocaleDateString('en-US', { month: 'short' });
            return label === dateLabel;
          }
          return false;
        }).length;

        if (count > 0) {
          xCoords.push(dateLabel);
          yCoords.push(cat);
          zCoords.push(count);
        }
      });
    });

    const lineX = [];
    const lineY = [];
    const lineZ = [];

    for (let i = 0; i < xCoords.length; i++) {
      // Draw vertical stem line: (x, y, 0) -> (x, y, z)
      lineX.push(xCoords[i], xCoords[i], null);
      lineY.push(yCoords[i], yCoords[i], null);
      lineZ.push(0, zCoords[i], null);
    }

    return [
      {
        type: 'scatter3d',
        mode: 'markers',
        x: xCoords,
        y: yCoords,
        z: zCoords,
        marker: {
          size: 7,
          color: '#10b981', // Emerald head markers
          symbol: 'circle',
          line: {
            color: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#08090c',
            width: 1.5
          }
        },
        error_z: {
          type: 'data',
          symmetric: false,
          visible: true,
          array: zCoords.map(() => 0),
          arrayminus: zCoords,
          color: '#6366f1',
          thickness: 5,
          width: 0
        },
        name: 'Completed'
      }
    ];
  }, [filteredTasks, timeframe, categories, selectedDayValue, selectedWeekValue, selectedMonth, selectedYear, currentDate, selectableWeeks]);

  const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
  const gridColor = isLightTheme ? '#cbd5e1' : '#1a1e27';
  const textColor = isLightTheme ? '#64748b' : '#94a3b8';
  const titleColor = isLightTheme ? '#0f172a' : '#f1f5f9';

  const plotlyLayout = useMemo(() => {
    return {
      autosize: true,
      paper_bgcolor: 'rgba(0, 0, 0, 0)',
      plot_bgcolor: 'rgba(0, 0, 0, 0)',
      font: {
        family: 'Inter, sans-serif',
        color: textColor,
        size: 9
      },
      scene: {
        aspectratio: { x: 1.5, y: 1.5, z: 1 },
        aspectmode: 'manual',
        xaxis: {
          title: {
            text: timeframe === 'Day' ? 'Hours' : 'Time Period',
            font: { color: titleColor, size: 10, weight: 600 }
          },
          gridcolor: gridColor,
          tickfont: { color: textColor, size: 9 },
          showticklabels: true,
          showbackground: true,
          backgroundcolor: isLightTheme ? '#f1f5f9' : '#0a0c10',
          zerolinecolor: isLightTheme ? '#cbd5e1' : 'rgba(255, 255, 255, 0.05)',
          showspikes: true,
          spikethickness: 1,
          spikecolor: '#6366f1'
        },
        yaxis: {
          title: {
            text: 'Categories',
            font: { color: titleColor, size: 10, weight: 600 }
          },
          categoryarray: categories,
          categoryorder: 'array',
          gridcolor: gridColor,
          tickfont: { color: textColor, size: 9 },
          showticklabels: true,
          showbackground: true,
          backgroundcolor: isLightTheme ? '#f8fafc' : '#07080c',
          zerolinecolor: isLightTheme ? '#cbd5e1' : 'rgba(255, 255, 255, 0.05)',
          showspikes: true,
          spikethickness: 1,
          spikecolor: '#6366f1'
        },
        zaxis: {
          title: {
            text: 'Completed',
            font: { color: titleColor, size: 10, weight: 600 }
          },
          gridcolor: gridColor,
          tickfont: { color: textColor, size: 9 },
          showticklabels: true,
          showbackground: true,
          backgroundcolor: isLightTheme ? '#f1f5f9' : '#0a0c10',
          zerolinecolor: isLightTheme ? '#cbd5e1' : 'rgba(255, 255, 255, 0.05)',
          showspikes: true,
          spikethickness: 1,
          spikecolor: '#10b981',
          dtick: 1
        },
        camera: {
          eye: { x: 1.8, y: 1.8, z: 1.2 }
        }
      },
      margin: { l: 40, r: 40, b: 40, t: 40 }
    };
  }, [timeframe, categories, isLightTheme, gridColor, textColor, titleColor]);

  return (
    <div className="plotly-wrapper">
      <Plot 
        data={plotly3DData}
        layout={plotlyLayout}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default Plotly3DChart;
