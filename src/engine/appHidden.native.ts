// Precentor: call back when the app goes to the background. See appHidden.ts.
import { AppState } from "react-native";

export function onAppHidden(callback: () => void): () => void {
  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "background") callback();
  });
  return () => subscription.remove();
}
