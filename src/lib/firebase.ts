
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBTXb5ggktkl_eSkXKHlAmkRPbjj1YKCO4",
  authDomain: "acm-inta.firebaseapp.com",
  projectId: "acm-inta",
  storageBucket: "acm-inta.appspot.com", // Corrected the storage bucket URL
  messagingSenderId: "254262352833",
  appId: "1:254262352833:web:c6c64a9865a4195477ad40"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app)
export default app;
