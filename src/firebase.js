// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_370XxyEhu77QKOUwlJgqkJ2f9KzoPEs",
  authDomain: "todo-app-79453.firebaseapp.com",
  projectId: "todo-app-79453",
  storageBucket: "todo-app-79453.firebasestorage.app",
  messagingSenderId: "936991183863",
  appId: "1:936991183863:web:2699470f635555b765d4f2",
  measurementId: "G-RVLR1EMMW8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);