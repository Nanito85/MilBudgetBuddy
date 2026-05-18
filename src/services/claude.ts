import { TIPS } from '@/data/tips';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;

const BASE_SYSTEM_PROMPT = `You are a friendly and knowledgeable military personal finance advisor helping servicemembers and their families make smarter financial decisions.

Your areas of expertise include:
- Thrift Savings Plan (TSP), BRS, and High-3 retirement systems
- Military pay: base pay, BAH, BAS, special pays, and the LES
- VA home loans, BAH optimization, and PCS financial planning
- Legal protections: SCRA (6% interest cap on pre-service debt) and MLA (36% APR cap)
- Life insurance: SGLI and VGLI
- Healthcare: TRICARE and DEERS enrollment
- Credit building, debt payoff, and avoiding predatory lenders
- Investing: Roth IRA, index funds, dollar-cost averaging
- Deployment savings: Savings Deposit Program (10% guaranteed return)
- Military benefits: commissary, Exchange, MWR

Keep responses conversational, practical, and direct. Give specific actionable advice. Use plain sentences — avoid heavy markdown. Use short bullet points only when listing multiple items. Keep responses concise (2–4 paragraphs max unless more detail is genuinely needed).

You are not a licensed financial advisor. For major decisions, recommend a Certified Financial Planner (CFP) who works with military families.`;

export function buildSystemPrompt(contextTipId?: string | null): string {
  if (!contextTipId) return BASE_SYSTEM_PROMPT;

  const tip = TIPS.find((t) => t.id === contextTipId);
  if (!tip) return BASE_SYSTEM_PROMPT;

  return `${BASE_SYSTEM_PROMPT}

The user is asking follow-up questions about this financial tip:
Title: "${tip.title}"
Content: "${tip.body}"

Help them understand this topic more deeply and apply it to their specific military situation.`;
}

export interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function callClaude(
  messages: ApiMessage[],
  systemPrompt: string,
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('ANTHROPIC_API_KEY_MISSING');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text as string;
}
