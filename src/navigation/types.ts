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
  DoctorSearch: undefined;
  MedicineSearch: undefined;
  PharmacyDetails: { id: string, name: string };
  MedicalCategory: { category: string };
  PharmacyList: undefined;
  PillReminder: undefined;
}; 