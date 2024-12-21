// myVariableSlice.js
import { createSlice } from "@reduxjs/toolkit";

const myVariableSlice = createSlice({
    name: "myVariable",
    initialState: { value: "" }, // Set the default value of your variable
    reducers: {
        updateVariable: (state, action) => {
            state.value = action.payload; // Update the variable value
        },
    },
});

export const { updateVariable } = myVariableSlice.actions; // Export actions
export default myVariableSlice.reducer; // Export the reducer
