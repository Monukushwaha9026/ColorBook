export interface ImageStorage {
  /**
   * Save an image buffer for a specific book page and return its public URL/path
   */
  saveImage(buffer: Buffer, bookId: string, pageNumber: number): Promise<string>;

  /**
   * Get the public URL/path for a stored page
   */
  getImageUrl(bookId: string, pageNumber: number): string;

  /**
   * Delete an individual page image
   */
  deletePageImage(bookId: string, pageNumber: number): Promise<void>;

  /**
   * Delete all stored images for a book
   */
  deleteBookImages(bookId: string): Promise<void>;
}
