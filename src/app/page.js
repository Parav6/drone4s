"use client"

import { FirebaseProvider, useFirebase } from "@/context/Firebase";

export default function Home() {
  const firebase = useFirebase();
  console.log(firebase);
  return (
    <>
      <FirebaseProvider>
        <h1>home</h1>
      </FirebaseProvider>
    </>
  );
}
