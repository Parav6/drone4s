import { createContext, useContext } from "react";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const FirebaseContext = createContext(null);

const firebaseConfig = {
    apiKey: "AIzaSyBBWG3nQIXH_f7cWxWjyMOURT_Kq4V4wOY",
    authDomain: "drone4s-406d4.firebaseapp.com",
    projectId: "drone4s-406d4",
    storageBucket: "drone4s-406d4.firebasestorage.app",
    messagingSenderId: "283191484161",
    appId: "1:283191484161:web:c104d33345a7e712f94500",
    measurementId: "G-FCGSEWZSJ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = (props) => {
    console.log(props.children);

    return (
        <FirebaseContext.Provider value={{ app }}>
            {props.children}
        </FirebaseContext.Provider>
    );
}