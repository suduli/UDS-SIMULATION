// Security session manager
export interface SecuritySession {
  sessionId: string;
  ecuId: string;
  currentLevel: 'default' | 'supplier' | 'oem';
  seed: Uint8Array | null;
  expiresAt: string;
}

export class SecurityManager {
  private sessions = new Map<string, SecuritySession>();

  createSession(ecuId: string): SecuritySession {
    const session: SecuritySession = {
      sessionId: this.generateSessionId(),
      ecuId,
      currentLevel: 'default',
      seed: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  generateSeed(sessionId: string): Uint8Array {
    const seed = new Uint8Array(4);
    crypto.getRandomValues(seed);

    const session = this.sessions.get(sessionId);
    if (session) {
      session.seed = seed;
    }

    return seed;
  }

  validateKey(sessionId: string, key: Uint8Array): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.seed) return false;

    // Simple XOR validation for simulation
    for (let i = 0; i < session.seed.length; i += 1) {
      // eslint-disable-next-line no-bitwise
      if (key[i] !== (session.seed[i] ^ 0xff)) return false;
    }

    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
