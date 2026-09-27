'use client';

import { useState, useEffect } from 'react';
import { X, Server as ServerIcon, Activity, MessageSquare, Trash2, Settings } from 'lucide-react';
import styles from './ServerDetailsModal.module.css';
import LiveLogs from './LiveLogs';
import CommandSettings from './CommandSettings';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ServerDetailsModalProps {
  guildId: string;
  guildName: string;
  onClose: () => void;
  onDisconnect: (guildId: string) => void;
}

type Tab = 'logs' | 'commands' | 'settings' | 'disconnect';

export default function ServerDetailsModal({ guildId, guildName, onClose, onDisconnect }: ServerDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('logs');
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await fetch(`/api/servers?guildId=${guildId}`, {
        method: 'DELETE',
      });
      onDisconnect(guildId);
      onClose();
    } catch (error) {
      console.error('Failed to disconnect server', error);
      setIsDisconnecting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.header}>
          <ServerIcon size={24} color="#a78bfa" />
          <h2>{guildName}</h2>
        </div>

        <div className={styles.body}>
          <div className={styles.sidebar}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'logs' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} />
                Live Logs
              </div>
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'commands' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('commands')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} />
                Command Settings
              </div>
            </button>
            
            <button 
              className={`${styles.tabButton} ${activeTab === 'settings' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} />
                General Settings
              </div>
            </button>
            
            <button 
              className={`${styles.tabButton} ${styles.dangerTab} ${activeTab === 'disconnect' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('disconnect')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={18} />
                Disconnect Bot
              </div>
            </button>
          </div>

          <div className={styles.content}>
            {activeTab === 'logs' && (
              <div style={{ height: '100%' }}>
                <LiveLogs guildId={guildId} guildName={guildName} />
              </div>
            )}
            
            {activeTab === 'commands' && (
              <CommandSettings guildId={guildId} guildName={guildName} />
            )}

            {activeTab === 'settings' && (
              <GeneralSettings guildId={guildId} guildName={guildName} />
            )}
            
            {activeTab === 'disconnect' && (
              <div className={styles.disconnectContainer}>
                <h3>Disconnect from {guildName}</h3>
                <p>
                  Are you sure you want to disconnect the bot from this server? This will stop all slash commands from functioning and delete your configuration and log history.
                </p>
                <button 
                  className={styles.disconnectButton}
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Yes, disconnect bot'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({ guildId, guildName }: { guildId: string, guildName: string }) {
  const [notifyChannel, setNotifyChannel] = useState('');
  const [mirrorChannel, setMirrorChannel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const { data: config } = useSWR(`/api/servers?guildId=${guildId}`, fetcher);
  const { data: channels } = useSWR(`/api/discord/channels?guildId=${guildId}`, fetcher);

  useEffect(() => {
    if (config?.notifyChannelId) {
      setNotifyChannel(config.notifyChannelId);
    }
  }, [config]);

  const handleSave = async () => {
    if (!notifyChannel || !mirrorChannel) return;
    if (notifyChannel === mirrorChannel) {
      setSaveMessage('Please select different channels.');
      return;
    }
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId,
          guildName,
          notifyChannelId: notifyChannel,
          mirrorChannelId: mirrorChannel
        })
      });
      if (res.ok) setSaveMessage('Settings saved successfully!');
      else setSaveMessage('Failed to save settings.');
    } catch (e) {
      setSaveMessage('Error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h3>General Settings</h3>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Update the channels where the bot operates.
      </p>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Notify Channel</label>
        <select 
          value={notifyChannel} 
          onChange={e => setNotifyChannel(e.target.value)} 
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white' }}
        >
          <option value="" disabled>Select a channel</option>
          {channels?.map((c: any) => <option key={c.id} value={c.id}>#{c.name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Mirror Reports Channel (will create new webhook)</label>
        <select 
          value={mirrorChannel} 
          onChange={e => setMirrorChannel(e.target.value)} 
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white' }}
        >
          <option value="" disabled>Select a new channel</option>
          {channels?.map((c: any) => <option key={c.id} value={c.id}>#{c.name}</option>)}
        </select>
      </div>

      <button 
        onClick={handleSave} 
        disabled={isSaving || !notifyChannel || !mirrorChannel || notifyChannel === mirrorChannel}
        style={{ padding: '0.75rem 1.5rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: (isSaving || !notifyChannel || !mirrorChannel || notifyChannel === mirrorChannel) ? 'not-allowed' : 'pointer', opacity: (isSaving || !notifyChannel || !mirrorChannel || notifyChannel === mirrorChannel) ? 0.5 : 1 }}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
      {saveMessage && <p style={{ marginTop: '1rem', color: saveMessage.includes('successfully') ? '#10b981' : '#ef4444' }}>{saveMessage}</p>}
    </div>
  );
}
