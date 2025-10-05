/**
 * Feature Flags Configuration
 * Control Phase 2 features for gradual rollout and easy rollback
 */

/**
 * Feature flags for Phase 2 implementation
 */
export const FEATURE_FLAGS = {
  // P2-01: Enhanced Export/Import
  ENABLE_ENHANCED_EXPORT: true,
  ENABLE_SCENARIO_LIBRARY: true,
  ENABLE_SCENARIO_REPLAY: true,
  
  // P2-02: NRC Learning Mode (Future)
  ENABLE_NRC_LEARNING: false,
  
  // P2-03: Scenario Builder (Future)
  ENABLE_SCENARIO_BUILDER: false,
  
  // P2-04: Advanced Hex Editor (Future)
  ENABLE_ADVANCED_HEX_EDITOR: false,
  
  // P2-05: Tutorial System (Future)
  ENABLE_TUTORIALS: false,
} as const;

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  // Check environment variable override
  const envKey = `VITE_${feature}`;
  const envValue = import.meta.env[envKey];
  
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === true;
  }
  
  // Check localStorage override (for testing)
  const storageKey = `feature_flag_${feature}`;
  const storageValue = localStorage.getItem(storageKey);
  
  if (storageValue !== null) {
    return storageValue === 'true';
  }
  
  // Return default value
  return FEATURE_FLAGS[feature];
};

/**
 * Set feature flag override in localStorage (for testing)
 */
export const setFeatureFlag = (feature: keyof typeof FEATURE_FLAGS, enabled: boolean): void => {
  const storageKey = `feature_flag_${feature}`;
  localStorage.setItem(storageKey, String(enabled));
};

/**
 * Clear all feature flag overrides
 */
export const clearFeatureFlags = (): void => {
  Object.keys(FEATURE_FLAGS).forEach(feature => {
    const storageKey = `feature_flag_${feature}`;
    localStorage.removeItem(storageKey);
  });
};

/**
 * Get all feature flags with their current values
 */
export const getAllFeatureFlags = (): Record<keyof typeof FEATURE_FLAGS, boolean> => {
  const flags: Record<string, boolean> = {};
  
  (Object.keys(FEATURE_FLAGS) as Array<keyof typeof FEATURE_FLAGS>).forEach(feature => {
    flags[feature] = isFeatureEnabled(feature);
  });
  
  return flags as Record<keyof typeof FEATURE_FLAGS, boolean>;
};

/**
 * Emergency disable all Phase 2 features
 */
export const disableAllPhase2Features = (): void => {
  Object.keys(FEATURE_FLAGS).forEach(feature => {
    setFeatureFlag(feature as keyof typeof FEATURE_FLAGS, false);
  });
};

/**
 * Environment-based configuration
 */
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

/**
 * Disable all Phase 2 features if emergency flag is set
 */
if (import.meta.env.VITE_DISABLE_ALL_PHASE2 === 'true') {
  disableAllPhase2Features();
}
