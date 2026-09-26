import { getServerSession } from 'next-auth';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';
import { authOptions } from '@/lib/auth-options';
import LogoutButton from '@/components/LogoutButton';
import styles from '../account.module.css';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/');

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/" aria-label="Discord Ops home">
          <span className={styles.brandMark} aria-hidden="true"><i /><i /><i /></span>
          <span>Discord Ops</span>
        </Link>
        <LogoutButton className={styles.logout}>
          <LogOut size={16} aria-hidden="true" />
          Log out
        </LogoutButton>
      </header>

      <div className={styles.content}>
        <p className={styles.eyebrow}>YOUR WORKSPACE</p>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.description}>Your Discord account is connected and ready.</p>

        <section className={styles.profile} aria-label="Discord account">
          {session.user?.image ? (
            <Image
              className={styles.avatar}
              src={session.user.image}
              alt=""
              width={76}
              height={76}
              unoptimized
            />
          ) : (
            <div className={styles.avatarFallback} aria-hidden="true">
              {(session.user?.name ?? 'D').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className={styles.profileDetails}>
            <p className={styles.profileLabel}>LOGGED IN AS</p>
            <h2>{session.user?.name ?? 'Discord user'}</h2>
            {session.user?.email ? <p>{session.user.email}</p> : null}
          </div>
          <span className={styles.connected}>
            <ShieldCheck size={16} aria-hidden="true" />
            Connected
          </span>
        </section>
      </div>
    </main>
  );
}