'use client';

import { LogIn, LogOut } from 'lucide-react';
import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';
import styles from './page.module.css';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#top" aria-label="Discord Ops home">
        <span className={styles.brandMark} aria-hidden="true"><i /><i /><i /></span>
        <span>Discord Ops</span>
      </a>
      <nav className={styles.navigation} aria-label="Main navigation">
        <a href="#features">Features</a>
        <a href="#workflow">Workflow</a>
      </nav>
      {status === 'authenticated' ? (
        <div className={styles.accountActions}>
          <a className={styles.accountName} href="/dashboard">
            {session.user?.image ? (
              <Image
                className={styles.navAvatar}
                src={session.user.image}
                alt=""
                width={28}
                height={28}
                unoptimized
              />
            ) : null}
            <span>{session.user?.name ?? 'Discord user'}</span>
          </a>
          <button
            aria-label="Log out"
            className={styles.headerLink}
            onClick={() => signOut({ callbackUrl: '/' })}
            title="Log out"
            type="button"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          className={styles.headerLink}
          disabled={status === 'loading'}
          onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
          type="button"
        >
          Login with Discord <LogIn size={16} aria-hidden="true" />
        </button>
      )}
    </header>
  );
}