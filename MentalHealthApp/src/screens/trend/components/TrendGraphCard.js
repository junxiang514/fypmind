import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

function moodEmoji(score) {
  const n = Math.round(Number(score));
  if (!Number.isFinite(n)) return '';
  if (n <= 1) return '😣';
  if (n === 2) return '😕';
  if (n === 3) return '😌';
  if (n === 4) return '😊';
  return '🤩';
}

function moodLevelLabel(score) {
  const n = Math.round(Number(score));
  if (!Number.isFinite(n)) return '';
  if (n <= 1) return 'Down';
  if (n === 2) return 'Sad';
  if (n === 3) return 'Calm';
  if (n === 4) return 'Happy';
  return 'Excited';
}

export default function TrendGraphCard({ labels, overallSeries, loading = false }) {
  const screenWidth = Dimensions.get('window').width;
  const normalizedSeries = useMemo(
    () => (overallSeries || []).map((v) => {
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) return 0;
      return Number(Math.min(5, Math.max(1, n)).toFixed(2));
    }),
    [overallSeries]
  );
  const pointCount = Math.max(labels.length, normalizedSeries.length, 1);
  const scaleFloor = Array(pointCount).fill(1);
  const scaleCeiling = Array(pointCount).fill(5);

  const data = {
    labels: labels.length ? labels : ['No data'],
    datasets: [
      {
        data: normalizedSeries.length ? normalizedSeries : [0],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 3,
      },
      {
        data: scaleFloor,
        color: () => 'rgba(0,0,0,0)',
        strokeWidth: 0,
        withDots: false,
      },
      {
        data: scaleCeiling,
        color: () => 'rgba(0,0,0,0)',
        strokeWidth: 0,
        withDots: false,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      strokeDasharray: '3',
      stroke: '#dbeafe',
      strokeWidth: 1,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
      stroke: '#ffffff',
    },
    propsForLabels: {
      fontSize: 9,
      fontWeight: '700',
    },
  };

  const averageScore = normalizedSeries.length
    ? (normalizedSeries.reduce((sum, v) => sum + v, 0) / normalizedSeries.length).toFixed(2)
    : '-';
  const averageScoreDisplay = averageScore === '-' ? '-' : `${averageScore} / 5.00`;

  const improvement = normalizedSeries.length >= 2
    ? `${(((normalizedSeries[normalizedSeries.length - 1] - normalizedSeries[0]) / Math.max(1, normalizedSeries[0])) * 100).toFixed(0)}%`
    : '-';

  return (
    <>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Emotional Analysis Graph</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.loadingText}>Loading analysis...</Text>
          </View>
        ) : (
          <LineChart
            data={data}
            width={screenWidth - 40}
            height={220}
            fromZero={false}
            segments={4}
            yAxisInterval={1}
            yLabelsOffset={10}
            chartConfig={chartConfig}
            formatYLabel={(value) => {
              const n = Number(value);
              if (!Number.isFinite(n)) return value;
              const rounded = Math.round(n);
              return `${moodLevelLabel(rounded)} ${moodEmoji(rounded)}`;
            }}
            bezier
            style={styles.chart}
          />
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{averageScoreDisplay}</Text>
          <Text style={styles.statLabel}>Average Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{improvement}</Text>
          <Text style={styles.statLabel}>Improvement</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  chartTitle: {
    width: '100%',
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '800',
    marginLeft: 0,
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  chart: {
    borderRadius: 16,
    marginTop: 2,
  },
  loadingWrap: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 2,
  },
  loadingText: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 0,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0284c7',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    fontWeight: '600',
  },
});
