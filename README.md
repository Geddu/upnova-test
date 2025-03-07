# Upnova Code Challenge

Hey there! 👋 This repo contains my solutions to two challenging frontend tasks: a smooth product card animation and a high-performance virtualized list.
You can navigate between the 2 solutions with the "Visit Astro Shop" and "Back to image gallery" buttons!

Check it out live here: https://geddu.github.io/upnova-test/index.html

## Task 1: The Slick Card-to-Detail Animation

The first challenge was to recreate the smooth animation from [Astro Shop](https://codrops-1f606.kxcdn.com/codrops/wp-content/uploads/2023/10/astro-shop-video.mp4?x17434) using only vanilla JavaScript and CSS (no libraries allowed!).

### The Approach

Initially proved to be much more challenging than I tought, as I'm used to animation libraries like Framer motion, and using Tailwind for CSS. I managed to implemented this using the FLIP animation technique (First, Last, Invert, Play):

### The Cool Bits

- Used `getBoundingClientRect()` to precisely measure element positions
- Created "clones" of the card elements that animate independently
- Implemented smooth crossfades between animated clones and real content
- Added fluid transitions for both opening and closing the detail view

Check out https://geddu.github.io/upnova-test/astro_shop.html to see it in action - the entire solution is contained in a single file! (which might have been a mistake, and I might go back and slice it up later)

## Task 2: Rendering 10,000+ Items With No Hiccups

The second challenge was to create a list that can efficiently render 10,000+ items without performance issues. No external virtualization libraries allowed!

### The Solution

I built a custom virtualization system with these key components:

1. **Virtual DOM Recycling**: Only renders the 15-20 items visible in the viewport (plus a few extras for smooth scrolling)
2. **Optimized Rendering**: Uses absolute positioning and fixed height calculations to maintain proper scrollbar behavior
3. **Intersection Observer**: Lazily loads images only when they're about to enter the viewport
4. **DOM Element Recycling**: Reuses DOM nodes when scrolling to minimize garbage collection
5. **Performance Optimizations**: Adds GPU acceleration, throttled scroll handling, and optimized transitions

### Neat Features

- Skeleton loading screens that match the final content layout
- Smooth fade-in animations when content first loads
- Optimized scrolling with no jank or flickering
- Memory-efficient caching system to prevent memory leaks
- Responsive design that works across all device sizes

## How to Run It

Simply open https://geddu.github.io/upnova-test/index.html in your browser to see the virtualized list in action. Click the "Visit Astro Shop" button to check out the card animation implementation.

The entire project uses vanilla JavaScript and CSS - no build steps or dependencies required!

## Technical Notes

- Both solutions use modern browser APIs but remain framework-free
- All animations are GPU-accelerated for smooth performance
- The virtualization technique can be adapted to any data source
- The FLIP animation pattern can be applied to many different UI transitions

Thanks for taking the time to read!
