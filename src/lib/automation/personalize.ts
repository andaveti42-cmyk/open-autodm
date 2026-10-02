/**
 * Message personalization - the username placeholder.
 *
 * Accepted spellings (all equivalent): {username}  {{username}}  {@username}
 * {{@username}}  - spaces inside the braces and any letter case are fine.
 * Every spelling renders as the commenter's handle with a single "@".
 *
 * Comment webhooks carry the commenter's username; DM/story-reply webhooks do
 * not. When no username is known the placeholder is stripped and surrounding
 * whitespace collapsed, so "Hey {username}!" degrades to "Hey!" not "Hey !".
 */

const PLACEHOLDER = /\{+\s*@?\s*username\s*\}+/gi;

export function renderTemplate(text: string, username: string | null | undefined): string {
  // Preserve ordinary message whitespace when there is no placeholder.
  if (!text.match(PLACEHOLDER)) return text;
  const handle = username?.trim().replace(/^@/, '') ?? '';
  if (handle) {
    return text.replace(PLACEHOLDER, `@${handle}`);
  }
  return text
    .replace(PLACEHOLDER, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ ([!?.,])/g, '$1')
    .trim();
}
