import { RefObject, useEffect, useState } from 'react';

// Allows for sub-pixel rounding differences between the element's position and its `top` value
const PIXEL_TOLERANCE = 1;

/**
 * Returns true while a `position: sticky` element is pinned in place,
 * i.e. the page has scrolled far enough that it is sitting at its `top` offset.
 */
export default function useIsStickyElementPinned(stickyElementRef: RefObject<HTMLElement>) {
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const element = stickyElementRef.current;
    if (!element) return undefined;

    const updateIsPinned = () => {
      const { position, top } = getComputedStyle(element);
      const isSticky = position === 'sticky';
      const pinnedTop = parseFloat(top);
      const currentTop = element.getBoundingClientRect().top;

      setIsPinned(isSticky && currentTop <= pinnedTop + PIXEL_TOLERANCE);
    };

    updateIsPinned();
    window.addEventListener('scroll', updateIsPinned, { passive: true });
    window.addEventListener('resize', updateIsPinned);

    return () => {
      window.removeEventListener('scroll', updateIsPinned);
      window.removeEventListener('resize', updateIsPinned);
    };
  }, [stickyElementRef]);

  return isPinned;
}
