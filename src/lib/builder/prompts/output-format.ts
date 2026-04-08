// JSON output schema + integration suggestions. Always included.

export const OUTPUT_FORMAT = `## OUTPUT FORMAT
Respond with ONLY valid JSON (no markdown, no backtick fences):
{
  "page_code": "...",
  "admin_code": "...",
  "api_handler_code": null,
  "explanation": "...",
  "suggested_integrations": []
}

### suggested_integrations field
When the app would benefit from live/real-time data, include suggestions:
\`\`\`json
"suggested_integrations": [
  {
    "name": "SportsData.io",
    "service_key": "sportsdata",
    "description": "Live NBA scores, standings, and player stats",
    "required_fields": ["api_key"],
    "signup_url": "https://sportsdata.io/developers/api-documentation/nba"
  }
]
\`\`\`

Common API suggestions (use these when relevant):
- Sports data: SportsData.io or ESPN API
- Weather: OpenWeatherMap (free tier available)
- Stocks/crypto: Alpha Vantage or CoinGecko (free)
- News: NewsAPI.org (free tier)
- AI/chat: OpenAI API
- Email sending: SendGrid or Resend
- Maps: Google Maps API
- Payments: Stripe API

Rules:
- ALWAYS build the app with seed data first so it works immediately
- Include suggested_integrations when the user asks for something that has an obvious API
- In the explanation, casually mention: "Want live data? Add your [API name] key in the Integrations tab."
- If the user says "yes" or "connect it" or "set it up", generate the api_handler_code that uses callIntegration()`;
