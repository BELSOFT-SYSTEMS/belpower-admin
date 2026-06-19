import {
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaTimesCircle,
  FaHome,
  FaBan,
  FaUndo,
} from 'react-icons/fa';
import type { TransactionsListStats } from '@/types/adminTransactions';
import { formatPrice } from '@/utils/FormatPrice';

export type TransactionPageStatCard = {
  key: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  border: string;
};

function formatCount(count: number): string {
  return count.toLocaleString();
}

function buildCountStatCards(
  stats: TransactionsListStats,
  totalTransactionsFallback?: number
): TransactionPageStatCard[] {
  const totalCount =
    stats.totalTransactions.count > 0
      ? stats.totalTransactions.count
      : (totalTransactionsFallback ?? stats.totalTransactions.count);

  return [
    {
      key: 'totalTransactions',
      icon: <FaClipboardList className="text-blue-500 text-xl" />,
      label: 'Total transactions',
      value: formatCount(totalCount),
      border: 'border-blue-300',
    },
    {
      key: 'completedTransactions',
      icon: <FaCheckCircle className="text-green-500 text-xl" />,
      label: 'Completed transactions',
      value: formatCount(stats.completedTransactions.count),
      border: 'border-green-300',
    },
    {
      key: 'pendingTransactions',
      icon: <FaClock className="text-yellow-500 text-xl" />,
      label: 'Pending transactions',
      value: formatCount(stats.pendingTransactions.count),
      border: 'border-yellow-300',
    },
    {
      key: 'refundTransactions',
      icon: <FaUndo className="text-purple-500 text-xl" />,
      label: 'Refunds',
      value: formatCount(stats.refundTransactions.count),
      border: 'border-purple-300',
    },
  ];
}

function buildMoneyStatCards(stats: TransactionsListStats): TransactionPageStatCard[] {
  if (!stats.totalVolume || !stats.completed || !stats.pending || !stats.refunds) {
    return [];
  }

  return [
    {
      key: 'volume',
      icon: <FaHome className="text-blue-500 text-xl" />,
      label: 'Total volume',
      value: formatPrice(stats.totalVolume.amount),
      border: 'border-blue-300',
    },
    {
      key: 'completedVolume',
      icon: <FaCheckCircle className="text-green-500 text-xl" />,
      label: 'Completed volume',
      value: formatPrice(stats.completed.amount),
      subtitle: `${formatCount(stats.completed.count)} transactions`,
      border: 'border-green-300',
    },
    {
      key: 'pendingVolume',
      icon: <FaClock className="text-yellow-500 text-xl" />,
      label: 'Pending volume',
      value: formatPrice(stats.pending.amount),
      subtitle: `${formatCount(stats.pending.count)} transactions`,
      border: 'border-yellow-300',
    },
    {
      key: 'refundsVolume',
      icon: <FaUndo className="text-purple-500 text-xl" />,
      label: 'Refund volume',
      value: formatPrice(stats.refunds.amount),
      subtitle: `${formatCount(stats.refunds.count)} transactions`,
      border: 'border-purple-300',
    },
  ];
}

function buildOperationalStatCards(stats: TransactionsListStats): TransactionPageStatCard[] {
  return [
    {
      key: 'blocked',
      icon: <FaBan className="text-red-500 text-xl" />,
      label: 'Blocked',
      value: formatCount(stats.blocked.count),
      border: 'border-red-300',
    },
    {
      key: 'underReview',
      icon: <FaClipboardList className="text-orange-500 text-xl" />,
      label: 'Under review',
      value: formatCount(stats.underReview.count),
      border: 'border-orange-300',
    },
    {
      key: 'flagged',
      icon: <FaTimesCircle className="text-amber-500 text-xl" />,
      label: 'Flagged',
      value: formatCount(stats.flagged.count),
      border: 'border-amber-300',
    },
  ];
}

type BuildTransactionPageStatCardsOptions = {
  totalTransactionsFallback?: number;
};

export function buildTransactionPageStatCards(
  stats: TransactionsListStats,
  canViewMoneyStats: boolean,
  options?: BuildTransactionPageStatCardsOptions
): TransactionPageStatCard[] {
  const countCards = buildCountStatCards(stats, options?.totalTransactionsFallback);
  const operationalCards = buildOperationalStatCards(stats);

  if (canViewMoneyStats) {
    return [...buildMoneyStatCards(stats), ...countCards, ...operationalCards];
  }

  return [...countCards, ...operationalCards];
}
