class VirtualList {
  constructor(options) {
    this.options = {
      container: null, // Scrollable container element
      totalItems: 0, // Total number of items in the list
      itemHeight: 90, // Fixed height makes calculations simpler
      overscan: 10, // Extra items to render outside viewport
      renderItem: null, // Function to render each item
      ...options,
    };

    this.state = {
      items: [], // All list items data
      renderedItems: [], // Items currently in DOM
      scrollTop: 0, // Current scroll position
      startIndex: 0, // First visible item index
      endIndex: 0, // Last visible item index
      containerHeight: 0, // Visible height of viewport
      totalHeight: 0, // Total scrollable content height
      isLoading: true, // Controls loading state display
      cachedItems: new Map(), // DOM recycling cache for better performance
      scrollTimer: null, // Used for scroll event throttling
      isScrolling: false, // Tracks active scrolling state
      isInitialRender: true, // Tracks if this is the first render after loading
    };

    this.imageLoader = new LazyImageLoader();

    this.init();
  }

  init() {
    if (!this.options.container) {
      throw new Error("Container element is required");
    }

    // Get references and set initial dimensions
    this.content = this.options.container.querySelector(".list-content");

    // Set initial total height (will be updated when real items are loaded)
    this.state.totalHeight = this.options.totalItems * this.options.itemHeight;
    this.content.style.height = `${this.state.totalHeight}px`;

    // Get container dimensions for viewport calculations
    this.state.containerHeight = this.options.container.clientHeight;

    // Show skeleton loaders based on container height
    if (this.state.isLoading) {
      this.showLoadingState();
    }

    // Set up optimized scroll handling
    this.options.container.addEventListener(
      "scroll",
      this.handleScrollThrottled.bind(this)
    );

    // Add scroll class for performance optimizations
    this.options.container.addEventListener("scroll", () => {
      if (!this.state.isScrolling) {
        this.options.container.classList.add("is-scrolling");
        this.state.isScrolling = true;
      }

      clearTimeout(this.state.scrollTimer);

      this.state.scrollTimer = setTimeout(() => {
        this.options.container.classList.remove("is-scrolling");
        this.state.isScrolling = false;
      }, 150);
    });

    this.handleScroll();
  }

  showLoadingState() {
    // Create skeleton loaders to mimic list items
    let skeletonHTML = "";

    // Calculate how many skeleton items to show based on viewport height
    const skeletonCount =
      Math.ceil(this.state.containerHeight / this.options.itemHeight) + 2;

    for (let i = 0; i < skeletonCount; i++) {
      skeletonHTML += `
        <div class="skeleton-item" style="position: absolute; top: ${
          i * this.options.itemHeight
        }px;">
          <div class="skeleton-content">
            <div class="skeleton-image"></div>
            <div class="skeleton-details">
              <div class="skeleton-title"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
        </div>
      `;
    }

    this.content.innerHTML = skeletonHTML;
  }

  // Use requestAnimationFrame for better scroll performance
  handleScrollThrottled() {
    if (this.state.isLoading || !this.options.items.length) {
      return;
    }

    if (!this.state.requestId) {
      this.state.requestId = requestAnimationFrame(() => {
        this.handleScroll();
        this.state.requestId = null;
      });
    }
  }

  handleScroll() {
    this.state.scrollTop = this.options.container.scrollTop;

    if (this.state.isLoading || !this.options.items.length) {
      return;
    }

    // Calculate which items should be visible
    const newStartIndex = Math.max(
      0,
      Math.floor(this.state.scrollTop / this.options.itemHeight) -
        this.options.overscan
    );

    const newEndIndex = Math.min(
      this.options.totalItems - 1,
      Math.ceil(
        (this.state.scrollTop + this.state.containerHeight) /
          this.options.itemHeight
      ) + this.options.overscan
    );

    // Only update DOM when visible range changes
    if (
      newStartIndex !== this.state.startIndex ||
      newEndIndex !== this.state.endIndex
    ) {
      this.state.startIndex = newStartIndex;
      this.state.endIndex = newEndIndex;
      this.renderVisibleItems();
    }
  }

  renderVisibleItems() {
    // Track if this is the first render after loading
    const isInitialRender = this.state.isInitialRender;

    // Clear existing content but in a smarter way (DOM reuse)
    this.optimizedClearContent();

    // Only render what's visible (+ overscan buffer)
    for (let i = this.state.startIndex; i <= this.state.endIndex; i++) {
      const item = this.options.items[i];

      // Try to reuse existing DOM elements for better performance
      let itemElement = this.state.cachedItems.get(i);
      let isNewElement = false;

      if (!itemElement) {
        // Create new element if not in cache
        itemElement = document.createElement("div");
        itemElement.className = "list-item";

        // Only add the animation class for initial render
        if (isInitialRender) {
          itemElement.classList.add("initial-load");

          // Remove the animation class after it completes to prevent future animations
          itemElement.addEventListener(
            "animationend",
            function () {
              this.classList.remove("initial-load");
            },
            { once: true }
          );
        }

        itemElement.style.position = "absolute";
        itemElement.style.top = `${i * this.options.itemHeight}px`;
        itemElement.style.height = `${this.options.itemHeight}px`;
        itemElement.style.width = "100%";
        itemElement.style.boxSizing = "border-box";
        itemElement.style.left = "0";

        // GPU acceleration for smoother scrolling
        itemElement.style.transform = "translateZ(0)";
        itemElement.style.willChange = "transform";

        if (this.options.renderItem) {
          const itemContent = this.options.renderItem(item, i);
          if (typeof itemContent === "string") {
            itemElement.innerHTML = itemContent;
          } else if (itemContent instanceof Node) {
            itemElement.appendChild(itemContent);
          }

          this.state.cachedItems.set(i, itemElement);
        }

        isNewElement = true;
      } else {
        // If we're reusing an element, make sure it doesn't have the initial-load class
        itemElement.classList.remove("initial-load");
      }

      this.content.appendChild(itemElement);

      // Lazy load images only if this is a new element
      if (isNewElement) {
        const images = itemElement.querySelectorAll("img");
        images.forEach((img) => {
          if (img.dataset.src && !img.dataset.loaded) {
            this.imageLoader.observe(img, img.dataset.src);
            img.dataset.loaded = "pending";
          }
        });
      }
    }

    // After first render, turn off the initial render flag
    if (isInitialRender) {
      this.state.isInitialRender = false;
    }

    this.limitCacheSize();
  }

  optimizedClearContent() {
    // More efficient than innerHTML = ""
    while (this.content.firstChild) {
      // If the element has the initial-load class, remove it
      // to prevent re-animation when recycled
      if (
        this.content.firstChild.classList &&
        this.content.firstChild.classList.contains("initial-load")
      ) {
        this.content.firstChild.classList.remove("initial-load");
      }
      this.content.removeChild(this.content.firstChild);
    }
  }

  limitCacheSize() {
    // Prevent memory issues by capping cache size
    const maxCacheSize = 100;
    if (this.state.cachedItems.size > maxCacheSize) {
      const keysToDelete = Array.from(this.state.cachedItems.keys())
        .sort((a, b) => {
          // Keep items close to visible area, remove distant ones
          const distA = Math.min(
            Math.abs(a - this.state.startIndex),
            Math.abs(a - this.state.endIndex)
          );
          const distB = Math.min(
            Math.abs(b - this.state.startIndex),
            Math.abs(b - this.state.endIndex)
          );
          return distB - distA;
        })
        .slice(0, this.state.cachedItems.size - maxCacheSize);

      keysToDelete.forEach((key) => {
        this.state.cachedItems.delete(key);
      });
    }
  }

  setItems(items) {
    // Add a small delay to make the transition smoother
    setTimeout(() => {
      // Remove all skeleton loaders
      this.optimizedClearContent();

      // Clear the element cache to ensure fresh rendering
      this.state.cachedItems.clear();

      // Update state with actual items
      this.options.items = items;
      this.options.totalItems = items.length;
      this.state.totalHeight =
        this.options.totalItems * this.options.itemHeight;
      this.content.style.height = `${this.state.totalHeight}px`;
      this.state.isLoading = false;

      // Set the flag to indicate this is the initial render
      this.state.isInitialRender = true;

      // Render the actual items
      this.handleScroll();
    }, 300);
  }

  destroy() {
    this.options.container.removeEventListener(
      "scroll",
      this.handleScrollThrottled
    );
    this.options.container.removeEventListener(
      "scroll",
      this.handleScrollAnimation
    );
    this.imageLoader.destroy();
    this.state.cachedItems.clear();
    if (this.state.requestId) {
      cancelAnimationFrame(this.state.requestId);
    }
    clearTimeout(this.state.scrollTimer);
  }
}
