'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { X, AlertCircle } from 'lucide-react';
import styles from './ConnectModal.module.css';

interface ConnectModalProps {
  guildId: string;
  guildName: string;
  guildIcon?: string | null;
  onClose: () => void;
  onConnect?: () => void;
}

interface Channel {
  id: string;
  name: string;
}

interface BotGuildResponse {
  inGuild: boolean;
  clientId?: string;
}

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch data');
  }
  return res.json();
});

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

export default function ConnectModal({ guildId, guildName, guildIcon, onClose, onConnect }: ConnectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const [notifyChannel, setNotifyChannel] = useState('');
  const [mirrorChannel, setMirrorChannel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Trap focus and handle escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Check if bot is in guild
  const { data: botGuildData, error: botGuildError, isLoading: isBotGuildLoading } =
    useSWR<BotGuildResponse>(`/api/discord/bot-guilds?guildId=${guildId}`, fetcher);

  const isBotInGuild = botGuildData?.inGuild;
  const clientId = botGuildData?.clientId || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';

  // Fetch channels ONLY if bot is in guild
  const { data: channels, error: channelsError, isLoading: isChannelsLoading } =
    useSWR<Channel[]>(
      isBotInGuild ? `/api/discord/channels?guildId=${guildId}` : null,
      fetcher
    );

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSave = async () => {
    if (!notifyChannel || !mirrorChannel) return;
    if (notifyChannel === mirrorChannel) {
      setSaveError('Please select different channels for notify and mirror.');
      return;
    }

    setIsSaving(true);
    setSaveError('');

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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save configuration');
      }

      alert('Server configured successfully!');
      if (onConnect) onConnect();
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  let content;
  if (isBotGuildLoading) {
    content = <LoadingState />;
  } else if (botGuildError) {
    content = <ErrorState message="Failed to check bot status. Please try again later." />;
  } else if (!isBotInGuild) {
    content = (
      <InviteState
        guildId={guildId}
        guildName={guildName}
        guildIcon={guildIcon}
        clientId={clientId}
      />
    );
  } else {
    content = (
      <ConfigState
        channels={channels}
        channelsError={channelsError}
        isChannelsLoading={isChannelsLoading}
        notifyChannel={notifyChannel}
        setNotifyChannel={setNotifyChannel}
        mirrorChannel={mirrorChannel}
        setMirrorChannel={setMirrorChannel}
        onSave={handleSave}
        isSaving={isSaving}
        saveError={saveError}
      />
    );
  }

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className={styles.header}>
          <h2 id="modal-title">Connect {guildName}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}

// Sub-components

function LoadingState() {
  return (
    <div className={styles.loadingState}>
      <div className={styles.spinner}></div>
      <p style={{ textAlign: 'center', color: '#94a3b8' }}>Checking bot status...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className={styles.errorState}>
      <AlertCircle size={20} />
      <p>{message}</p>
    </div>
  );
}

function InviteState({ guildId, guildName, guildIcon, clientId }: { guildId: string, guildName: string, guildIcon?: string | null, clientId: string }) {
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=536873984&scope=bot%20applications.commands&guild_id=${guildId}&disable_guild_select=true`;

  return (
    <div className={styles.inviteState}>
      <div className={styles.serverPreview}>
        <div
          className={styles.iconWrapperLarge}
          style={{ backgroundColor: guildIcon ? 'transparent' : getDeterministicColor(guildId) }}
        >
          {guildIcon ? (
            <Image
              src={`https://cdn.discordapp.com/icons/${guildId}/${guildIcon}.png`}
              alt={guildName}
              width={80}
              height={80}
              className={styles.serverIconLarge}
              unoptimized
            />
          ) : (
            <span>{guildName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h3 className={styles.serverNameLarge}>{guildName}</h3>
      </div>
      <p style={{ textAlign: 'center' }}>First, add the bot to this server to grant it the necessary permissions.</p>
      <a href={inviteUrl} target="_blank" rel="noopener noreferrer" className={styles.inviteButton}>
        Add Bot to Server
      </a>
      <p className={styles.note} style={{ textAlign: 'center' }}>After adding the bot, close this and click Connect again.</p>
    </div>
  );
}

function ConfigState({
  channels, channelsError, isChannelsLoading,
  notifyChannel, setNotifyChannel, mirrorChannel, setMirrorChannel, onSave,
  isSaving, saveError
}: any) {
  if (channelsError) {
    return <ErrorState message="Failed to load channels. Make sure the bot has 'View Channels' permission." />;
  }

  return (
    <div className={styles.configState}>
      {saveError && (
        <div className={styles.errorState} style={{ marginBottom: '1rem', padding: '0.5rem' }}>
          <AlertCircle size={16} />
          <p style={{ fontSize: '0.875rem', margin: 0 }}>{saveError}</p>
        </div>
      )}

      {isChannelsLoading ? (
        <>
          <div className={styles.formGroup}>
            <label>Where should the bot reply?</label>
            <div className={styles.skeletonSelect}></div>
          </div>
          <div className={styles.formGroup}>
            <label>Where should reports be mirrored?</label>
            <div className={styles.skeletonSelect}></div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="notifyChannel">Where should the bot reply?</label>
            <select
              id="notifyChannel"
              className={styles.select}
              value={notifyChannel}
              onChange={(e) => setNotifyChannel(e.target.value)}
              disabled={isSaving}
            >
              <option value="" disabled>Select a channel</option>
              {channels?.map((c: Channel) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="mirrorChannel">Where should reports be mirrored?</label>
            <select
              id="mirrorChannel"
              className={styles.select}
              value={mirrorChannel}
              onChange={(e) => setMirrorChannel(e.target.value)}
              disabled={isSaving}
            >
              <option value="" disabled>Select a channel</option>
              {channels?.map((c: Channel) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className={styles.actions}>
        <button
          className={styles.saveButton}
          onClick={onSave}
          disabled={!notifyChannel || !mirrorChannel || notifyChannel === mirrorChannel || isChannelsLoading || !!channelsError || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Connection'}
        </button>
      </div>
    </div>
  );
}
