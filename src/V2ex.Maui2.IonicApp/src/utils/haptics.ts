import { apiService } from "../services/apiService";

class HapticsHelper {
  async perform(type: "light" | "medium" | "heavy" | "click" | "doubleClick") {
    try {
      await apiService.haptics(type);
    } catch (e) {
      console.warn("Haptics failed", e);
    }
  }

  click() {
    this.perform("click");
  }

  light() {
    this.perform("light");
  }

  medium() {
    this.perform("medium");
  }

  heavy() {
    this.perform("heavy");
  }

  success() {
    this.perform("click");
  }

  error() {
    this.perform("heavy");
  }
}

export const Haptics = new HapticsHelper();
