// firebase.js - Configuration Firebase pour sauvegarde cloud

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "jeux-de-poisson.firebaseapp.com",
  projectId: "jeux-de-poisson",
  storageBucket: "jeux-de-poisson.firebasestorage.app",
  messagingSenderId: "435409399747",
  appId: "1:435409399747:web:e079389d29910db7489776",
  measurementId: "G-D1TYS43ZR2"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Fonction pour sauvegarder les données
export async function saveToCloud(userId, data) {
  try {
    await setDoc(doc(db, 'users', userId), data);
    console.log('Sauvegarde cloud réussie');
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
  }
}

// Fonction pour charger les données
export async function loadFromCloud(userId) {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log('Aucune donnée trouvée');
      return null;
    }
  } catch (error) {
    console.error('Erreur chargement:', error);
    return null;
  }
}

// Générer un userId unique (ex. basé sur localStorage ou UUID)
export function getUserId() {
  let id = localStorage.getItem('userId');
  if (!id) {
    id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', id);
  }
  return id;
}

// Obtenir ou définir le nom d'utilisateur
export function getUsername() {
  return localStorage.getItem('username') || null;
}

export function setUsername(name) {
  localStorage.setItem('username', name.trim());
}

export async function saveUsernameToCloud(userId, username) {
  try {
    await setDoc(doc(db, 'users', userId), { username: username }, { merge: true });
    console.log('Nom d\'utilisateur sauvegardé');
  } catch (error) {
    console.error('Erreur sauvegarde nom:', error);
  }
}

// Vérifier si un nom d'utilisateur existe déjà
export async function checkUsernameExists(username) {
  try {
    const q = query(
      collection(db, 'users'),
      where('username', '==', username.trim())
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size > 0;
  } catch (error) {
    console.error('Erreur vérification nom:', error);
    return false;
  }
}

// Sauvegarder un score au classement global
export async function submitScore(score, mode = 'normal') {
  try {
    const userId = getUserId();
    const username = getUsername();
    const timestamp = Date.now();
    const scoreDocId = `${userId}_${timestamp}`;
    
    await setDoc(doc(db, 'leaderboard', scoreDocId), {
      userId: userId,
      username: username,
      score: score,
      mode: mode,
      timestamp: timestamp,
      date: new Date().toLocaleString('fr-FR')
    });
    console.log('Score soumis au classement');
  } catch (error) {
    console.error('Erreur lors de la soumission du score:', error);
  }
}

// Charger le classement global (meilleur score par utilisateur par mode)
export async function getLeaderboard(mode = 'normal', topCount = 10) {
  try {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'desc'),
      limit(topCount * 5) // Fetch more to account for filtering
    );
    
    const querySnapshot = await getDocs(q);
    const userBestScores = {}; // { userId: { score, username, date } }
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.mode === mode) {
        const userId = data.userId;
        // Keep only the best score for each user in this mode
        if (!userBestScores[userId] || data.score > userBestScores[userId].score) {
          userBestScores[userId] = {
            username: data.username || 'Anonyme',
            score: data.score,
            date: data.date
          };
        }
      }
    });
    
    // Convert to array and sort by score
    const scores = Object.values(userBestScores)
      .sort((a, b) => b.score - a.score)
      .slice(0, topCount);
    
    return scores;
  } catch (error) {
    console.error('Erreur chargement classement:', error);
    return [];
  }
}
