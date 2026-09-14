import { describe, expect, it } from 'vitest';
import { SKILL_DESCRIPTION, createSkillMarkdown } from '../src/skill.js';

describe('createSkillMarkdown', () => {
  const markdown = createSkillMarkdown();

  it('starts with discovery frontmatter', () => {
    expect(markdown.startsWith('---\nname: design-system-axi\n')).toBe(true);
    expect(markdown).toContain(
      `description: ${JSON.stringify(SKILL_DESCRIPTION)}`,
    );
    expect(markdown).toContain('user-invocable: false');
  });

  it('defers to the live CLI instead of restating it', () => {
    expect(markdown).toContain('`npx -y design-system-axi`');
    expect(markdown).toContain(
      '`npx -y design-system-axi find "<what you are building>"`',
    );
    expect(markdown).toContain('`npx -y design-system-axi --help`');
    expect(markdown).not.toContain('props_shown');
  });
});
