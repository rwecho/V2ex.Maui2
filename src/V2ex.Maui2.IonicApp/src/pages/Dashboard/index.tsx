import { IonRouterOutlet } from "@ionic/react";
import { Route, RouteComponentProps } from "react-router-dom";
import UsersListPage from "./UsersListPage";
import UserDetailPage from "./UserDetailPage";

const DashboardPage: React.FC<RouteComponentProps> = ({ match }) => {
  return (
    <IonRouterOutlet>
      <Route exact path={match.url} component={UsersListPage} />
      <Route path={`${match.url}/users/:id`} component={UserDetailPage} />
    </IonRouterOutlet>
  );
};

export default DashboardPage;
