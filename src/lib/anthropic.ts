import Anthropic from '@anthropic-ai/sdk';

// Lazy-initialized Anthropic client — avoids build errors when env vars aren't set
let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}
