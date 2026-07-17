import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Activity, Award, CheckCircle } from 'lucide-react';
import DoughnutChart from './DoughnutChart';
import { getProfile } from '../../lib/db';

const Plotly3DChart = React.lazy(() => import('./Plotly3DChart'));

const CATEGORIES = ['Work', 'Personal', 'Health', 'Finance', 'Urgent', 'General', 'Study'];

let cachedMockTasks = null;
const generateMockTasks = () => {
  if (cachedMockTasks) return cachedMockTasks;
  
  const mockTasks = [];
  const now = new Date();
  
  for (let i = 0; i < 45; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const completedDate = new Date();
    completedDate.setDate(now.getDate() - daysAgo);
    completedDate.setHours(Math.floor(Math.random() * 12) + 9);

    mockTasks.push({
      id: `mock_${i}`,
      title: `Mock Task ${i}`,
      completed: true,
      category,
      createdAt: new Date(completedDate.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      completedAt: completedDate.toISOString(),
      completedDates: [completedDate.toISOString()],
      failedDates: [],
      archived: false
    });
  }

  for (let i = 0; i < 10; i++) {
    mockTasks.push({
      id: `mock_active_${i}`,
      title: `Mock Active Task ${i}`,
      completed: false,
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      createdAt: now.toISOString(),
      completedDates: [],
      failedDates: [],
      archived: false
    });
  }

  cachedMockTasks = mockTasks;
  return mockTasks;
};

function ReportsDashboard({ tasks }) {
  const [timeframe, setTimeframe] = useState('Week');
  const [useSampleData, setUseSampleData] = useState(false);

  // Silent clock hook refreshing every minute to keep date bounds accurate
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const profile = useMemo(() => getProfile(), []);
  
  // Use joining date from profile. Default to 2 days ago for demo if joinedAt is missing or invalid
  const joinedDate = useMemo(() => {
    if (!profile || !profile.joinedAt) {
      return new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000);
    }
    const parsed = new Date(profile.joinedAt);
    return isNaN(parsed.getTime()) ? new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000) : parsed;
  }, [profile, currentDate]);

  const dataTasks = useMemo(() => {
    const hasCompletedTasks = tasks.some(t => t.completedDates && t.completedDates.length > 0);
    if (!hasCompletedTasks || useSampleData) {
      return generateMockTasks();
    }
    return tasks;
  }, [tasks, useSampleData]);

  const hasNoData = tasks.length === 0;

  // 1. Generate selectable days: All calendar days from the joining date to today
  const selectableDays = useMemo(() => {
    const list = [];
    const start = new Date(joinedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(currentDate);
    end.setHours(0, 0, 0, 0);

    const temp = new Date(end);
    while (temp >= start) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = temp.getTime() === today.getTime();
      const label = temp.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
      
      list.push({
        day: temp.getDate(),
        month: temp.getMonth(),
        year: temp.getFullYear(),
        value: `${temp.getDate()}-${temp.getMonth()}-${temp.getFullYear()}`,
        label: label + (isToday ? ' (Today)' : '')
      });
      temp.setDate(temp.getDate() - 1);
    }
    return list;
  }, [joinedDate, currentDate]);

  // 2. Generate selectable weeks: Sunday-Saturday weeks from joined date week to current week
  const selectableWeeks = useMemo(() => {
    const list = [];
    
    // Get Sunday of the joinedDate week
    const start = new Date(joinedDate);
    const startDay = start.getDay();
    start.setDate(start.getDate() - startDay);
    start.setHours(0, 0, 0, 0);

    // Get Sunday of the currentDate week
    const end = new Date(currentDate);
    const endDay = end.getDay();
    end.setDate(end.getDate() - endDay);
    end.setHours(0, 0, 0, 0);

    const temp = new Date(end);
    while (temp >= start) {
      const weekEnd = new Date(temp);
      weekEnd.setDate(temp.getDate() + 6);
      
      const label = `Week of ${temp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      
      list.push({
        start: new Date(temp),
        end: new Date(weekEnd),
        value: temp.toISOString(),
        label: label
      });
      temp.setDate(temp.getDate() - 7);
    }
    return list;
  }, [joinedDate, currentDate]);

  // 3. Generate selectable months: calendar months from joining month to current month
  const selectableMonths = useMemo(() => {
    const list = [];
    let startYear = joinedDate.getFullYear();
    let startMonth = joinedDate.getMonth();
    
    const endYear = currentDate.getFullYear();
    const endMonth = currentDate.getMonth();
    
    let currentY = startYear;
    let currentM = startMonth;
    
    while (currentY < endYear || (currentY === endYear && currentM <= endMonth)) {
      list.push({ month: currentM, year: currentY });
      currentM++;
      if (currentM > 11) {
        currentM = 0;
        currentY++;
      }
    }
    
    return list.reverse();
  }, [joinedDate, currentDate]);

  // Set default initial selection states based on current day and week bounds
  const defaultDayVal = `${currentDate.getDate()}-${currentDate.getMonth()}-${currentDate.getFullYear()}`;
  const defaultWeekVal = useMemo(() => {
    return selectableWeeks[0] ? selectableWeeks[0].value : currentDate.toISOString();
  }, [selectableWeeks, currentDate]);

  const [selectedDayValue, setSelectedDayValue] = useState(defaultDayVal);
  const [selectedWeekValue, setSelectedWeekValue] = useState(defaultWeekVal);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Keep dropdown options synced when currentDate increments
  useEffect(() => {
    setSelectedDayValue(`${currentDate.getDate()}-${currentDate.getMonth()}-${currentDate.getFullYear()}`);
    if (selectableWeeks[0]) {
      setSelectedWeekValue(selectableWeeks[0].value);
    }
    setSelectedMonth(currentDate.getMonth());
    setSelectedYear(currentDate.getFullYear());
  }, [currentDate, selectableWeeks]);

  // Flatten completion logs across all tasks
  const allCompletions = useMemo(() => {
    const list = [];
    dataTasks.forEach(task => {
      if (task.completedDates && task.completedDates.length > 0) {
        task.completedDates.forEach(dateStr => {
          list.push({
            id: task.id,
            category: task.category,
            title: task.title,
            completedAt: dateStr,
            status: 'completed'
          });
        });
      } else if (task.completedAt) {
        list.push({
          id: task.id,
          category: task.category,
          title: task.title,
          completedAt: task.completedAt,
          status: 'completed'
        });
      }
      
      // Load historical missed/incomplete tasks
      if (task.failedDates && task.failedDates.length > 0) {
        task.failedDates.forEach(dateStr => {
          list.push({
            id: task.id,
            category: task.category,
            title: task.title,
            completedAt: dateStr,
            status: 'failed'
          });
        });
      }
    });
    return list;
  }, [dataTasks]);

  // Filter completions accurately based on dropdown parameters
  const filteredCompletions = useMemo(() => {
    return allCompletions.filter(comp => {
      if (!comp.completedAt) return false;
      const completedDate = new Date(comp.completedAt);
      if (isNaN(completedDate.getTime())) return false;
      
      const compYear = completedDate.getFullYear();
      const compMonth = completedDate.getMonth();
      const compDate = completedDate.getDate();

      if (timeframe === 'Day') {
        const valueToCheck = `${compDate}-${compMonth}-${compYear}`;
        return valueToCheck === selectedDayValue;
      }
      
      if (timeframe === 'Week') {
        const weekStart = new Date(selectedWeekValue);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return completedDate >= weekStart && completedDate < weekEnd;
      }
      
      if (timeframe === 'Month') {
        return compMonth === selectedMonth && 
               compYear === selectedYear;
      }
      
      if (timeframe === 'Year') {
        return compYear === currentDate.getFullYear();
      }
      
      return true;
    });
  }, [allCompletions, timeframe, selectedDayValue, selectedWeekValue, selectedMonth, selectedYear, currentDate]);

  // Filter completions to separate successes vs failures for segments charts
  const successfulCompletions = useMemo(() => {
    return filteredCompletions.filter(c => c.status === 'completed');
  }, [filteredCompletions]);

  // Mathematical statistics calculations, scoped accurately to the selected timeframe
  const stats = useMemo(() => {
    const total = dataTasks.length;
    const timeframeTotal = filteredCompletions.length;
    const timeframeCompleted = successfulCompletions.length;
    const rate = timeframeTotal ? Math.round((timeframeCompleted / timeframeTotal) * 100) : 0;
    
    const categoryStats = {};
    CATEGORIES.forEach(c => categoryStats[c] = 0);
    successfulCompletions.forEach(t => {
      if (categoryStats[t.category] !== undefined) {
        categoryStats[t.category]++;
      }
    });

    return { total, completed: timeframeCompleted, rate, categoryStats };
  }, [dataTasks, filteredCompletions, successfulCompletions]);

  return (
    <div className="reports-dashboard">
      {(hasNoData || useSampleData) && (
        <div className="sample-data-banner">
          <div className="banner-details">
            <h4>{hasNoData ? "Demo Data Mode Activated" : "Viewing Sample Productivity Metrics"}</h4>
            <p>
              {hasNoData 
                ? "Since you haven't completed any tasks yet, we've loaded interactive demo data to showcase the reports." 
                : "You are currently reviewing simulated stats. Switch back to view your own live metrics."
              }
            </p>
          </div>
          {hasNoData ? (
            <span className="banner-indicator-pill">Previewing</span>
          ) : (
            <button 
              className="btn-secondary btn-sm"
              onClick={() => setUseSampleData(false)}
            >
              Reset to Mine
            </button>
          )}
        </div>
      )}

      <div className="reports-controls">
        <div className="timeframe-selector-group" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="timeframe-selector">
            {['Day', 'Week', 'Month', 'Year'].map(tf => (
              <button
                key={tf}
                className={`time-filter-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Dynamic selector dropdown next to the timeframe buttons */}
          {timeframe === 'Day' && (
            <div className="dropdown-selector-wrapper">
              <select 
                className="reports-select"
                value={selectedDayValue} 
                onChange={(e) => setSelectedDayValue(e.target.value)}
              >
                {selectableDays.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {timeframe === 'Week' && (
            <div className="dropdown-selector-wrapper">
              <select 
                className="reports-select"
                value={selectedWeekValue} 
                onChange={(e) => setSelectedWeekValue(e.target.value)}
              >
                {selectableWeeks.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {timeframe === 'Month' && (
            <div className="dropdown-selector-wrapper">
              <select 
                className="reports-select"
                value={`${selectedMonth}-${selectedYear}`} 
                onChange={(e) => {
                  const [m, y] = e.target.value.split('-').map(Number);
                  setSelectedMonth(m);
                  setSelectedYear(y);
                }}
              >
                {selectableMonths.map(({ month, year }) => {
                  const label = new Date(year, month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                  return <option key={`${month}-${year}`} value={`${month}-${year}`}>{label}</option>;
                })}
              </select>
            </div>
          )}
        </div>

        {!hasNoData && (
          <label className="demo-toggle-row">
            <input 
              type="checkbox" 
              checked={useSampleData} 
              onChange={(e) => setUseSampleData(e.target.checked)}
            />
            <span className="demo-toggle-text">Simulate Volume Data</span>
          </label>
        )}
      </div>

      <div className="performance-row">
        {/* Doughnut Chart */}
        <div className="report-card chart-panel">
          <div className="card-header-row">
            <Activity size={16} className="card-icon" style={{ color: 'var(--primary)' }} />
            <h3>Task Segments</h3>
          </div>
          <DoughnutChart 
            filteredTasks={successfulCompletions} 
            stats={stats} 
            categories={CATEGORIES} 
          />
        </div>

        {/* Focus Insights Analysis */}
        <div className="report-card insights-panel">
          <div className="card-header-row">
            <Award size={16} className="card-icon" style={{ color: 'var(--secondary)' }} />
            <h3>Performance Analysis</h3>
          </div>

          <div className="insights-content">
            <div className="insight-stat-item">
              <span className="insight-label">Timeframe Completions</span>
              <span className="insight-value">{successfulCompletions.length} tasks</span>
            </div>

            <div className="insight-stat-item">
              <span className="insight-label">Timeframe Incompletes / Missed</span>
              <span className="insight-value" style={{ color: 'var(--accent)' }}>
                {filteredCompletions.filter(c => c.status === 'failed').length} missed
              </span>
            </div>
            
            <div className="insight-stat-item">
              <span className="insight-label">Peak Focus Area</span>
              <span className="insight-value">
                {useMemo(() => {
                  let maxCat = 'None';
                  let maxVal = -1;
                  Object.entries(stats.categoryStats).forEach(([cat, val]) => {
                    if (val > maxVal) {
                      maxVal = val;
                      maxCat = cat;
                    }
                  });
                  return maxVal > 0 ? `${maxCat} (${maxVal})` : 'No data';
                }, [stats])}
              </span>
            </div>

            <div className="insight-stat-item">
              <span className="insight-label">Completeness Rating</span>
              <span className="insight-value">{stats.rate}%</span>
            </div>

            <div className="insight-recommendation">
              <strong>Velocity Observation:</strong>
              {successfulCompletions.length > 0 ? (
                <p>
                  You completed {successfulCompletions.length} items. Focus has been heavily skewed towards the {
                    Object.entries(stats.categoryStats).sort((a,b) => b[1] - a[1])[0][0]
                  } category. Keeping multi-discipline tasks balanced will prevent schedule fatigue.
                </p>
              ) : (
                <p>No activity tracked in this range. Select a larger timeframe or finalize pending tasks on the Task Board to calculate recommendations.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3D Line Graph */}
      <div className="report-card plotly-3d-panel">
        <div className="card-header-row">
          <CheckCircle size={16} className="card-icon" style={{ color: 'var(--primary)' }} />
          <div>
            <h3>3D Productivity Line Trend</h3>
            <p className="card-header-desc">Rotate, zoom and hover over vertices to review completion volume (Z) by category (Y) over time (X).</p>
          </div>
        </div>
        <Suspense fallback={
          <div className="no-data-placeholder" style={{ minHeight: '320px' }}>
            <span>Initializing 3D Analytics Engine...</span>
          </div>
        }>
          <Plotly3DChart 
            filteredTasks={successfulCompletions} 
            timeframe={timeframe} 
            categories={CATEGORIES} 
            selectedDayValue={selectedDayValue}
            selectedWeekValue={selectedWeekValue}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            currentDate={currentDate}
            selectableWeeks={selectableWeeks}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default ReportsDashboard;
