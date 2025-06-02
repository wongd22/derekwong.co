import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, update, remove } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
export const storage = getStorage(app);

const SHOPPING_LIST_REF = 'shopping_list';
const TRADES_REF = 'trades';

export const updateTrade = async (tradeId, updates) => {
  try {
    const tradeRef = ref(database, `${TRADES_REF}/${tradeId}`);
    await update(tradeRef, updates);
  } catch (error) {
    console.error('Error updating trade:', error);
    throw error;
  }
};

export const deleteTrade = async (tradeId, imageUrl) => {
  try {
    // Delete the trade image if it exists
    if (imageUrl) {
      const imageRef = storageRef(storage, imageUrl);
      await deleteObject(imageRef);
    }
    
    // Delete the trade data
    const tradeRef = ref(database, `${TRADES_REF}/${tradeId}`);
    await remove(tradeRef);
  } catch (error) {
    console.error('Error deleting trade:', error);
    throw error;
  }
};

export const uploadTradeImage = async (imageBlob) => {
  try {
    const fileName = `trade_${Date.now()}.png`;
    const imageRef = storageRef(storage, `trade_images/${fileName}`);
    await uploadBytes(imageRef, imageBlob);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading trade image:', error);
    throw error;
  }
};

export const addTrade = async (trade) => {
  try {
    const tradesRef = ref(database, TRADES_REF);
    const newTrade = {
      ...trade,
      createdAt: new Date().toISOString()
    };
    const result = await push(tradesRef, newTrade);
    return result;
  } catch (error) {
    console.error('Error adding trade:', error);
    throw error;
  }
};

export const subscribeToTrades = (callback) => {
  try {
    const tradesRef = ref(database, TRADES_REF);
    return onValue(tradesRef, (snapshot) => {
      const data = snapshot.val();
      const trades = data ? Object.entries(data).map(([id, value]) => ({
        id,
        ...value
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
      callback(trades);
    });
  } catch (error) {
    console.error('Error subscribing to trades:', error);
    throw error;
  }
};

export const uploadImage = async (file, itemId) => {
  try {
    if (!file || !itemId) {
      throw new Error('Missing file or itemId for upload');
    }
    const imageRef = storageRef(storage, `shopping_images/${itemId}/${file.name}`);
    await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    const imageRef = storageRef(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export const addShoppingItem = async (item) => {
  try {
    const shoppingListRef = ref(database, SHOPPING_LIST_REF);
    const newItem = {
      ...item,
      createdAt: new Date().toISOString()
    };
    const result = await push(shoppingListRef, newItem);
    return result;
  } catch (error) {
    console.error('Error adding item:', error);
    throw error;
  }
};

export const updateShoppingItem = async (itemId, updates) => {
  try {
    if (!itemId) {
      throw new Error('No item ID provided for update');
    }
    
    // Make sure we have a valid updates object
    const validUpdates = { ...updates };
    
    // Ensure all values are in the proper format
    if (validUpdates.tags && !Array.isArray(validUpdates.tags)) {
      validUpdates.tags = [];
    }
    
    // Remove any undefined values as they cause issues with Firebase
    Object.keys(validUpdates).forEach(key => {
      if (validUpdates[key] === undefined) {
        delete validUpdates[key];
      }
    });
    
    const itemRef = ref(database, `${SHOPPING_LIST_REF}/${itemId}`);
    await update(itemRef, validUpdates);
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

export const deleteShoppingItem = async (itemId) => {
  try {
    const itemRef = ref(database, `${SHOPPING_LIST_REF}/${itemId}`);
    await remove(itemRef);
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

export const subscribeToShoppingList = (callback) => {
  try {
    const shoppingListRef = ref(database, SHOPPING_LIST_REF);
    return onValue(shoppingListRef, (snapshot) => {
      const data = snapshot.val();
      const items = data ? Object.entries(data).map(([id, value]) => ({
        id,
        ...value
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
      callback(items);
    });
  } catch (error) {
    console.error('Error subscribing to shopping list:', error);
    throw error;
  }
};