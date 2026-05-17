import type { ChatCompletionClient, ChatCompletionRequest, ChatCompletionResponse } from '@shared/contracts/ChatCompletionClient';

const RESPONSES: Array<{ pattern: RegExp; response: string }> = [
  { pattern: /safe|safety|dangerous/i, response: "Most major tourist destinations maintain good safety standards. Stay aware of your surroundings, keep valuables secure, avoid isolated areas at night, and register with your embassy. Check official travel advisories for your specific destination." },
  { pattern: /scam|fraud|theft/i, response: "Common travel scams:\n• Overcharging taxis — use meters or agree on price first\n• Fake police asking to see your wallet\n• Unofficial tour guides\n• Pickpockets in crowded areas\n\nTrust your instincts. If something feels wrong, walk away." },
  { pattern: /emergency|help|hospital|police/i, response: "Emergency tips:\n• Save local emergency numbers in your phone\n• Know your embassy's location\n• Keep travel insurance details accessible\n• Share your itinerary with someone at home\n\nIn Europe dial 112, in the US dial 911." },
  { pattern: /water|drink|food/i, response: "Food and water safety:\n• Drink bottled water where quality is uncertain\n• Eat at busy, well-reviewed restaurants\n• Wash hands frequently\n\nRemember: 'Boil it, cook it, peel it, or forget it.'" },
  { pattern: /transport|taxi|uber|bus|train/i, response: "Transport safety:\n• Use official or licensed taxis and rideshare apps\n• Agree on fares before starting\n• Keep belongings visible\n• Avoid travelling alone late at night." },
  { pattern: /health|medical|doctor|medication/i, response: "Health advice:\n• Get required vaccinations before travel\n• Pack prescription medications with documentation\n• Get travel health insurance\n• Carry medication in original containers." },
];

const DEFAULT_RESPONSE = "I'm here to help with travel safety questions! Ask me about safety at specific destinations, common scams, emergency procedures, health advice, transportation safety, or local laws.";

export class MockChatClient implements ChatCompletionClient {
  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    await new Promise((r) => setTimeout(r, 800)); // simulate network delay
    const match = RESPONSES.find((r) => r.pattern.test(request.message));
    return { text: match?.response ?? DEFAULT_RESPONSE };
  }
}
