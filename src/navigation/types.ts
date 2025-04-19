export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  AddMedication: undefined;
  MedicationDetails: { id: string };
  EditMedication: { id: string };
  GuardianManagement: undefined;
  AcceptGuardianInvite: { token: string };
  Settings: undefined;
  NotificationTest: undefined;
}; 