// src/screens/app/ActivityScreen.tsx

import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { FloatingTabBar } from '@/components/ui/FloatingTabBar';
import { ListRow } from '@/components/ui/ListRow';
import { Pills } from '@/components/ui/Pills';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fmtUSD } from '@/constants/baskets';
import { COLORS } from '@/constants/theme';
import { useTransactions, type Transaction } from '@/hooks/useTransactions';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface ActivityScreenProps {
  onTab: (key: string) => void;
}

const FILTER_MAP: Record<string, string | undefined> = {
  All: undefined,
  Buys: 'dca_buy',
  Fees: 'fee',
  Withdrawals: 'withdrawal',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function monthLabel(iso: string) {
  const d = new Date(iso);
  return MONTHS[d.getMonth()] ?? '';
}

function dateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ActivityScreen({ onTab }: ActivityScreenProps) {
  const [filter, setFilter] = useState('All');
  const { data: transactions, isLoading } = useTransactions(FILTER_MAP[filter]);

  const tabs = <FloatingTabBar active="activity" onChange={onTab} />;

  const grouped = (transactions ?? []).reduce<Record<string, Transaction[]>>((acc, t) => {
    const month = monthLabel(t.created_at);
    (acc[month] = acc[month] ?? []).push(t);
    return acc;
  }, {});

  return (
    <Screen title="Activity" tabs={tabs}>
      <Pills
        options={['All', 'Buys', 'Fees', 'Withdrawals']}
        value={filter}
        onChange={setFilter}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} />
        </View>
      ) : (transactions ?? []).length === 0 ? (
        <Container style={{ marginTop: 24 }}>
          <EmptyState
            icon="receipt-outline"
            title="No activity yet"
            message="Your buys, fees, and withdrawals will show up here."
          />
        </Container>
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <View key={month}>
            <SectionHeader title={month} />
            <Container flush>
              {items.map((t, i) => (
                <ListRow
                  key={t.id}
                  icon={t.type === 'dca_buy' ? 'arrow-down-outline' : 'pricetag-outline'}
                  iconColor={COLORS.up}
                  title={
                    t.type === 'dca_buy'
                      ? 'Monthly buy'
                      : t.type === 'fee'
                        ? 'Service fee'
                        : t.type === 'subscription'
                          ? 'Subscription'
                          : 'Withdrawal'
                  }
                  subtitle={`${dateLabel(t.created_at)}${t.status ? ` · ${t.status}` : ''}`}
                  value={(t.type === 'fee' || t.type === 'withdrawal' ? '−' : '') + fmtUSD(t.amount_usd)}
                  valueSub={t.type.replace('_', ' ')}
                  last={i === items.length - 1}
                />
              ))}
            </Container>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 60, alignItems: 'center' },
});