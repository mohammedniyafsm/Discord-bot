import { getServerSession } from 'next-auth';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';
import { authOptions } from '@/lib/auth-options';
import LogoutButton from '@/components/LogoutButton';
import styles from '../account.module.css';
import ServerList from '@/components/dashboard/ServerList';

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
        <div className={styles.navActions}>
          <div className={styles.navProfile}>
            {session.user?.image ? (
              <Image
                className={styles.navAvatar}
                src={session.user.image}
                alt=""
                width={36}
                height={36}
                unoptimized
              />
            ) : (
              <div className={styles.navAvatarFallback} aria-hidden="true">
                {(session.user?.name ?? 'D').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className={styles.navProfileDetails}>
              <h2>{session.user?.name ?? 'Discord user'}</h2>
              {session.user?.email ? <p>{session.user.email}</p> : null}
            </div>
          </div>
          <LogoutButton className={styles.logout}>
            <LogOut size={16} aria-hidden="true" />
            Log out
          </LogoutButton>
        </div>
      </header>

      <div className={styles.content}>
        <ServerList />
      </div>
    </main>
  );
}