'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { FaCheckCircle, FaTimesCircle, FaCircle, FaSyncAlt } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminServiceAvailability.css';
import '@/styles/adminShared.css';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminServiceReliability } from '@/hooks/useAdminServiceReliability';
import type { ReliabilityFilter } from '@/types/adminServiceReliability';
import {
  RELIABILITY_FILTERS,
  filterReliabilityProviders,
  getReliabilityHealthConfig,
  getReliabilityProviderIcon,
  getReliabilityProviderName,
} from '@/utils/serviceReliabilityDisplay';

const HEALTH_ICONS = {
  healthy: FaCheckCircle,
  watch: FaCircle,
  degraded: FaCircle,
  offline: FaTimesCircle,
} as const;

export default function ServiceAvailabilityPage() {
  const { canAccess } = useAdminAuth();
  const canViewPage = canAccess('services.availability');
  const [activeFilter, setActiveFilter] = useState<ReliabilityFilter>('ALL');

  const { data, isLoading, isRefreshing, error, refresh } = useAdminServiceReliability({
    enabled: canViewPage,
  });

  const filteredProviders = useMemo(() => {
    if (!data) return [];
    return filterReliabilityProviders(data.providers, activeFilter);
  }, [data, activeFilter]);

  const summary = data?.summary ?? {
    healthy: 0,
    watch: 0,
    degraded: 0,
    offline: 0,
    total: 0,
  };

  const availabilityStats = [
    {
      key: 'healthy',
      icon: <FaCheckCircle className="text-green-500 text-xl" />,
      label: 'Healthy',
      value: String(summary.healthy),
      border: 'border-green-200',
    },
    {
      key: 'watch',
      icon: <FaCircle className="text-amber-500 text-xl" />,
      label: 'Watch',
      value: String(summary.watch),
      border: 'border-amber-200',
    },
    {
      key: 'degraded',
      icon: <FaCircle className="text-orange-500 text-xl" />,
      label: 'Degraded',
      value: String(summary.degraded),
      border: 'border-orange-200',
    },
    {
      key: 'offline',
      icon: <FaTimesCircle className="text-red-500 text-xl" />,
      label: 'Offline',
      value: String(summary.offline),
      border: 'border-red-200',
    },
  ];

  if (!canViewPage) {
    return (
      <div className="service_availability_page">
        <h1>Service Availability</h1>
        <p className="empty_fallback">You do not have access to service availability.</p>
      </div>
    );
  }

  return (
    <div className="service_availability_page">
      <div className="service_page_header">
        <div>
          <h1>Service Availability</h1>
          <p className="page_subtitle">
            Live BelPower provider reliability for electricity, data, cable TV, and airtime.
          </p>
        </div>
        <div className="service_page_actions">
          {data?.fetchedAt && (
            <p className="service_last_updated">
              Updated {new Date(data.fetchedAt).toLocaleString()}
            </p>
          )}
          <button
            type="button"
            className="service_refresh_btn"
            onClick={() => refresh()}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FaSyncAlt />
            )}
            Refresh
          </button>
        </div>
      </div>

      <section className="stats_section">
        {isLoading && !data
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="stats_card border-gray-200">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <h2>—</h2>
              </div>
            ))
          : availabilityStats.map((stat) => (
              <div key={stat.key} className={`${stat.border} stats_card`}>
                <div className="stats_card_top">
                  <p>{stat.label}</p>
                  {stat.icon}
                </div>
                <h2>{stat.value}</h2>
              </div>
            ))}
      </section>

      <div className="filter_bar">
        {RELIABILITY_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`filter_btn ${activeFilter === filter.value ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="service_error_panel">
          <p>{error}</p>
          <button type="button" className="service_refresh_btn" onClick={() => refresh()}>
            Try again
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="service_loading_panel">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p>Loading provider reliability…</p>
        </div>
      ) : (
        <div className="services_grid">
          {filteredProviders.length > 0 ? (
            filteredProviders.map((provider) => {
              const health = getReliabilityHealthConfig(provider.health);
              const HealthIcon = HEALTH_ICONS[provider.health];

              return (
                <article
                  key={`${provider.vertical}-${provider.discoCode}`}
                  className="service_card"
                >
                  <div className="service_card_header">
                    <div className="service_identity">
                      <div className="service_logo_wrap">
                        <Image
                          src={getReliabilityProviderIcon(provider)}
                          alt={getReliabilityProviderName(provider)}
                          width={40}
                          height={40}
                          onError={(e) => {
                            e.currentTarget.src = '/electricity.png';
                          }}
                        />
                      </div>
                      <div>
                        <h3>{getReliabilityProviderName(provider)}</h3>
                        <p>
                          {provider.verticalLabel} · {provider.discoCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`service_avail_badge ${health.badgeClass}`}>
                    {health.badge}
                  </div>

                  <dl className="service_meta">
                    <div>
                      <dt>Success</dt>
                      <dd>{provider.successPercentage}%</dd>
                    </div>
                    <div>
                      <dt>Failure</dt>
                      <dd>{provider.failurePercentage}%</dd>
                    </div>
                    <div>
                      <dt>Pending</dt>
                      <dd>{provider.pendingPercentage}%</dd>
                    </div>
                    <div>
                      <dt>Online</dt>
                      <dd>{provider.providerOnline ? 'Yes' : 'No'}</dd>
                    </div>
                  </dl>

                  <div className="reliability_bar" aria-hidden>
                    <span
                      className="reliability_bar_success"
                      style={{ width: `${provider.successPercentage}%` }}
                    />
                    <span
                      className="reliability_bar_pending"
                      style={{ width: `${provider.pendingPercentage}%` }}
                    />
                    <span
                      className="reliability_bar_failure"
                      style={{ width: `${provider.failurePercentage}%` }}
                    />
                  </div>

                  <div className={`service_health_status ${health.statusClass}`}>
                    <HealthIcon className="service_health_icon" aria-hidden />
                    <span>{health.label}</span>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="empty_fallback">No providers match this filter.</p>
          )}
        </div>
      )}
    </div>
  );
}
