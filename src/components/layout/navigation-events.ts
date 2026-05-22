export const NAVIGATION_EVENT = "zavis:navigation-start";

export function dispatchRouteLoadingStart() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NAVIGATION_EVENT));
}
