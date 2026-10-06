const FALLBACK_COVER_URL = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop';

export const getCoverImageUrl = (coverUrl) => {
  if (!coverUrl) return FALLBACK_COVER_URL;

  try {
    const url = new URL(coverUrl);
    if (url.hostname !== 'drive.google.com' && url.hostname !== 'docs.google.com') {
      return coverUrl;
    }

    const fileId = url.searchParams.get('id')
      || url.pathname.match(/\/(?:file\/)?d\/([^/]+)/)?.[1]
      || url.pathname.match(/^\/([^/]+)\/view/)?.[1];

    return fileId
      ? `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`
      : coverUrl;
  } catch {
    return coverUrl;
  }
};

export const handleCoverImageError = (event) => {
  if (event.currentTarget.src === FALLBACK_COVER_URL) {
    event.currentTarget.style.display = 'none';
    return;
  }

  event.currentTarget.src = FALLBACK_COVER_URL;
};