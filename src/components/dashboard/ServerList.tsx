'use client';

import { useState } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { signIn } from 'next-auth/react';
import { Server, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import styles from './ServerList.module.css';
import ConnectModal from './ConnectModal';
import ServerDetailsModal from './ServerDetailsModal';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  connected: boolean;
}

const fetcher = async (url: string) => {
  const isRefresh = url.includes('?forceRefresh=');
  const cacheKey = 'discord_servers_cache';

  // 1. If not a forced refresh, try to return from browser cache first
  if (!isRefresh) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  // 2. Otherwise, make the API call
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Failed to fetch');
    (error as any).status = res.status;
    throw error;
  }

  const data = await res.json();

  // 3. Save response to browser cache for next time
  localStorage.setItem(cacheKey, JSON.stringify(data));
  return data;
};

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

const getDeterministicColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

export default function ServerList() {
  const [activeTab, setActiveTab] = useState<'all' | 'connected'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [connectingGuild, setConnectingGuild] = useState<{ id: string, name: string, icon: string | null } | null>(null);
  const [selectedGuildForLogs, setSelectedGuildForLogs] = useState<{ id: string, name: string } | null>(null);

  // URL changes when refreshCount changes, bypassing SWR cache
  const url = refreshCount > 0 ? `/api/discord/guilds?forceRefresh=${refreshCount}` : '/api/discord/guilds';

  const { data: guilds, error, isLoading, mutate } = useSWR<Guild[]>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false, // Don't refetch in background if we have stale cache
  });

  const allServers = guilds || [];
  const connectedServers = allServers.filter(g => g.connected);
  const displayServers = activeTab === 'all' ? allServers : connectedServers;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshCount(c => c + 1); // Forces a new URL key, which triggers fetcher skipping localStorage
    setIsRefreshing(false);
  };

  if (error) {
    const isAuthError = error.status === 401;
    return (
      <div className={styles.container}>
        <div className={styles.errorState} style={{ width: '100%' }}>
          <AlertCircle size={32} color="#fca5a5" />
          <p>{error.message}</p>
          {isAuthError && (
            <button className={styles.loginButton} onClick={() => signIn('discord')}>
              Log in again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <button
          className={`${styles.tabButton} ${activeTab === 'all' ? styles.active : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span>All Servers</span>
          <span className={styles.badge}>{isLoading ? '-' : allServers.length}</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'connected' ? styles.active : ''}`}
          onClick={() => setActiveTab('connected')}
        >
          <span>Connected</span>
          <span className={styles.badge}>{isLoading ? '-' : connectedServers.length}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h2>{activeTab === 'all' ? 'All Servers' : 'Connected Servers'}</h2>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            title="Refresh servers"
          >
            <RefreshCw size={16} className={(isLoading || isRefreshing) ? styles.spin : ''} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.skeletonIcon} ${styles.shimmer}`} />
                  <div className={styles.serverInfo}>
                    <div className={`${styles.skeletonName} ${styles.shimmer}`} />
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <div className={`${styles.skeletonButton} ${styles.shimmer}`} />
                </div>
              </div>
            ))}
          </div>
        ) : displayServers.length === 0 ? (
          <div className={styles.emptyState}>
            {activeTab === 'connected' ? (
              <>
                <Server size={48} className={styles.emptyStateIcon} />
                <h3>No connected servers yet</h3>
                <p>Connect a server from the "All Servers" section to get started with Discord Ops.</p>
              </>
            ) : (
              <>
                <Inbox size={48} className={styles.emptyStateIcon} />
                <h3>No servers found</h3>
                <p>You don't have Manage Server permissions in any Discord servers.</p>
              </>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {displayServers.map(guild => (
              <div key={guild.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div
                    className={styles.iconWrapper}
                    style={{ backgroundColor: guild.icon ? 'transparent' : getDeterministicColor(guild.id) }}
                  >
                    {guild.icon ? (
                      <Image
                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                        alt={guild.name}
                        width={48}
                        height={48}
                        className={styles.serverIcon}
                        unoptimized
                      />
                    ) : (
                      <span>{guild.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className={styles.serverInfo}>
                    <h3 className={styles.serverName} title={guild.name}>{guild.name}</h3>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  {guild.connected ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div className={styles.connectedStatus}>
                        <div className={styles.statusDot} />
                        Connected
                      </div>
                      <button
                        onClick={() => setSelectedGuildForLogs({ id: guild.id, name: guild.name })}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Settings & Logs
                      </button>
                    </div>
                  ) : (
                    <button
                      className={styles.connectButton}
                      onClick={() => setConnectingGuild({ id: guild.id, name: guild.name, icon: guild.icon })}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* We no longer render them inline below the grid */}
      </div>

      {connectingGuild && (
        <ConnectModal
          guildId={connectingGuild.id}
          guildName={connectingGuild.name}
          guildIcon={connectingGuild.icon}
          onClose={() => setConnectingGuild(null)}
          onConnect={() => mutate()}
        />
      )}

      {selectedGuildForLogs && (
        <ServerDetailsModal
          guildId={selectedGuildForLogs.id}
          guildName={selectedGuildForLogs.name}
          onClose={() => setSelectedGuildForLogs(null)}
          onDisconnect={(guildId) => {
            mutate(); // Re-fetch the server list so the connected state updates
          }}
        />
      )}
    </div>
  );
}
