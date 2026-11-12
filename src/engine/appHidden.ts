// Precentor: call back when the page is hidden. appHidden.native.ts does the
// same when the app goes to the background.
export function onAppHidden(callback: () => void): () => void {
  const listener = () => {
    if (document.hidden) callback();
  };
  document.addEventListener("visibilitychange", listener);
  return () => document.removeEventListener("visibilitychange", listener);
}
