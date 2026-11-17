import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { FloatingTabBar } from '@/components/ui/FloatingTabBar';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fmtUSD } from '@/constants/baskets';
import { COLORS, RADIUS, TYPE } from '@/constants/theme';
import { useBalances } from '@/hooks/useBalances';
import { useTransactions } from '@/hooks/useTransactions';
import { StyleSheet, Text, View } from 'react-native';

const SHADES = [COLORS.accent, '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

export function PerformanceScreen() {
  const { holdings, totalValue, unsupportedAssets, error: balancesError } = useBalances();
  const {
    data: transactions = [],
    isLoading,
    isError: transactionsError,
    error: transactionError,
  } = useTransactions();
  const purchaseActivity = transactions.filter(
    (transaction) =>
      transaction.type === 'dca_buy' || transaction.type === 'instant_buy',
  );
  const completedOrderAmount = purchaseActivity
    .filter((transaction) => transaction.status === 'completed')
    .reduce(
      (total, transaction) => total + Number(transaction.amount_usd || 0),
      0,
    );
  const recentPurchases = purchaseActivity.slice(0, 10);

  return (
    <Screen title="Performance" tabs={<FloatingTabBar />}>
      <Container style={styles.mainCard}>
        <Text style={styles.label}>Current wallet value</Text>
        <Text style={[TYPE.big, styles.totalValue]}>
          {balancesError
            ? 'Unavailable'
            : holdings.length > 0 && holdings.every((holding) => holding.usdValue == null)
              ? 'Price unavailable'
              : fmtUSD(totalValue)}
        </Text>
        <Text style={styles.note}>
          {balancesError
            ? 'Couldn’t load wallet balances. Please try again later.'
            : 'Live known wallet value is shown below. Profit and loss aren’t calculated.'}
          {unsupportedAssets.length > 0
            ? ` Not tracked on Base: ${unsupportedAssets.join(', ')}.`
            : ''}
        </Text>
      </Container>

      <SectionHeader title="Completed purchase orders" />
      <Container style={styles.allocationCard}>
        <Text style={styles.totalValue}>
          {isLoading ? 'Loading…' : transactionsError ? 'Unavailable' : fmtUSD(completedOrderAmount)}
        </Text>
        <Text style={styles.note}>
          {transactionsError
            ? transactionError instanceof Error
              ? transactionError.message
              : 'Couldn’t load account activity.'
            : 'Total value recorded for completed purchase orders in the latest 50 account transactions. This is not a return or current investment value.'}
        </Text>
      </Container>

      <SectionHeader title="Recent purchase activity" />
      <Container flush style={styles.activityCard}>
        {isLoading ? (
          <Text style={styles.note}>Loading account activity…</Text>
        ) : transactionsError ? (
          <Text style={styles.note}>
            {transactionError instanceof Error
              ? transactionError.message
              : 'Couldn’t load account activity.'}
          </Text>
        ) : recentPurchases.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No completed purchases yet"
            message="Your completed purchases will appear here."
          />
        ) : (
          recentPurchases.map((transaction, index) => (
            <ListRow
              key={transaction.id}
              icon="arrow-up-outline"
              iconColor={COLORS.accent}
              title={transaction.type === 'dca_buy' ? 'Recurring crypto purchase' : 'Crypto purchase'}
              subtitle={new Date(transaction.created_at).toLocaleDateString()}
              value={fmtUSD(Number(transaction.amount_usd))}
              valueSub={transaction.status}
              last={index === recentPurchases.length - 1}
            />
          ))
        )}
      </Container>

      <SectionHeader title="Current allocation" />

      {balancesError ? (
        <Container style={styles.allocationCard}>
          <Text style={styles.note}>Couldn’t load current wallet allocation.</Text>
        </Container>
      ) : holdings.length === 0 ? (
        <Container style={styles.allocationCard}>
          <Text style={styles.note}>No supported Base assets were found in this wallet.</Text>
        </Container>
      ) : (
        <Container style={styles.allocationCard}>
          <View style={styles.bar}>
            {holdings.map((holding, index) => (
              <View
                key={holding.symbol}
                style={{ flex: holding.usdValue ?? 0, backgroundColor: SHADES[index % SHADES.length] }}
              />
            ))}
          </View>

          <View style={styles.legend}>
            {holdings.map((holding, index) => {
              const percentage = holding.usdValue != null && totalValue > 0
                ? (holding.usdValue / totalValue) * 100
                : null;
              return (
                <View key={holding.symbol} style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: SHADES[index % SHADES.length] }]}
                  />
                  <Text style={styles.legendName}>{holding.symbol}</Text>
                  <Text style={styles.legendPct}>
                    {percentage == null ? 'Price unavailable' : `${percentage.toFixed(1)}%`}
                  </Text>
                </View>
              );
            })}
          </View>
        </Container>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    padding: 20,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: COLORS.t2,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.t1,
    letterSpacing: -1,
    marginTop: 4,
  },
  note: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.t2,
    lineHeight: 18,
  },
  allocationCard: {
    padding: 20,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  activityCard: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 24,
    gap: 16,
  },
  legendRow: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.t1,
  },
  legendPct: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.t1,
  },
});
