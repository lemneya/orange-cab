// Local LLM Client - OpenAI-compatible API
// Supports local LFM2 server or any OpenAI-compatible endpoint

import { z } from "zod";

// ============================================
// CONFIGURATION
// ============================================

// ============================================
// SSRF PROTECTION - ALLOWLIST PRIVATE IPS ONLY
// ============================================

const ALLOWED_HOSTS = [
  "127.0.0.1",
  "localhost",
  "0.0.0.0",
];

const ALLOWED_IP_PATTERNS = [
  /^10\./,           // 10.x.x.x
  /^192\.168\./,     // 192.168.x.x
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.x.x - 172.31.x.x
];

function isAllowedHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    
    // Must be http (not https for local servers)
    if (parsed.protocol !== "http:") {
      return false;
    }
    
    // Check explicit allowlist
    if (ALLOWED_HOSTS.includes(hostname)) {
      return true;
    }
    
    // Check private IP patterns
    for (const pattern of ALLOWED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

function validateBaseUrl(url: string): string {
  if (!isAllowedHost(url)) {
    console.warn(`[SSRF Protection] Blocked non-private URL: ${url}. Using default.`);
    return "http://127.0.0.1:8080";
  }
  return url;
}

export const LLM_CONFIG = {
  baseUrl: validateBaseUrl(process.env.LOCAL_LLM_BASE_URL || "http://127.0.0.1:8080"),
  model: process.env.LOCAL_LLM_MODEL || "LFM2-2.6B-EXP",
  enabled: process.env.LOCAL_LLM_ENABLED === "true",
  timeout: parseInt(process.env.LOCAL_LLM_TIMEOUT || "60000", 10), // 60s hard timeout
};

// ============================================
// TYPES
// ============================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMError {
  code: string;
  message: string;
  details?: string;
}

export type LLMResult<T> = 
  | { success: true; data: T }
  | { success: false; error: LLMError };

// ============================================
// CLIENT
// ============================================

export class LocalLLMClient {
  private baseUrl: string;
  private model: string;
  private timeout: number;

  constructor(config?: { baseUrl?: string; model?: string; timeout?: number }) {
    this.baseUrl = config?.baseUrl || LLM_CONFIG.baseUrl;
    this.model = config?.model || LLM_CONFIG.model;
    this.timeout = config?.timeout || LLM_CONFIG.timeout;
  }

  /**
   * Check if the LLM server is available
   */
  async isAvailable(): Promise<boolean> {
    if (!LLM_CONFIG.enabled) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available models from the server
   */
  async getModels(): Promise<LLMResult<string[]>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: `Server returned ${response.status}`,
          },
        };
      }

      const data = await response.json();
      const models = data.data?.map((m: any) => m.id) || [];
      return { success: true, data: models };
    } catch (err) {
      return {
        success: false,
        error: {
          code: "CONNECTION_ERROR",
          message: "Local LLM unavailable",
          details: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  /**
   * Send a chat completion request
   */
  async chatCompletion(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<LLMResult<ChatCompletionResponse>> {
    if (!LLM_CONFIG.enabled) {
      return {
        success: false,
        error: {
          code: "DISABLED",
          message: "Local LLM is disabled. Set LOCAL_LLM_ENABLED=true to enable.",
        },
      };
    }

    const request: ChatCompletionRequest = {
      model: options?.model || this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: false,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: `Server returned ${response.status}`,
            details: errorText,
          },
        };
      }

      const data: ChatCompletionResponse = await response.json();
      return { success: true, data };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return {
          success: false,
          error: {
            code: "TIMEOUT",
            message: `Request timed out after ${this.timeout}ms`,
          },
        };
      }

      return {
        success: false,
        error: {
          code: "CONNECTION_ERROR",
          message: "Local LLM unavailable",
          details: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  /**
   * Simple text completion helper
   */
  async complete(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<LLMResult<string>> {
    const result = await this.chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      options
    );

    if (!result.success) {
      return result;
    }

    const content = result.data.choices[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        error: {
          code: "EMPTY_RESPONSE",
          message: "LLM returned empty response",
        },
      };
    }

    return { success: true, data: content };
  }

  /**
   * JSON completion with validation
   */
  async completeJson<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<LLMResult<T>> {
    const result = await this.complete(systemPrompt, userPrompt, {
      temperature: options?.temperature ?? 0.3, // Lower temp for JSON
      maxTokens: options?.maxTokens,
    });

    if (!result.success) {
      return result;
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = result.data;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      const validated = schema.safeParse(parsed);

      if (!validated.success) {
        return {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "LLM output failed schema validation",
            details: validated.error.message,
          },
        };
      }

      return { success: true, data: validated.data };
    } catch (err) {
      return {
        success: false,
        error: {
          code: "PARSE_ERROR",
          message: "Failed to parse LLM output as JSON",
          details: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const localLLM = new LocalLLMClient();

// ============================================
// STATUS CHECK
// ============================================

export async function checkLLMStatus(): Promise<{
  enabled: boolean;
  available: boolean;
  model: string;
  baseUrl: string;
  error?: string;
}> {
  const status = {
    enabled: LLM_CONFIG.enabled,
    available: false,
    model: LLM_CONFIG.model,
    baseUrl: LLM_CONFIG.baseUrl,
    error: undefined as string | undefined,
  };

  if (!LLM_CONFIG.enabled) {
    status.error = "Local LLM is disabled";
    return status;
  }

  const available = await localLLM.isAvailable();
  status.available = available;

  if (!available) {
    status.error = `Cannot connect to ${LLM_CONFIG.baseUrl}`;
  }

  return status;
}
