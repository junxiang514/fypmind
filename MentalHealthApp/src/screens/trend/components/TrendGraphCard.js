import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

export default function TrendGraphCard({
  labels,
  overallSeries,
  loading = false,
  insightLoading = false,
  aiInsight = '',
  hasData = false,
}) {
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

  const processedLabels = useMemo(() => {
    if (!labels || labels.length === 0) return ['No data'];
    const count = labels.length;
    const maxLabels = 5;
    if (count <= maxLabels) return labels;

    const step = Math.floor(count / (maxLabels - 1)) || 1;
    return labels.map((label, idx) => {
      // Show first, last, and intermediate labels at step intervals if not too close to the end
      if (idx === 0 || idx === count - 1 || (idx % step === 0 && (count - 1 - idx) >= step - 1)) {
        return label;
      }
      return '';
    });
  }, [labels]);

  const data = {
    labels: processedLabels,
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

  return (
    <>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Emotional Analysis Graph</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.loadingText}>Loading Graph...</Text>
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

        <View style={styles.divider} />

        <View style={styles.insightRow}>
          <Image
            source={require('../../../../assets/LumiAvatar.png')}
            style={styles.avatarImage}
          />

          <View style={styles.thoughtDots}>
            <View style={[styles.thoughtDot, styles.thoughtDotSmall]} />
            <View style={[styles.thoughtDot, styles.thoughtDotMedium]} />
          </View>

          <View style={styles.thoughtBubble}>
            <View style={styles.bubbleHeader}>
            </View>


            {insightLoading ? (
              <View style={styles.bubbleLoadingRow}>
                <ActivityIndicator size="small" color="#0284c7" />
                <Text style={styles.bubbleLoadingText}>Thinking...</Text>
              </View>
            ) : (
              <Text style={styles.bubbleText}>
                {aiInsight || (hasData
                  ? 'You are doing great by tracking your wellbeing consistently. Keep this momentum — your insights will become even more powerful and personalized over time.'
                  : 'You are one check-in away from your first personalized insight — let\'s begin and build your momentum.')}
              </Text>
            )}

            <Text style={styles.bubbleDisclaimer}>
              This is an AI-generated message. Please seek professional help if needed.
            </Text>
          </View>
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
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e2e8f0',
    marginTop: 12,
    marginBottom: 12,
  },
  insightRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#F1F5F9',
  },
  thoughtDots: {
    width: 18,
    alignItems: 'center',
    paddingTop: 18,
  },
  thoughtDot: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginVertical: 2,
  },
  thoughtDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  thoughtDotMedium: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  thoughtBubble: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  bubbleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#334155',
    fontWeight: '600',
  },
  bubbleLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  bubbleLoadingText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '700',
  },
  bubbleDisclaimer: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'left',
  },
});
