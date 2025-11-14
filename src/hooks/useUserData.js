import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const useUserData = (uid) => {
  const [userData, setUserData] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(true);

  useEffect(() => {
    if (!uid) {
      setUserData(null);
      setLoadingUserData(false);
      return;
    }

    const fetchData = async () => {
      try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.warn("Usuário não encontrado no Firestore.");
          setUserData(null);
        }
      } catch (error) {
        console.error("Erro ao buscar userData:", error);
        setUserData(null); // evita crash
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchData();
  }, [uid]);

  return { userData, loadingUserData };
};
