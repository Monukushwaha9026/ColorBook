import { prisma } from '../lib/prisma.js';
import type { BookPageDTO } from '../types/index.js';

// Available master line art templates for mock page generation & regeneration
const MASTER_PAGE_TEMPLATES = [
  { concept: 'Rocket Launching into Orbit', imageUrl: '/illustrations/coloring-rocket.png' },
  { concept: 'Astronaut Exploring Lunar Craters', imageUrl: '/illustrations/coloring-astronaut.png' },
  { concept: 'Playful Kitten with Garden Blossoms', imageUrl: '/illustrations/coloring-cat.png' },
  { concept: 'Sunny Brachiosaurus in Palm Valley', imageUrl: '/illustrations/coloring-dinosaur.png' },
  { concept: 'Jurassic Valley Prehistoric Expedition', imageUrl: '/illustrations/coloring-dinosaur-large.png' },
  { concept: 'Helpful Workshop Robot & Gadgets', imageUrl: '/illustrations/coloring-robot.svg' },
  { concept: 'Dolphin Leaping Over Waves & Sea Turtle', imageUrl: '/illustrations/coloring-dolphin.svg' },
  { concept: 'Fairytale Kingdom Royal Castle', imageUrl: '/illustrations/coloring-castle.svg' },
  { concept: 'Baby Safari Lion in the Grass', imageUrl: '/illustrations/coloring-lion.svg' },
  { concept: 'Cosmic Flying Saucer & Moon Base', imageUrl: '/illustrations/coloring-spaceship.svg' },
];

export class PageService {
  /**
   * Regenerate an individual page without affecting other pages
   */
  static async regeneratePage(
    bookId: string,
    pageNumber: number,
    customConcept?: string
  ): Promise<BookPageDTO> {
    // Pick an alternative template
    const randomIndex = (pageNumber + Math.floor(Math.random() * 7) + 1) % MASTER_PAGE_TEMPLATES.length;
    const template = MASTER_PAGE_TEMPLATES[randomIndex];

    const updatedPage: BookPageDTO = {
      id: `page_${bookId}_${pageNumber}_${Date.now()}`,
      bookId,
      pageNumber,
      concept: customConcept || `${template.concept} (Regenerated)`,
      imageUrl: template.imageUrl,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await prisma.bookPage.upsert({
        where: {
          bookId_pageNumber: {
            bookId,
            pageNumber,
          },
        },
        update: {
          concept: updatedPage.concept,
          imageUrl: updatedPage.imageUrl,
          status: 'completed',
        },
        create: {
          id: updatedPage.id,
          bookId,
          pageNumber,
          concept: updatedPage.concept,
          imageUrl: updatedPage.imageUrl,
          status: 'completed',
        },
      });
    } catch {
      // In-memory mode
    }

    return updatedPage;
  }
}
