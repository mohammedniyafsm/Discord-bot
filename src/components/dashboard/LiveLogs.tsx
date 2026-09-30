'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Activity, Clock, FileText, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import styles from './LiveLogs.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LiveLogs({ guildId, guildName }: { guildId: string, guildName: string }) {
  const { data: logs, error, isLoading, mutate } = useSWR(guildId ? `/api/logs?guildId=${guildId}` : null, fetcher, { refreshInterval: 3000 });
  const [filter, setFilter] = useState<string>('all');
  const [retryingIds, setRetryingIds] = useState<Record<string, boolean>>({});

  const handleRetry = async (logId: string) => {
    setRetryingIds(prev => ({ ...prev, [logId]: true }));
    try {
      const res = await fetch(`/api/interactions/${logId}/retry`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Retry failed: ${errorData.error}`);
      }
      mutate();
    } catch (err) {
      alert('Retry failed due to a network error.');
    } finally {
      setRetryingIds(prev => ({ ...prev, [logId]: false }));
    }
  };

  if (error) {
    return <div className={styles.error}>Failed to load logs.</div>;
  }

  const filteredLogs = logs?.filter((log: any) => filter === 'all' || log.commandName === filter);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <Activity size={20} color="#a78bfa" />
          <h2>Live Command Logs for {guildName}</h2>
        </div>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ background: '#1f2937', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem', borderRadius: '4px', fontSize: '0.85rem' }}
        >
          <option value="all">All Commands</option>
          <option value="report">/report only</option>
          <option value="status">/status only</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading && !logs ? (
          <div className={styles.loading}>Loading logs...</div>
        ) : filteredLogs?.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={48} opacity={0.5} />
            <p>No commands have been logged yet.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Command</th>
                <th>Message</th>
                <th>Status</th>
                <th>Mirrored</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs?.map((log: any) => (
                <tr key={log.id}>
                  <td>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.8rem' }}>@{log.username}</strong>
                  </td>
                  <td>
                    <span className={styles.command}>/{log.commandName}</span>
                  </td>
                  <td>
                    {log.inputText ? (
                      <span className={styles.message}>&quot;{log.inputText}&quot;</span>
                    ) : (
                      <span className={styles.message} style={{ opacity: 0.7 }}>{log.responseSent}</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${log.status === 'success' ? styles.badgeSuccess : log.status === 'disabled' ? styles.badgeWarning : styles.badgeError}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>
                    {log.mirrored ? (
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                         Yes
                      </span>
                    ) : log.commandName === 'report' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`${styles.badge} ${styles.badgeError}`} title={log.errorMessage}>
                           Failed
                        </span>
                        <button 
                          onClick={() => handleRetry(log.id)}
                          disabled={retryingIds[log.id]}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            cursor: retryingIds[log.id] ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                            opacity: retryingIds[log.id] ? 0.5 : 1
                          }}
                        >
                          <RefreshCw size={12} className={retryingIds[log.id] ? styles.spin : ''} />
                          {retryingIds[log.id] ? 'Retrying...' : 'Retry'}
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
