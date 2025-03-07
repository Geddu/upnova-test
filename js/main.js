document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing virtual list...");

  const listContainer = document.querySelector(".list-viewport");
  const virtualList = new VirtualList({
    container: listContainer,
    totalItems: 10000,
    itemHeight: 90,
    overscan: 5,
    items: [], // Will be populated later
    renderItem: (item, index) => {
      if (!item) return "<div>Loading...</div>";

      // Random photographer name for visual variety
      const photographers = [
        "Alex Rivera",
        "Sam Taylor",
        "Jordan Chen",
        "Morgan Lee",
        "Casey Kim",
        "Jamie Smith",
        "Riley Johnson",
        "Taylor Wong",
      ];
      const photographer = photographers[item.id % photographers.length];

      // Clean, simple item template styled like Astro Shop
      return `
        <div class="item-content">
          <img data-src="${item.imageUrl}" alt="Photo ${index + 1}">
          <div class="item-details">
            <h3>Photo #${index + 1}</h3>
            <p>By ${photographer} • ID: ${item.imageId}</p>
          </div>
        </div>
      `;
    },
  });

  console.log("Loading items data...");

  // Small delay to show loading state
  setTimeout(() => {
    loadItems()
      .then((items) => {
        console.log(`Successfully loaded ${items.length} items`);
        virtualList.setItems(items);
      })
      .catch((error) => {
        console.error("Error loading items:", error);
      });
  }, 800);
});

async function loadItems() {
  console.log("Generating 10,000 image items...");
  const items = [];
  const totalItems = 10000;
  const batchSize = 1000;

  // Cycle through available images (max 1000)
  for (let i = 0; i < totalItems; i++) {
    // Log progress periodically
    if (i % batchSize === 0 && i > 0) {
      console.log(`Generated ${i} of ${totalItems} items...`);
    }

    const imageId = (i % 1000) + 1;
    items.push({
      id: i,
      imageId: imageId,
      imageUrl: `https://picsum.photos/id/${imageId}/200/200`,
    });
  }

  console.log("All items generated and ready to display");
  return items;
}
