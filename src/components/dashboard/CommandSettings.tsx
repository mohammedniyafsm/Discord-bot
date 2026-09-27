'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Settings } from 'lucide-react';
import styles from './CommandSettings.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CommandConfig {
  commandName: string;
  enabled: boolean;
  replyMessage: string;
}

export default function CommandSettings({ guildId, guildName }: { guildId: string, guildName: string }) {
  const { data: configs, error, mutate } = useSWR(guildId ? `/api/commands/config?guildId=${guildId}` : null, fetcher);
  
  const [localSettings, setLocalSettings] = useState<Record<string, CommandConfig>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Initialize local state when SWR data loads
  useEffect(() => {
    if (configs && Array.isArray(configs)) {
      const initial: Record<string, CommandConfig> = {
        report: { commandName: 'report', enabled: true, replyMessage: '' },
        status: { commandName: 'status', enabled: true, replyMessage: '' },
      };
      
      configs.forEach((c: CommandConfig) => {
        initial[c.commandName] = c;
      });
      
      setLocalSettings(initial);
    } else if (configs && configs.length === 0) {
      // Default state if no configs exist yet
      setLocalSettings({
        report: { commandName: 'report', enabled: true, replyMessage: '' },
        status: { commandName: 'status', enabled: true, replyMessage: '' },
      });
    }
  }, [configs]);

  const handleToggle = async (cmd: string) => {
    const newEnabled = !localSettings[cmd].enabled;
    setLocalSettings(prev => ({
      ...prev,
      [cmd]: { ...prev[cmd], enabled: newEnabled }
    }));
    await saveConfig(cmd, newEnabled, localSettings[cmd].replyMessage);
  };

  const handleReplyChange = (cmd: string, val: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [cmd]: { ...prev[cmd], replyMessage: val }
    }));
  };

  const saveConfig = async (cmd: string, overrideEnabled?: boolean, overrideReplyMessage?: string) => {
    setSaving(cmd);
    try {
      await fetch('/api/commands/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId,
          commandName: cmd,
          enabled: overrideEnabled !== undefined ? overrideEnabled : localSettings[cmd].enabled,
          replyMessage: overrideReplyMessage !== undefined ? overrideReplyMessage : localSettings[cmd].replyMessage,
        }),
      });
      await mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  if (error) return <div>Failed to load settings</div>;
  if (!configs || Object.keys(localSettings).length === 0) return <div className={styles.loading}>Loading settings...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Settings size={20} color="#a78bfa" />
        <h2>Command Settings for {guildName}</h2>
      </div>

      <div className={styles.settingsList}>
        {['report', 'status'].map(cmd => {
          const setting = localSettings[cmd];
          if (!setting) return null;

          return (
            <div key={cmd} className={styles.settingItem}>
              <div className={styles.settingHeader}>
                <span className={styles.commandName}>/{cmd}</span>
                <label className={styles.toggleLabel}>
                  <span style={{ fontSize: '0.9rem', color: setting.enabled ? '#22c55e' : 'var(--text-secondary)' }}>
                    {setting.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <div 
                    className={styles.toggleSwitch} 
                    data-enabled={setting.enabled}
                    onClick={() => handleToggle(cmd)}
                  />
                </label>
              </div>
              
              <div className={styles.inputGroup}>
                <label>Custom Reply Message (optional) {cmd === 'report' && <span style={{fontSize: '0.75rem', opacity: 0.7}}>- Use <code>{'{text}'}</code> to inject their report</span>}</label>
                <input 
                  type="text" 
                  placeholder={cmd === 'status' ? '✅ Bot is online and healthy.' : '✅ Report logged: {text}'}
                  value={setting.replyMessage}
                  onChange={(e) => handleReplyChange(cmd, e.target.value)}
                />
              </div>

              <button 
                className={styles.saveButton}
                onClick={() => saveConfig(cmd)}
                disabled={saving === cmd}
              >
                {saving === cmd ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
