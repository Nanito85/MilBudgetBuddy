import { TIPS } from '@/data/tips';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

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
  idToken?: string,
): Promise<string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages, system: systemPrompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error ?? `API error ${response.status}`);
  }

  const data = await response.json();
  return data.text as string;
}
