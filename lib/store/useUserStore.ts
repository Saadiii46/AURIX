import { create } from "zustand";
import { getCurrentUser } from "../firebase/users";

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  fetchUser: async () => {
    set({ isLoading: true });
    const data = await getCurrentUser();
    console.log("Data recieving from firestore: ", data);
    set({ user: data, isLoading: false });
  },
  clearUser: () => set({ user: null, isLoading: false }),
}));
