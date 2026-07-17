import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { CalendarRange } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        color: '#94a3b8',
        font: { family: 'Inter', size: 11 },
        boxWidth: 10,
        padding: 10
      }
    },
    tooltip: {
      backgroundColor: '#0d0f14',
      titleFont: { family: 'Inter' },
      bodyFont: { family: 'Inter' },
      borderColor: '#1a1e27',
      borderWidth: 1
    }
  }
};

function DoughnutChart({ filteredTasks, stats, categories }) {
  const doughnutData = useMemo(() => {
    const counts = categories.map(c => stats.categoryStats[c]);
    return {
      labels: categories,
      datasets: [
        {
          label: 'Completed Tasks',
          data: counts,
          backgroundColor: [
            'rgba(99, 102, 241, 0.7)',   // Work (Electric Indigo)
            'rgba(16, 185, 129, 0.7)',   // Personal (Mint Emerald)
            'rgba(245, 158, 11, 0.7)',   // Health (Warm Amber)
            'rgba(14, 165, 233, 0.7)',   // Finance (Steel Blue)
            'rgba(244, 63, 94, 0.7)',    // Urgent (Crimson Rose)
            'rgba(148, 163, 184, 0.6)',  // General (Slate)
            'rgba(168, 85, 247, 0.7)'    // Study (Purple Violet)
          ],
          borderColor: [
            '#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#f43f5e', '#94a3b8', '#a855f7'
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [stats, categories]);

  return (
    <div className="chart-wrapper">
      {filteredTasks.length > 0 ? (
        <Doughnut data={doughnutData} options={doughnutOptions} />
      ) : (
        <div className="no-data-placeholder">
          <CalendarRange size={24} />
          <span>No goals completed in this range</span>
        </div>
      )}
    </div>
  );
}

export default DoughnutChart;
