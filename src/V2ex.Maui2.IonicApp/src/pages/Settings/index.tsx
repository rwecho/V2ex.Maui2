import {
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonBackButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonRadioGroup,
  IonRadio,
} from "@ionic/react";
import { useFontSizeStore, FontSize } from "../../store/fontSizeStore";
import { applyFontSize } from "../../theme/fontSize";

const SettingsPage: React.FC = () => {
  const { fontSize, setFontSize } = useFontSizeStore();

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    applyFontSize(size);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>设置</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          <IonItem lines="none">
            <IonLabel>
              <h2>字体大小</h2>
              <p>调整应用内的文字显示大小</p>
            </IonLabel>
          </IonItem>
          
          <IonRadioGroup
            value={fontSize}
            onIonChange={(e) => handleFontSizeChange(e.detail.value)}
          >
            <IonItem lines="full">
              <IonLabel>小</IonLabel>
              <IonRadio slot="end" value="small" />
            </IonItem>
            <IonItem lines="full">
              <IonLabel>中</IonLabel>
              <IonRadio slot="end" value="medium" />
            </IonItem>
            <IonItem lines="full">
              <IonLabel>大</IonLabel>
              <IonRadio slot="end" value="large" />
            </IonItem>
          </IonRadioGroup>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
