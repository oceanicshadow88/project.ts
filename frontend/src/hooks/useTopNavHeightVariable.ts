import { RefObject, useLayoutEffect } from 'react';

export const TOP_NAV_HEIGHT_VARIABLE = '--top-nav-height';

/**
 * Keeps the CSS variable `--top-nav-height` equal to the fixed top nav's current height,
 * so other elements can stick directly underneath it with `top: var(--top-nav-height)`.
 */
export default function useTopNavHeightVariable(
  navRef: RefObject<HTMLElement>,
  isNavFixed: boolean
) {
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!isNavFixed || !nav) return undefined;

    const pageStyle = document.documentElement.style;

    const saveNavHeight = () => {
      const navHeight = nav.getBoundingClientRect().height;
      pageStyle.setProperty(TOP_NAV_HEIGHT_VARIABLE, `${navHeight}px`);
    };

    saveNavHeight();

    // The nav's height changes with the window width, so re-save it whenever it resizes
    const navResizeObserver = new ResizeObserver(saveNavHeight);
    navResizeObserver.observe(nav);

    return () => {
      navResizeObserver.disconnect();
      pageStyle.removeProperty(TOP_NAV_HEIGHT_VARIABLE);
    };
  }, [navRef, isNavFixed]);
}
