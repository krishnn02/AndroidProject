import cloudinary from '../config/cloudinary.js';
import { Image, type IImage } from '../models/index.js';
import { createError } from '../middleware/error.js';
import fs from 'fs/promises';

class ImageService {
  /**
   * Upload images to Cloudinary and save to DB
   */
  async uploadImages(
    sectionId: string,
    files: Express.Multer.File[]
  ): Promise<IImage[]> {
    const images: IImage[] = [];

    // Get current max sort order
    const lastImage = await Image.findOne({ section: sectionId }).sort({ sortOrder: -1 });
    let sortOrder = lastImage ? lastImage.sortOrder + 1 : 0;

    for (const file of files) {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'event-reports',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        });

        // Save to DB
        const image = await Image.create({
          section: sectionId,
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          sortOrder: sortOrder++,
        });

        images.push(image);

        // Clean up local file
        await fs.unlink(file.path).catch(() => {});
      } catch (error) {
        // Clean up local file on error
        await fs.unlink(file.path).catch(() => {});
        console.error('Image upload error:', error);
      }
    }

    if (images.length === 0) {
      throw createError(500, 'Failed to upload images');
    }

    return images;
  }

  /**
   * Delete image from Cloudinary and DB
   */
  async deleteImage(imageId: string): Promise<void> {
    const image = await Image.findById(imageId);
    if (!image) throw createError(404, 'Image not found');

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
    }

    await image.deleteOne();
  }

  /**
   * Reorder images within a section
   */
  async reorderImages(sectionId: string, imageIds: string[]): Promise<void> {
    const bulkOps = imageIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, section: sectionId },
        update: { sortOrder: index },
      },
    }));
    await Image.bulkWrite(bulkOps);
  }

  /**
   * Upload logo/banner for front page (returns URL only)
   */
  async uploadLogo(file: Express.Multer.File): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'event-reports/logos',
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto:best' },
        ],
      });

      await fs.unlink(file.path).catch(() => {});
      return result.secure_url;
    } catch (error) {
      await fs.unlink(file.path).catch(() => {});
      throw createError(500, 'Failed to upload logo');
    }
  }
}

export const imageService = new ImageService();
