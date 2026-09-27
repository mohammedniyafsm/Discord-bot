import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import styles from './page.module.css';

export default function HeroSection() {
  return (
    <div className={styles.heroContent}>
      <p className={styles.eyebrow}><span>API</span> DISCORD INTERACTIONS</p>
      <h1>Slash commands,<br />wired to your <em>workflow.</em></h1>
      <p className={styles.description}>
        Process Discord&apos;s `/status` and `/report` commands, log every interaction, and mirror reports to your team&apos;s webhook.
      </p>
      <div className={styles.actions}>
        <a className={styles.primaryAction} href="/dashboard">
          See how it works <ArrowUpRight size={17} aria-hidden="true" />
        </a>
        {/* <a className={styles.secondaryAction} href="/dashboard">
          See how it works <ArrowUpRight size={16} aria-hidden="true" />
        </a> */}
      </div>
    </div>
  );
}