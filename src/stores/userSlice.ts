import { UserProfile } from "@/types/users";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const initialState: UserProfile = {
  id: "",
  email: "",
  full_name: "",
  role: "",
  avatar_url: null,
  phone: null,
  address: null,
  is_verified: false,
  parent_user_id: "",
  store_id: 0,
  job_position: null,
  created_at: "",
  updated_at: "",
  deleted_at: null
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (_state, action: PayloadAction<UserProfile>) => {
      return action.payload; // reemplaza el user actual por el nuevo
    },
    clearUser: () => {
      return initialState; // resetea al estado inicial
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
