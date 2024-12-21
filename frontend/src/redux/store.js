import { configureStore } from "@reduxjs/toolkit";
import userAuth from "./userAuth/authSlice";
import myVariableReducer from "./variables/myVariableSlice"; // Import the new slice

export const store = configureStore({
    reducer: {
        auth: userAuth, // Existing reducer
        myVariable: myVariableReducer, // New reducer
    },
});
