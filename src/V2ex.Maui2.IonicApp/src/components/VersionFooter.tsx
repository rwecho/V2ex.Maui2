import { IonItem, IonLabel, IonTitle } from "@ionic/react";
import { useRef } from "react";
import packageJson from "../../package.json";
import { useDevModeStore } from "../store/devModeStore";

interface VersionFooterProps {
  appVersion: string;
}

const VersionFooter: React.FC<VersionFooterProps> = ({ appVersion }) => {
  const toggleDevMode = useDevModeStore((state) => state.toggleDevMode);
  const versionTapCountRef = useRef<number>(0);
  const versionTapTimerRef = useRef<number | null>(null);

  const handleVersionTap = () => {
    if (versionTapTimerRef.current !== null) {
      window.clearTimeout(versionTapTimerRef.current);
    }

    versionTapCountRef.current += 1;

    versionTapTimerRef.current = window.setTimeout(() => {
      versionTapCountRef.current = 0;
      versionTapTimerRef.current = null;
    }, 1500);

    if (versionTapCountRef.current >= 7) {
      versionTapCountRef.current = 0;
      toggleDevMode?.();
    }
  };

  return (
    <IonItem lines="none" onClick={handleVersionTap} button detail={false}>
      <IonLabel>版本 {appVersion || packageJson.version}</IonLabel>
    </IonItem>
  );
};

export default VersionFooter;
