import type { ImageGenerationInput } from './image-provider.interface.js';
import type { AgeGroup } from '../../types/index.js';

export class ImagePromptBuilder {
  /**
   * Neutralize potentially dark, violent, or graphic creative concepts into safe, family-friendly coloring themes
   */
  static sanitizeForSafety(text: string): string {
    if (!text) return '';

    let safe = text;

    // Safety filters: rewrite harmful or graphic tropes to friendly coloring equivalents
    const safetyReplacements: Array<[RegExp, string]> = [
      [/\b(blood|bloody|gore|gory|bleeding)\b/gi, 'playful colors'],
      [/\b(murder|kill|killing|slaughter|decapitate|dismember|sever|severed|behead|beheading)\b/gi, 'playfully surprise'],
      [/\b(attack|attacking|attacked|assault|violent|violence|weapon|gun|knife|stab|terror)\b/gi, 'playing with'],
      [/\b(corpse|dead body|rotting)\b/gi, 'vintage mystery'],
      [/\b(scary zombie|zombie eating|zombie|cannibal|flesh|undead)\b/gi, 'friendly playful character'],
      [/\b(nude|naked|erotic|sexual|nsfw|sensual)\b/gi, 'clothed cartoon character'],
      [/\b(hate|racist|extremist|terrorist)\b/gi, 'friendly hero'],
    ];

    for (const [pattern, replacement] of safetyReplacements) {
      safe = safe.replace(pattern, replacement);
    }

    return safe.trim();
  }

  /**
   * Age-specific linework and complexity rules
   */
  private static getAgeSpecificRules(ageGroup: AgeGroup): string {
    switch (ageGroup) {
      case 'kids':
        return `
Age group: Kids (3–6 years old).
- Extra-thick, bold, single-stroke black outlines.
- Very simple large shapes with minimal small parts.
- Huge open areas that are extremely easy to color with crayons.
- Completely minimal or empty background to prevent visual clutter.
- Friendly, cute, simplified character features.`;

      case 'children':
        return `
Age group: Children (7–10 years old).
- Crisp, medium-weight defined black outlines.
- Playful, recognizable storytelling elements with moderate detail.
- Engaging environmental props (friendly trees, stars, simple vehicles).
- Clear, well-enclosed coloring zones suitable for markers or colored pencils.`;

      case 'teens':
        return `
Age group: Teens (11–13 years old).
- Fine, expressive black linework with stylized proportions.
- Dynamic perspective and layered foreground, midground, and background.
- Creative patterns, decorative details, and stylized textures.
- Balanced coloring spaces for fine-tip markers.`;

      case 'teen_plus':
        return `
Age group: Teen+ (14–17 years old).
- Highly intricate, sophisticated black line art illustration.
- Rich, ornate backgrounds with mandala touches, geometric hatching, or botanical patterns.
- Complex aesthetic compositions intended for advanced adult/teen coloring.
- Fine detailed outlines with diverse line weights.`;

      default:
        return 'Clear, clean black outlines on pure white background, suitable for coloring.';
    }
  }

  /**
   * Build the complete positive prompt for the image generation model
   */
  static buildPrompt(input: ImageGenerationInput): string {
    const safeConcept = this.sanitizeForSafety(input.concept);
    const safeTheme = this.sanitizeForSafety(input.theme);
    const ageRules = this.getAgeSpecificRules(input.ageGroup);

    let prompt = `Create a printable black-and-white coloring book page illustration.

Subject:
${safeConcept} (Book theme: ${safeTheme})

${ageRules}

Style and Technical Requirements:
- Pure black and white line art on a solid, pure, crisp white background (#FFFFFF).
- Clean vector line art, continuous enclosed contours.
- ZERO color, ZERO grayscale, ZERO shading, ZERO gradients, ZERO watercolor wash.
- No photorealism, no 3D rendering, no blurred shadows.
- No unnecessary large solid black fills (leave subjects white inside outlines so user can color them).
- Centered portrait composition with generous white paper margins around the edges.
- Absolutely NO text, NO labels, NO typography, NO watermark, NO signatures, NO border frames.
- Professional printable coloring page quality ready for print.`;

    if (input.isRegeneration) {
      prompt += `

Composition Variation Requirement:
Create a completely fresh and distinct alternative composition for this scene.
Change the character pose, camera angle, and surrounding environmental elements.
Do NOT repeat the previous layout.`;
    }

    return prompt;
  }

  /**
   * Build negative prompt for image models that support negative cues
   */
  static buildNegativePrompt(): string {
    return [
      'color',
      'colors',
      'colored',
      'grayscale',
      'shading',
      'shadows',
      'drop shadows',
      'gradients',
      'photorealistic',
      '3d render',
      'solid black background',
      'dark background',
      'heavy black fills',
      'blurry',
      'sketchy',
      'dithering',
      'noise',
      'halftone',
      'text',
      'letters',
      'words',
      'watermark',
      'logo',
      'signature',
      'frame',
      'cropped',
      'deformed',
      'gore',
      'bloody',
    ].join(', ');
  }

  /**
   * Build both positive and negative prompts
   */
  static build(input: ImageGenerationInput): { prompt: string; negativePrompt: string } {
    return {
      prompt: this.buildPrompt(input),
      negativePrompt: this.buildNegativePrompt(),
    };
  }
}
