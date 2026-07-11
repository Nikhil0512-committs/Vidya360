import { cookies } from 'next/headers';
import { isMockMode, getUserProfile } from './services';
import { mockDb } from './mockDb';
import { createServerClient } from '@supabase/ssr';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PARENT';
  guardianId?: string;
}

// Helper to create a Supabase client for Server components/actions
export async function createSupabaseServerClient() {
  if (isMockMode()) return null;

  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

import { prisma } from './prisma';

/**
 * Sign in a user. Uses mock authentication if DATABASE_URL is not set.
 */
export async function signIn(email: string): Promise<{ success: boolean; error?: string; user?: UserSession }> {
  const cStore = await cookies();

  if (isMockMode()) {
    const profile = mockDb.userProfiles.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!profile) {
      return { success: false, error: 'User email not found in mock database. Seed users: admin@greenwood.edu, admin@dps.edu, admin@dav.edu, ramesh@sharma.com, sunita@patel.com, anil@gupta.com' };
    }
    
    const session: UserSession = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      guardianId: profile.guardianId,
    };

    cStore.set('vidya360-session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { success: true, user: session };
  }

  // Live database mode (querying userProfile table in Supabase PostgreSQL directly)
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!profile) {
      return { success: false, error: 'User email not found in seeded database. Seed users: admin@greenwood.edu, admin@dps.edu, admin@dav.edu, ramesh@sharma.com, sunita@patel.com, anil@gupta.com' };
    }

    const session: UserSession = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role as 'ADMIN' | 'PARENT',
      guardianId: profile.guardianId || undefined,
    };

    cStore.set('vidya360-session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true, user: session };
  } catch (err: any) {
    return { success: false, error: err.message || 'Authentication failed' };
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<{ success: boolean }> {
  const cStore = await cookies();
  cStore.delete('vidya360-session');

  if (!isMockMode()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  return { success: true };
}

/**
 * Retrieves the current session.
 */
export async function getSession(): Promise<UserSession | null> {
  const cStore = await cookies();
  const sessionCookie = cStore.get('vidya360-session');
  
  if (!sessionCookie) return null;

  try {
    return JSON.parse(sessionCookie.value) as UserSession;
  } catch {
    return null;
  }
}
