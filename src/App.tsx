import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wifi, WifiOff, AlertCircle, Info, Settings, ChevronDown, ChevronUp, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import './App.css';

interface PingData {
  time: string;
  latency: number | null;
  timestamp: number;
  smoothed?: number;
  status?: 'excellent' | 'good' | 'fair' | 'poor';
  id: number; // Unique identifier for each data point
}

interface Stats {
  min: number;
  max: number;
  avg: number;
  jitter: number;
  packetLoss: number;
  trend?: 'improving' | 'stable' | 'degrading';
}

interface AdvancedSettings {
  interval: number;
  smoothing: boolean;
  smoothingFactor: number;
  chartType: 'line' | 'area' | 'bar';
  showGrid: boolean;
  showReferenceLine: boolean;
  animateChart: boolean;
  maxDataPoints: number;
  theme: 'blue' | 'green' | 'purple' | 'orange';
  colorCodedPoints: boolean;
  showDataLabels: boolean;
}

const App: React.FC = () => {
  const [pingData, setPingData] = useState<PingData[]>([]);
  const [currentPing, setCurrentPing] = useState<number | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'disconnected'>('excellent');
  const [stats, setStats] = useState<Stats>({ min: 0, max: 0, avg: 0, jitter: 0, packetLoss: 0 });
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    interval: 500,
    smoothing: false,
    smoothingFactor: 0.3,
    chartType: 'line',
    showGrid: true,
    showReferenceLine: true,
    animateChart: false,
    maxDataPoints: 60,
    theme: 'blue',
    colorCodedPoints: true,
    showDataLabels: false
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const smoothingRef = useRef<number | null>(null);
  const trendRef = useRef<number[]>([]);
  const [chartKey, setChartKey] = useState(0); // Force chart re-render to prevent sliding animations

  const getThemeColors = () => {
    const themes = {
      blue: { primary: '#3B82F6', secondary: '#8B5CF6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' },
      green: { primary: '#10B981', secondary: '#34D399', gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' },
      purple: { primary: '#8B5CF6', secondary: '#A78BFA', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' },
      orange: { primary: '#F59E0B', secondary: '#FB923C', gradient: 'linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)' }
    };
    return themes[advancedSettings.theme];
  };

  const getLatencyStatus = (latency: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (latency < 50) return 'excellent';
    if (latency < 100) return 'good';
    if (latency < 200) return 'fair';
    return 'poor';
  };

  const getStatusColor = (status?: string) => {
    switch (status || connectionStatus) {
      case 'excellent': return '#10B981';
      case 'good': return '#3B82F6';
      case 'fair': return '#F59E0B';
      case 'poor': return '#EF4444';
      case 'disconnected': return '#6B7280';
      default: return '#3B82F6';
    }
  };

  const ping = useCallback(async () => {
    const startTime = performance.now();

    try {
      if (isLocalMode) {
        // Simulate stable local latency with small random variations
        const baseLatency = 15;
        const variation = Math.random() * 4 - 2; // ±2ms variation
        await new Promise(resolve => setTimeout(resolve, baseLatency));

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        const latency = Math.round(baseLatency + variation);

        // Apply smoothing if enabled
        let smoothedValue = latency;
        if (advancedSettings.smoothing) {
          if (smoothingRef.current === null) {
            smoothingRef.current = latency;
          } else {
            smoothingRef.current = smoothingRef.current * (1 - advancedSettings.smoothingFactor) +
              latency * advancedSettings.smoothingFactor;
            smoothedValue = Math.round(smoothingRef.current);
          }
        }

        return {
          time: timeString,
          latency,
          smoothed: smoothedValue,
          timestamp: now.getTime(),
          status: getLatencyStatus(smoothedValue)
        };
      } else {
        // Using a public DNS server for ping simulation
        await fetch('https://cloudflare-dns.com/dns-query?name=example.com', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });

        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        // Apply smoothing if enabled
        let smoothedValue = latency;
        if (advancedSettings.smoothing) {
          if (smoothingRef.current === null) {
            smoothingRef.current = latency;
          } else {
            smoothingRef.current = smoothingRef.current * (1 - advancedSettings.smoothingFactor) +
              latency * advancedSettings.smoothingFactor;
            smoothedValue = Math.round(smoothingRef.current);
          }
        }

        return {
          time: timeString,
          latency,
          smoothed: smoothedValue,
          timestamp: now.getTime(),
          status: getLatencyStatus(smoothedValue)
        };
      }
    } catch (error) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      return { time: timeString, latency: null, timestamp: now.getTime() };
    }
  }, [isLocalMode, advancedSettings.smoothing, advancedSettings.smoothingFactor]);

  const calculateStats = useCallback((data: PingData[]) => {
    const validPings = data.filter(d => d.latency !== null).map(d =>
      advancedSettings.smoothing && d.smoothed !== undefined ? d.smoothed : d.latency as number
    );

    if (validPings.length === 0) {
      return { min: 0, max: 0, avg: 0, jitter: 0, packetLoss: 100, trend: 'stable' as const };
    }

    const min = Math.min(...validPings);
    const max = Math.max(...validPings);
    const avg = validPings.reduce((a, b) => a + b, 0) / validPings.length;

    // Calculate jitter (average deviation)
    let jitter = 0;
    if (validPings.length > 1) {
      for (let i = 1; i < validPings.length; i++) {
        jitter += Math.abs(validPings[i] - validPings[i - 1]);
      }
      jitter = jitter / (validPings.length - 1);
    }

    const packetLoss = ((data.length - validPings.length) / data.length) * 100;

    // Calculate trend
    trendRef.current.push(avg);
    if (trendRef.current.length > 10) {
      trendRef.current.shift();
    }

    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (trendRef.current.length >= 5) {
      const recentAvg = trendRef.current.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const oldAvg = trendRef.current.slice(0, 5).reduce((a, b) => a + b, 0) / 5;

      if (recentAvg < oldAvg * 0.9) trend = 'improving';
      else if (recentAvg > oldAvg * 1.1) trend = 'degrading';
    }

    return { min, max, avg: Math.round(avg), jitter: Math.round(jitter), packetLoss: Math.round(packetLoss), trend };
  }, [advancedSettings.smoothing]);

  const updateConnectionStatus = useCallback((latency: number | null, jitter: number) => {
    if (latency === null) {
      setConnectionStatus('disconnected');
    } else if (latency < 50 && jitter < 10) {
      setConnectionStatus('excellent');
    } else if (latency < 100 && jitter < 20) {
      setConnectionStatus('good');
    } else if (latency < 200 && jitter < 50) {
      setConnectionStatus('fair');
    } else {
      setConnectionStatus('poor');
    }
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      const runPing = async () => {
        const result = await ping();

        setPingData(prev => {
          const newData = [...prev, result];
          let isAtMaxCapacity = false;

          // Keep only last N data points based on settings
          if (newData.length > advancedSettings.maxDataPoints) {
            newData.shift();
            isAtMaxCapacity = true;
          }

          // Force chart re-render when we hit max capacity to prevent sliding animations
          if (isAtMaxCapacity && advancedSettings.animateChart) {
            setChartKey(prevKey => prevKey + 1);
          }

          const newStats = calculateStats(newData);
          setStats(newStats);
          updateConnectionStatus(result.latency, newStats.jitter);

          return newData;
        });

        setCurrentPing(result.smoothed !== undefined && advancedSettings.smoothing ? result.smoothed : result.latency);
      };

      // Run immediately
      runPing();

      // Then run at specified interval
      intervalRef.current = setInterval(runPing, advancedSettings.interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      smoothingRef.current = null;
      trendRef.current = [];
      setChartKey(0); // Reset chart key when monitoring stops
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, ping, calculateStats, updateConnectionStatus, advancedSettings.interval, advancedSettings.maxDataPoints, advancedSettings.smoothing, advancedSettings.animateChart]);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'disconnected': return <WifiOff size={20} />;
      case 'poor': return <AlertCircle size={20} />;
      default: return <Wifi size={20} />;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <motion.div
          className="custom-tooltip"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          <p className="tooltip-time">{data.time}</p>
          <p className="tooltip-latency" style={{ color: getStatusColor(data.status) }}>
            {data.latency !== null ? `${payload[0].value}ms` : 'Failed'}
          </p>
          {advancedSettings.smoothing && data.latency !== data.smoothed && (
            <p className="tooltip-raw">Raw: {data.latency}ms</p>
          )}
          {data.status && (
            <p className="tooltip-status" style={{ color: getStatusColor(data.status) }}>
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </p>
          )}
        </motion.div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!advancedSettings.colorCodedPoints || !payload.status) return null;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill={getStatusColor(payload.status)}
        stroke={getStatusColor(payload.status)}
        strokeWidth={1}
      />
    );
  };

  const renderChart = () => {
    const dataKey = advancedSettings.smoothing ? 'smoothed' : 'latency';
    const themeColors = getThemeColors();

    const commonProps = {
      data: pingData,
      margin: { top: 5, right: 5, left: 5, bottom: 5 }
    };

    // Only animate when we're still filling up the chart (not at max capacity)
    // This prevents the sliding animation issue while keeping new point animations
    const shouldAnimate = advancedSettings.animateChart && pingData.length < advancedSettings.maxDataPoints;

    switch (advancedSettings.chartType) {
      case 'area':
        return (
          <AreaChart key={chartKey} {...commonProps}>
            {advancedSettings.showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            )}
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              domain={[0, 'dataMax + 50']}
            />
            <Tooltip content={<CustomTooltip />} />
            {advancedSettings.showReferenceLine && (
              <ReferenceLine y={stats.avg} stroke="#6B7280" strokeDasharray="5 5" />
            )}
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColors.primary} stopOpacity={0.8} />
                <stop offset="95%" stopColor={themeColors.primary} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={themeColors.primary}
              fill="url(#colorGradient)"
              strokeWidth={2}
              isAnimationActive={shouldAnimate}
              animationDuration={shouldAnimate ? 300 : 0}
              animationBegin={0}
              animationEasing="ease-out"
              connectNulls={false}
              dot={advancedSettings.colorCodedPoints ? <CustomDot /> : false}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart key={chartKey} {...commonProps}>
            {advancedSettings.showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            )}
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              domain={[0, 'dataMax + 50']}
            />
            <Tooltip content={<CustomTooltip />} />
            {advancedSettings.showReferenceLine && (
              <ReferenceLine y={stats.avg} stroke="#6B7280" strokeDasharray="5 5" />
            )}
            <Bar
              dataKey={dataKey}
              isAnimationActive={shouldAnimate}
              animationDuration={shouldAnimate ? 300 : 0}
              animationBegin={0}
              animationEasing="ease-out"
              radius={[4, 4, 0, 0]}
            >
              {advancedSettings.colorCodedPoints && pingData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        );

      default:
        return (
          <LineChart key={chartKey} {...commonProps}>
            {advancedSettings.showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            )}
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              domain={[0, 'dataMax + 50']}
            />
            <Tooltip content={<CustomTooltip />} />
            {advancedSettings.showReferenceLine && (
              <ReferenceLine y={stats.avg} stroke="#6B7280" strokeDasharray="5 5" />
            )}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={themeColors.primary}
              strokeWidth={2}
              dot={advancedSettings.colorCodedPoints ? <CustomDot /> : false}
              isAnimationActive={shouldAnimate}
              animationDuration={shouldAnimate ? 300 : 0}
              animationBegin={0}
              animationEasing="ease-out"
              connectNulls={false}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="app">
      <div className="container">
        <motion.header
          className="header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <div className="logo">
              <motion.div
                animate={{ rotate: isMonitoring ? 360 : 0 }}
                transition={{ duration: 2, repeat: isMonitoring ? Infinity : 0, ease: "linear" }}
              >
                <Activity size={32} strokeWidth={2.5} />
              </motion.div>
              <h1>Pingly</h1>
            </div>
            <p className="tagline">Network Stability Monitor</p>
          </div>
        </motion.header>

        <motion.div
          className="status-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            borderColor: `${getStatusColor()}20`,
            boxShadow: `0 20px 25px -5px ${getStatusColor()}10, 0 10px 10px -5px ${getStatusColor()}05`
          }}
        >
          <div className="status-header">
            <motion.div
              className="status-indicator"
              style={{ backgroundColor: getStatusColor() }}
              animate={{
                boxShadow: isMonitoring ?
                  [`0 0 20px ${getStatusColor()}40`, `0 0 40px ${getStatusColor()}20`, `0 0 20px ${getStatusColor()}40`] :
                  `0 0 20px ${getStatusColor()}40`
              }}
              transition={{
                duration: 2,
                repeat: isMonitoring ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              {getStatusIcon()}
            </motion.div>
            <div className="status-info">
              <h2>Connection Status</h2>
              <p className="status-text" style={{ color: getStatusColor() }}>
                {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </p>
              {stats.trend && (
                <p className="status-trend">
                  {stats.trend === 'improving' && <TrendingDown size={14} />}
                  {stats.trend === 'degrading' && <TrendingUp size={14} />}
                  {stats.trend === 'stable' && <Zap size={14} />}
                  <span>{stats.trend.charAt(0).toUpperCase() + stats.trend.slice(1)}</span>
                </p>
              )}
            </div>
            <AnimatePresence mode="wait">
              {currentPing !== null && (
                <motion.div
                  className="current-ping"
                  key={currentPing}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.span
                    className="ping-value"
                    animate={{ color: getStatusColor(getLatencyStatus(currentPing)) }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentPing}
                  </motion.span>
                  <span className="ping-unit">ms</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="control-buttons">
            <button
              className={`monitor-button ${isMonitoring ? 'monitoring' : ''}`}
              onClick={() => setIsMonitoring(!isMonitoring)}
              style={{ background: isMonitoring ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : getThemeColors().gradient }}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
            <label className="mode-toggle">
              <input
                type="checkbox"
                checked={isLocalMode}
                onChange={(e) => setIsLocalMode(e.target.checked)}
                disabled={isMonitoring}
              />
              <span className="toggle-slider" style={isLocalMode ? { background: getThemeColors().gradient } : {}}></span>
              <span className="toggle-label">Local Mode</span>
            </label>
          </div>

          <button
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings size={16} />
            <span>Advanced Settings</span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                className="advanced-settings"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="settings-grid">
                  <div className="setting-group">
                    <label>Update Interval</label>
                    <div className="interval-controls">
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        value={advancedSettings.interval}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
                        disabled={isMonitoring}
                        style={{
                          background: `linear-gradient(to right, ${getThemeColors().primary} 0%, ${getThemeColors().primary} ${((advancedSettings.interval - 100) / 1900) * 100}%, #475569 ${((advancedSettings.interval - 100) / 1900) * 100}%, #475569 100%)`
                        }}
                      />
                      <span>{advancedSettings.interval}ms</span>
                    </div>
                  </div>

                  <div className="setting-group">
                    <label>Chart Type</label>
                    <select
                      value={advancedSettings.chartType}
                      onChange={(e) => setAdvancedSettings(prev => ({ ...prev, chartType: e.target.value as any }))}
                    >
                      <option value="line">Line Chart</option>
                      <option value="area">Area Chart</option>
                      <option value="bar">Bar Chart</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label>Theme</label>
                    <select
                      value={advancedSettings.theme}
                      onChange={(e) => setAdvancedSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="orange">Orange</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label>Data Points</label>
                    <div className="interval-controls">
                      <input
                        type="range"
                        min="30"
                        max="120"
                        step="10"
                        value={advancedSettings.maxDataPoints}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, maxDataPoints: parseInt(e.target.value) }))}
                        style={{
                          background: `linear-gradient(to right, ${getThemeColors().primary} 0%, ${getThemeColors().primary} ${((advancedSettings.maxDataPoints - 30) / 90) * 100}%, #475569 ${((advancedSettings.maxDataPoints - 30) / 90) * 100}%, #475569 100%)`
                        }}
                      />
                      <span>{advancedSettings.maxDataPoints}</span>
                    </div>
                  </div>

                  <div className="setting-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSettings.smoothing}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, smoothing: e.target.checked }))}
                      />
                      <span>Enable Smoothing</span>
                    </label>
                  </div>

                  {advancedSettings.smoothing && (
                    <div className="setting-group">
                      <label>Smoothing Factor</label>
                      <div className="interval-controls">
                        <input
                          type="range"
                          min="0.1"
                          max="0.9"
                          step="0.1"
                          value={advancedSettings.smoothingFactor}
                          onChange={(e) => setAdvancedSettings(prev => ({ ...prev, smoothingFactor: parseFloat(e.target.value) }))}
                          style={{
                            background: `linear-gradient(to right, ${getThemeColors().primary} 0%, ${getThemeColors().primary} ${((advancedSettings.smoothingFactor - 0.1) / 0.8) * 100}%, #475569 ${((advancedSettings.smoothingFactor - 0.1) / 0.8) * 100}%, #475569 100%)`
                          }}
                        />
                        <span>{advancedSettings.smoothingFactor}</span>
                      </div>
                    </div>
                  )}

                  <div className="setting-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSettings.colorCodedPoints}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, colorCodedPoints: e.target.checked }))}
                      />
                      <span>Color-Coded Points</span>
                    </label>
                  </div>

                  <div className="setting-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSettings.showGrid}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, showGrid: e.target.checked }))}
                      />
                      <span>Show Grid</span>
                    </label>
                  </div>

                  <div className="setting-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSettings.showReferenceLine}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, showReferenceLine: e.target.checked }))}
                      />
                      <span>Show Average Line</span>
                    </label>
                  </div>

                  <div className="setting-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSettings.animateChart}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, animateChart: e.target.checked }))}
                      />
                      <span>Animate Chart</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="info-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Info size={16} />
          <p>
            {isLocalMode
              ? "Local Mode simulates stable latency for testing. Switch off to measure real network conditions."
              : "Measuring real network latency to Cloudflare DNS. Spikes are normal and reflect actual network conditions, browser throttling, or system load."}
            {advancedSettings.smoothing && " Smoothing is enabled to reduce noise."}
            {advancedSettings.colorCodedPoints && " Points are color-coded by quality."}
          </p>
        </motion.div>

        <motion.div
          className="chart-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="chart-header">
            <h3>Latency Over Time</h3>
            {advancedSettings.colorCodedPoints && (
              <div className="legend">
                <span className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#10B981' }}></span>
                  Excellent
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#3B82F6' }}></span>
                  Good
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#F59E0B' }}></span>
                  Fair
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#EF4444' }}></span>
                  Poor
                </span>
              </div>
            )}
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="stats-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div
            className="stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h4>Min Latency</h4>
            <p className="stat-value" style={{ color: getStatusColor(getLatencyStatus(stats.min)) }}>
              {stats.min}<span className="stat-unit">ms</span>
            </p>
          </motion.div>
          <motion.div
            className="stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h4>Max Latency</h4>
            <p className="stat-value" style={{ color: getStatusColor(getLatencyStatus(stats.max)) }}>
              {stats.max}<span className="stat-unit">ms</span>
            </p>
          </motion.div>
          <motion.div
            className="stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h4>Average</h4>
            <p className="stat-value" style={{ color: getStatusColor(getLatencyStatus(stats.avg)) }}>
              {stats.avg}<span className="stat-unit">ms</span>
            </p>
          </motion.div>
          <motion.div
            className="stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h4>Jitter</h4>
            <p className="stat-value">{stats.jitter}<span className="stat-unit">ms</span></p>
          </motion.div>
          <motion.div
            className="stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h4>Packet Loss</h4>
            <p className="stat-value" style={{ color: stats.packetLoss > 0 ? '#EF4444' : '#10B981' }}>
              {stats.packetLoss}<span className="stat-unit">%</span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default App;
