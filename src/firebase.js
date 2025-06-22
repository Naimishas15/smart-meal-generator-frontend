// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC6lUIW9tYcMWfmSxYn7wLrnGXNDx44N18",
  authDomain: "smartmealgenerator.firebaseapp.com",
  projectId: "smartmealgenerator",
  storageBucket: "smartmealgenerator.firebasestorage.app",
  messagingSenderId: "918948465109",
  appId: "1:918948465109:web:ddd0bb19869d653176955c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };
