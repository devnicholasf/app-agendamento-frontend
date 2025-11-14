// src/components/ProfilePictureUpload.js
import React, { useState } from "react";
import { storage } from "../firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

const ProfilePictureUpload = ({ user, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFile = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file || !user) return;
    const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on("state_changed",
      snapshot => {
        const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(prog);
      },
      error => {
        console.error("Erro no upload:", error);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        // atualiza profile do Firebase Auth
        await updateProfile(user, { photoURL: url });
        // atualiza Firestore users/{uid}
        await updateDoc(doc(db, "users", user.uid), { photoURL: url });
        setFile(null);
        setProgress(0);
        if (onUploaded) onUploaded(url);
      }
    );
  };

  return (
    <div className="space-y-2">
      <input type="file" accept="image/*" onChange={handleFile} />
      {file && <div>
        <div className="text-sm">{file.name}</div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div style={{ width: `${progress}%` }} className="h-2 rounded-full bg-purple-600" />
        </div>
        <button onClick={handleUpload} className="mt-2 bg-purple-600 text-white px-4 py-2 rounded">Enviar</button>
      </div>}
    </div>
  );
};

export default ProfilePictureUpload;
