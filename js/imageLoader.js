class LazyImageLoader {
  constructor() {
    // Set up observer to detect when images enter viewport
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersections(entries),
      {
        rootMargin: "300px 0px", // Load well before visible to avoid flickering
        threshold: 0.01,
      }
    );

    this.observedImages = new Map();
  }

  observe(imgElement, src) {
    // Store the real source and replace with placeholder
    imgElement.dataset.src = src;

    // Use SVG placeholder to prevent layout shifts
    imgElement.src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70" width="70" height="70"%3E%3Crect width="70" height="70" fill="%23f0f0f0"/%3E%3C/svg%3E';
    imgElement.classList.add("placeholder");

    // Lock dimensions and optimize rendering
    imgElement.style.width = "70px";
    imgElement.style.height = "70px";
    imgElement.style.willChange = "opacity";
    imgElement.style.backfaceVisibility = "hidden";
    imgElement.style.WebkitBackfaceVisibility = "hidden";
    imgElement.style.transform = "translateZ(0)";

    // Start tracking this image
    this.observer.observe(imgElement);
    this.observedImages.set(imgElement, false);
  }

  handleIntersections(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;

        // Only load each image once
        if (!this.observedImages.get(img)) {
          const src = img.dataset.src;
          if (src) {
            // Mark as being processed to prevent double-loading
            this.observedImages.set(img, true);

            const newImg = new Image();

            // Smooth transition when image loads
            newImg.onload = () => {
              img.style.opacity = "0";
              setTimeout(() => {
                img.src = src;
                img.classList.remove("placeholder");

                requestAnimationFrame(() => {
                  img.style.transition = "opacity 0.3s ease";
                  img.style.opacity = "1";
                });
              }, 10);
            };

            // Fallback for loading errors
            newImg.onerror = () => {
              img.src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70" width="70" height="70"%3E%3Crect width="70" height="70" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" font-size="10" text-anchor="middle" fill="%23999" dominant-baseline="middle"%3EError%3C/text%3E%3C/svg%3E';
              this.observedImages.set(img, true);
              this.observer.unobserve(img);
            };

            newImg.src = src;
          }
        }

        // Stop observing once handled
        if (this.observedImages.get(img)) {
          this.observer.unobserve(img);
        }
      }
    });
  }

  // Resource cleanup
  destroy() {
    this.observer.disconnect();
    this.observedImages.clear();
  }
}
