import { logger } from "../utils/logger";

/**
 * Token Blacklist Entry
 * Stores token ID and expiration time
 */
interface BlacklistEntry {
  tokenId: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * Token Blacklist Service
 *
 * Manages blacklisted tokens for logout functionality.
 * Uses in-memory Map for simplicity (can be upgraded to Redis for distributed systems).
 *
 * Security:
 * - Tokens are blacklisted by their jti (JWT ID) or full token hash
 * - Entries are automatically cleaned up when expired
 * - Prevents use of logged-out tokens until they expire
 */
export class TokenBlacklistService {
  /**
   * In-memory blacklist storage
   * Key: token identifier (jti or token hash)
   * Value: expiration timestamp
   */
  private blacklist: Map<string, BlacklistEntry> = new Map();

  /**
   * Cleanup interval in milliseconds
   * Runs every 5 minutes to remove expired entries
   */
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;

  constructor() {
    // Start periodic cleanup of expired tokens
    this.startCleanupJob();
  }

  /**
   * Blacklist a token
   *
   * @param tokenId - Token identifier (jti or token hash)
   * @param expiresAt - Token expiration timestamp (Unix milliseconds)
   */
  blacklistToken(tokenId: string, expiresAt: number): void {
    this.blacklist.set(tokenId, {
      tokenId,
      expiresAt,
    });

    logger.debug("Token blacklisted", { tokenId, expiresAt });
  }

  /**
   * Check if a token is blacklisted
   *
   * @param tokenId - Token identifier to check
   * @returns true if token is blacklisted and not expired
   */
  isTokenBlacklisted(tokenId: string): boolean {
    const entry = this.blacklist.get(tokenId);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      // Remove expired entry
      this.blacklist.delete(tokenId);
      return false;
    }

    return true;
  }

  /**
   * Remove a token from blacklist (for testing/admin purposes)
   *
   * @param tokenId - Token identifier to remove
   */
  removeToken(tokenId: string): void {
    this.blacklist.delete(tokenId);
    logger.debug("Token removed from blacklist", { tokenId });
  }

  /**
   * Clear all blacklisted tokens (for testing/admin purposes)
   */
  clearAll(): void {
    this.blacklist.clear();
    logger.debug("Token blacklist cleared");
  }

  /**
   * Get blacklist size (for monitoring)
   *
   * @returns Number of blacklisted tokens
   */
  getSize(): number {
    return this.blacklist.size;
  }

  /**
   * Start periodic cleanup job to remove expired tokens
   * Runs every CLEANUP_INTERVAL milliseconds
   */
  private startCleanupJob(): void {
    setInterval(() => {
      this.clearExpiredTokens();
    }, this.CLEANUP_INTERVAL);

    logger.info("Token blacklist cleanup job started", {
      interval: this.CLEANUP_INTERVAL,
    });
  }

  /**
   * Remove all expired tokens from blacklist
   * Called periodically by cleanup job
   */
  private clearExpiredTokens(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [tokenId, entry] of this.blacklist.entries()) {
      if (now > entry.expiresAt) {
        this.blacklist.delete(tokenId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug("Cleaned up expired tokens from blacklist", {
        removedCount,
      });
    }
  }

  /**
   * Generate token identifier from JWT token
   * Uses the last 32 characters of the token as identifier
   * (Simple approach - can be improved with proper jti or hash)
   *
   * @param token - JWT token string
   * @returns Token identifier
   */
  static getTokenId(token: string): string {
    // Use last 32 characters as identifier
    // In production, you might want to use jti claim or full hash
    return token.slice(-32);
  }
}

/**
 * Factory function for creating TokenBlacklistService
 * Creates singleton instance
 */
let blacklistServiceInstance: TokenBlacklistService | null = null;

export const createTokenBlacklistService = (): TokenBlacklistService => {
  if (!blacklistServiceInstance) {
    blacklistServiceInstance = new TokenBlacklistService();
  }
  return blacklistServiceInstance;
};

