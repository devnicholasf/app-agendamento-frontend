// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAg9PwAPPPBEhn-VI7NTnIn_hxBRFWmn9I",
  authDomain: "app-agendamento-1947b.firebaseapp.com",
  projectId: "app-agendamento-1947b",
  storageBucket: "app-agendamento-1947b.appspot.com",
  messagingSenderId: "1084725303057",
  appId: "1:1084725303057:web:0541b3b2e17114f1c95eb0",
  measurementId: "G-ZCLB4Y72G8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);



