/**
 * IDS Configuration with Environment Variable Guards
 * 
 * Safety controls:
 * - IDS_ENABLED: Master switch (default: false)
 * - IDS_SHADOW_MODE: When true, writes ONLY to ids_shadow_runs (default: true)
 */

// ============================================================================
// Environment Configuration
// ============================================================================

export interface IDSEnvironmentConfig {
  enabled: boolean;           // IDS_ENABLED - master switch
  shadowMode: boolean;        // IDS_SHADOW_MODE - shadow mode only
  maxSolveTimeSeconds: number;
  enableEarningsPrediction: boolean;
}

/**
 * Load IDS configuration from environment variables
 * Defaults are SAFE: disabled and shadow-mode only
 */
export function loadIDSConfig(): IDSEnvironmentConfig {
  return {
    enabled: process.env.IDS_ENABLED === 'true',
    shadowMode: process.env.IDS_SHADOW_MODE !== 'false', // Default true
    maxSolveTimeSeconds: parseInt(process.env.IDS_MAX_SOLVE_TIME || '30', 10),
    enableEarningsPrediction: process.env.IDS_ENABLE_EARNINGS !== 'false',
  };
}

/**
 * Check if IDS is enabled
 */
export function isIDSEnabled(): boolean {
  return loadIDSConfig().enabled;
}

/**
 * Check if IDS is in shadow mode
 */
export function isIDSShadowMode(): boolean {
  return loadIDSConfig().shadowMode;
}

/**
 * Guard function - throws if IDS is disabled
 */
export function requireIDSEnabled(): void {
  if (!isIDSEnabled()) {
    throw new Error('IDS is disabled. Set IDS_ENABLED=true to enable.');
  }
}

/**
 * Guard function - throws if trying to dispatch in shadow mode
 */
export function requireLiveMode(): void {
  requireIDSEnabled();
  if (isIDSShadowMode()) {
    throw new Error('IDS is in shadow mode. Set IDS_SHADOW_MODE=false to enable live dispatch.');
  }
}

/**
 * Get current IDS status for API responses
 */
export function getIDSStatus(): {
  enabled: boolean;
  shadowMode: boolean;
  canDispatch: boolean;
  message: string;
} {
  const config = loadIDSConfig();
  
  let message = '';
  if (!config.enabled) {
    message = 'IDS is disabled. No optimization endpoints available.';
  } else if (config.shadowMode) {
    message = 'IDS is in shadow mode. Optimizations are saved but not dispatched.';
  } else {
    message = 'IDS is live. Optimizations will be dispatched to drivers.';
  }
  
  return {
    enabled: config.enabled,
    shadowMode: config.shadowMode,
    canDispatch: config.enabled && !config.shadowMode,
    message,
  };
}
