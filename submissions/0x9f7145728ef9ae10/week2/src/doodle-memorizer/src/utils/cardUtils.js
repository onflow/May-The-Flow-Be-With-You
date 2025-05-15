const preloadImages = (urls) =>
  Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.src = url;
          img.onload = resolve;
          img.onerror = reject;
        })
    )
  );

export const generateShuffledCards = async (rows, cols, imagesDb) => {
  const total = rows * cols;
  const evenTotal = total % 2 === 0 ? total : total - 1;
  const uniqueCount = evenTotal / 2;

  // Randomly select unique images
  const selected = [...imagesDb]
    .sort(() => 0.5 - Math.random())
    .slice(0, uniqueCount);

  // Preload the selected images (await here)
  await preloadImages(selected);

  // Create pairs and shuffle again
  const duplicated = selected.flatMap((img, idx) => [
    { id: `${idx}-a`, image: img, matched: false, flipped: false },
    { id: `${idx}-b`, image: img, matched: false, flipped: false },
  ]);

  return duplicated.sort(() => 0.5 - Math.random());
};