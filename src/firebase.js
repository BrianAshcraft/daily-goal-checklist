import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDNC4hKdp2IKzy9urgVwpBzekMocWXBv-k",
  authDomain: "habit-tracker-a8be1.firebaseapp.com",
  projectId: "habit-tracker-a8be1",
  storageBucket: "habit-tracker-a8be1.firebasestorage.app",
  messagingSenderId: "935030193491",
  appId: "1:935030193491:web:16db1c587937179611b5a6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
