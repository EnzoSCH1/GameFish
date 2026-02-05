// firebase.js - Configuration Firebase pour sauvegarde cloud

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Configuration Firebase (injectée via firebase.config.js)
const firebaseConfig = window.__FIREBASE_CONFIG__;
const firebaseEnabled = !!(firebaseConfig && firebaseConfig.apiKey);

// Initialiser Firebase (optionnel)
let db = null;
let analytics = null;
if (firebaseEnabled) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  analytics = getAnalytics(app);
} else {
  console.warn("Firebase désactivé: config manquante. Crée firebase.config.js depuis firebase.config.sample.js");
}

// Fonction pour sauvegarder les données
export async function saveToCloud(userId, data) {
  try {
    if (!firebaseEnabled || !db) return;
    await setDoc(doc(db, 'users', userId), data);
    console.log('Sauvegarde cloud réussie');
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
  }
}

// Fonction pour charger les données
export async function loadFromCloud(userId) {
  try {
    if (!firebaseEnabled || !db) return null;
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

function normalizeUsername(name) {
  return name.trim().toLowerCase();
}

export async function saveUsernameToCloud(userId, username) {
  try {
    if (!firebaseEnabled || !db) return;
    const usernameLower = normalizeUsername(username);
    await setDoc(
      doc(db, 'users', userId),
      { username: username, usernameLower: usernameLower, usernameError: null },
      { merge: true }
    );
    console.log('Nom d\'utilisateur sauvegardé');
  } catch (error) {
    console.error('Erreur sauvegarde nom:', error);
  }
}

// Réserver un nom d'utilisateur unique (case-insensitive)
export async function reserveUsername(userId, username) {
  try {
    if (!firebaseEnabled || !db) return { ok: true };
    const name = username.trim();
    const key = normalizeUsername(name);
    const ref = doc(db, 'usernames', key);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      if (data.userId && data.userId !== userId) {
        return { ok: false, reason: 'taken' };
      }
    }

    await setDoc(ref, {
      userId: userId,
      username: name,
      usernameLower: key,
      updatedAt: Date.now()
    }, { merge: true });

    return { ok: true };
  } catch (error) {
    console.error('Erreur reservation nom:', error);
    return { ok: false, reason: 'error' };
  }
}

// Vérifier si un nom d'utilisateur existe déjà
export async function checkUsernameExists(username) {
  try {
    if (!firebaseEnabled || !db) return false;
    const key = normalizeUsername(username);
    const snap = await getDoc(doc(db, 'usernames', key));
    if (snap.exists()) return true;

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
    if (!firebaseEnabled || !db) return;
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
    if (!firebaseEnabled || !db) return [];
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