// User ID Service - Ensures consistent UUIDs across all auth methods
// Maps Flow addresses and other identifiers to stable UUIDs

import { v4 as uuidv4 } from 'uuid';

interface UserIdMapping {
  uuid: string;
  flowAddress?: string;
  supabaseId?: string;
  authMethod: 'flow' | 'supabase' | 'anonymous';
  createdAt: string;
}

export class UserIdService {
  private static readonly STORAGE_KEY = 'memoreee_user_mappings';
  private static readonly ANONYMOUS_KEY = 'memoreee_anonymous_id';

  /**
   * Get or create a consistent UUID for a user based on their auth method
   */
  static getUserId(authMethod: 'flow' | 'supabase' | 'anonymous', identifier?: string): string {
    if (authMethod === 'anonymous') {
      return this.getAnonymousUserId();
    }

    if (!identifier) {
      throw new Error('Identifier required for authenticated users');
    }

    // Check if we already have a mapping for this identifier
    const existingMapping = this.findExistingMapping(authMethod, identifier);
    if (existingMapping) {
      return existingMapping.uuid;
    }

    // Create new mapping with deterministic UUID for Flow addresses
    let uuid: string;
    if (this.isValidUUID(identifier)) {
      uuid = identifier;
    } else if (authMethod === 'flow') {
      // Generate deterministic UUID based on Flow address for consistency across environments
      uuid = this.generateDeterministicUUID(identifier);
    } else {
      uuid = uuidv4();
    }

    const mapping: UserIdMapping = {
      uuid,
      [authMethod === 'flow' ? 'flowAddress' : 'supabaseId']: identifier,
      authMethod,
      createdAt: new Date().toISOString()
    };

    this.saveMapping(mapping);
    return uuid;
  }

  /**
   * Get consistent anonymous user ID
   */
  private static getAnonymousUserId(): string {
    if (typeof window === 'undefined') {
      return `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const existingId = localStorage.getItem(this.ANONYMOUS_KEY);
    if (existingId) {
      return existingId;
    }

    const anonymousId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(this.ANONYMOUS_KEY, anonymousId);
    return anonymousId;
  }

  /**
   * Find existing mapping for an identifier
   */
  private static findExistingMapping(authMethod: 'flow' | 'supabase', identifier: string): UserIdMapping | null {
    if (typeof window === 'undefined') return null;

    try {
      const mappings = this.getAllMappings();
      return mappings.find(mapping => {
        if (authMethod === 'flow') {
          return mapping.flowAddress === identifier;
        } else {
          return mapping.supabaseId === identifier;
        }
      }) || null;
    } catch (error) {
      console.warn('Failed to find existing mapping:', error);
      return null;
    }
  }

  /**
   * Save a new mapping
   */
  private static saveMapping(mapping: UserIdMapping): void {
    if (typeof window === 'undefined') return;

    try {
      const mappings = this.getAllMappings();
      mappings.push(mapping);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mappings));
      console.log('✅ User ID mapping saved:', { uuid: mapping.uuid, authMethod: mapping.authMethod });
    } catch (error) {
      console.error('Failed to save user mapping:', error);
    }
  }

  /**
   * Get all stored mappings
   */
  private static getAllMappings(): UserIdMapping[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load user mappings:', error);
      return [];
    }
  }

  /**
   * Generate deterministic UUID based on Flow address for consistency across environments
   */
  private static generateDeterministicUUID(flowAddress: string): string {
    // Create a deterministic UUID based on the Flow address
    // This ensures the same Flow address always gets the same UUID across environments

    // Remove 0x prefix if present and normalize to lowercase
    const normalizedAddress = flowAddress.toLowerCase().replace(/^0x/, '');

    // Pad to ensure consistent length (Flow addresses are 16 chars without 0x)
    const paddedAddress = normalizedAddress.padStart(16, '0');

    // Create a deterministic UUID v4 format using the address
    // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuid = [
      paddedAddress.slice(0, 8),
      paddedAddress.slice(8, 12),
      '4' + paddedAddress.slice(12, 15), // Version 4 UUID
      '8' + paddedAddress.slice(15, 16) + paddedAddress.slice(0, 2), // Variant bits + padding
      paddedAddress.slice(2, 14)
    ].join('-');

    console.log('🔗 Generated deterministic UUID for Flow address:', { flowAddress, uuid });
    return uuid;
  }

  /**
   * Check if a string is a valid UUID
   */
  private static isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Get user info by UUID (for debugging/admin purposes)
   */
  static getUserInfo(uuid: string): UserIdMapping | null {
    if (typeof window === 'undefined') return null;

    try {
      const mappings = this.getAllMappings();
      return mappings.find(mapping => mapping.uuid === uuid) || null;
    } catch (error) {
      console.warn('Failed to get user info:', error);
      return null;
    }
  }

  /**
   * Clear all mappings (for testing/reset purposes)
   */
  static clearAllMappings(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ANONYMOUS_KEY);
    console.log('🗑️ All user ID mappings cleared');
  }

  /**
   * Migrate Flow users to deterministic UUIDs for consistency across environments
   */
  static migrateFlowUsersToDeterministicUUIDs(): void {
    if (typeof window === 'undefined') return;

    try {
      const mappings = this.getAllMappings();
      let migrationCount = 0;

      mappings.forEach(mapping => {
        if (mapping.authMethod === 'flow' && mapping.flowAddress) {
          const deterministicUUID = this.generateDeterministicUUID(mapping.flowAddress);
          if (mapping.uuid !== deterministicUUID) {
            // Update the mapping to use deterministic UUID
            mapping.uuid = deterministicUUID;
            migrationCount++;
          }
        }
      });

      if (migrationCount > 0) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mappings));
        console.log(`🔄 Migrated ${migrationCount} Flow users to deterministic UUIDs`);
      }
    } catch (error) {
      console.warn('Failed to migrate Flow users to deterministic UUIDs:', error);
    }
  }

  /**
   * Migrate old anonymous ID format to new system
   */
  static migrateAnonymousId(): void {
    if (typeof window === 'undefined') return;

    const oldId = localStorage.getItem('memoreee_anonymous_id');
    if (oldId && !oldId.startsWith('anonymous_')) {
      // Old format detected, migrate to new format
      const newId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(this.ANONYMOUS_KEY, newId);
      console.log('🔄 Migrated anonymous ID to new format');
    }
  }
}

// Export convenience functions
export const getUserId = UserIdService.getUserId.bind(UserIdService);
export const getUserInfo = UserIdService.getUserInfo.bind(UserIdService);
export const clearUserMappings = UserIdService.clearAllMappings.bind(UserIdService);
