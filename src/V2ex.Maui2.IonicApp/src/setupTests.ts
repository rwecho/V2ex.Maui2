// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";

// Mock matchmedia
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

// Ionic (ion-segment) may call `el.scrollTo(...)`, which JSDOM doesn't implement.
// Provide a no-op implementation to avoid unhandled exceptions during unit tests.
if (!(HTMLElement.prototype as any).scrollTo) {
  (HTMLElement.prototype as any).scrollTo = function () {
    // no-op
  };
}
