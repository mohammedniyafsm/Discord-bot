'use client';

import { signOut } from 'next-auth/react';
import type { ReactNode } from 'react';

export default function LogoutButton({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <button className={className} onClick={() => signOut({ callbackUrl: '/' })} type="button">
      {children}
    </button>
  );
}