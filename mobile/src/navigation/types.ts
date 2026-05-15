import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AcceptInvite: { token: string };
};

export type MainTabParamList = {
  Profil: undefined;
  Leki: undefined;
  Pomiary: undefined;
  Inr: undefined;
};

export type RootStackNav = NativeStackNavigationProp<RootStackParamList>;
export type MainTabNav = BottomTabNavigationProp<MainTabParamList>;

export type TabScreenNav = CompositeNavigationProp<MainTabNav, RootStackNav>;
