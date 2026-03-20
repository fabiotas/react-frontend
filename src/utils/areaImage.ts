import { Area } from '../types';

export function getAreaPreviewImage(area: Pick<Area, 'images' | 'shareImage'>): string | null {
  if (area.shareImage) {
    return area.shareImage;
  }

  if (area.images?.length) {
    return area.images[0];
  }

  return null;
}
