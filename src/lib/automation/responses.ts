import type { DMResponse } from '@/lib/types';

/** A link-only response is still content, even when its caption is empty. */
export function hasResponseContent(response: DMResponse): boolean {
  return response.type === 'card' || !!response.content?.trim() || !!response.buttonLink?.trim();
}

/** Keep older automations that stored their link on the opening message working. */
export function getFollowUpResponses(automation: {
  dm_responses: DMResponse[];
  dm_opening_message_button_link: string | null;
}): DMResponse[] {
  const responses = (automation.dm_responses ?? []).filter(hasResponseContent);
  if (responses.length) return responses;
  const link = automation.dm_opening_message_button_link?.trim();
  return link ? [{ id: 'opening-link', type: 'text', content: link }] : [];
}
