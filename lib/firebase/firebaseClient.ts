// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC8fpq9aY3kSLKICqlYOVCX7V7ZPAgB0sM",
  authDomain: "aurix-eeb0c.firebaseapp.com",
  projectId: "aurix-eeb0c",
  storageBucket: "aurix-eeb0c.firebasestorage.app",
  messagingSenderId: "611104660260",
  appId: "1:611104660260:web:fd9aac0f022fb3df09b1b1",
  measurementId: "G-96HF41JZDY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
