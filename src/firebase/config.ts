import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { 
  getFirestore, 
  setLogLevel,
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MenuItem, Order, OrderStatus } from '../types';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Suppress transient backend reachability notices from polluting the console
try {
  setLogLevel('silent');
} catch {
  // Ignore if not supported in environment
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  const msg = errInfo.error.toLowerCase();
  if (!msg.includes('unavailable') && !msg.includes('offline') && !msg.includes('could not reach')) {
    console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  }
}

export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export const MENU_COLLECTION = 'menu_items';
export const CUSTOM_IMAGES_COLLECTION = 'custom_images';
export const POSTERS_COLLECTION = 'posters';
export const ORDERS_COLLECTION = 'orders';

// Helper to seed initial menu items into Firestore if empty without overwriting user customizations
export async function initializeMenuInFirestore(defaultMenuItems: MenuItem[]) {
  try {
    const menuRef = collection(db, MENU_COLLECTION);
    const snapshot = await getDocs(menuRef).catch(() => null);
    
    if (!snapshot || snapshot.empty) {
      // Seed if empty and online
      if (snapshot && snapshot.empty) {
        for (const item of defaultMenuItems) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await setDoc(itemDocRef, {
            ...item,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        }
      }
    } else {
      // Sync only missing items to Firestore without overwriting existing custom images/details
      const existingDocsMap = new Map<string, any>();
      snapshot.forEach((docSnap) => {
        existingDocsMap.set(docSnap.id, docSnap.data());
      });

      for (const item of defaultMenuItems) {
        const existing = existingDocsMap.get(item.id);
        if (!existing) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await setDoc(itemDocRef, {
            ...item,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'kajoo-kattli' && existing.image !== item.image && (!existing.image || existing.image.includes('kaju_katli_poster') || existing.image.includes('muffinns_kaju_katli'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'brown-bread' && existing.image !== item.image && (!existing.image || existing.image.includes('irish_brown_bread') || existing.image.includes('muffinns_brown_bread'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'mix-dry-cake' || item.id === 'dry-almond-cake') && existing.image !== item.image && (!existing.image || existing.image.includes('muffinns_almond_walnut_pistachio_cake'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'oreo-special-cake' && existing.image !== item.image && (!existing.image || existing.image.includes('oreo_cake_top') || existing.image.includes('oreo_special_cake') || existing.image.includes('muffinns_oreo_cake'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'customized-cake-cream' || item.id === 'customized-cake-fondant') && existing.image !== item.image && (!existing.image || existing.image.includes('customized_heart_cake') || existing.image.includes('customized_wedding_cake') || existing.image.includes('muffinns_customized'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'brownie-fudge' || item.id === 'brownie-walnut' || item.id === 'brownie-kitkat') && existing.image !== item.image && (!existing.image || existing.image.includes('chocolate_brownie_poster') || existing.image.includes('muffinns_fudge_brownies') || existing.image.includes('unsplash'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'red-velvet-cake' && existing.image !== item.image && (!existing.image || existing.image.includes('red_velvet_poster') || existing.image.includes('red_velvet_cake') || existing.image.includes('muffinns_red_velvet_cake') || existing.image.includes('red_velvet_real'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'pistachio-kunafa-cake' && existing.image !== item.image && (!existing.image || existing.image.includes('pistachio_kunafa_poster') || existing.image.includes('muffinns_pistachio_kunafa'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'arabic-special-sweets-platter' || item.id === 'special-sweets') && existing.image !== item.image && (!existing.image || existing.image.includes('muffinns_baklava') || existing.image.includes('baklava'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'akhroti-sohan-halwa' || item.id === 'poster-akhroti-halwa') && existing.image !== item.image && (!existing.image || existing.image.includes('akhroti_sohan_halwa_poster') || existing.image.includes('akhroti_halwa') || existing.image.includes('muffinns_akhroti') || existing.image.includes('xS20qR9B'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'mango-pistachio-special' || item.id === 'mango-pistachio-cake') && existing.image !== item.image && (!existing.image || existing.image.includes('mango_pistachio_poster') || existing.image.includes('muffinns_mango_pistachio'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'cookie-cream-cake' && existing.image !== item.image && (!existing.image || existing.image.includes('cookie_cream_poster') || existing.image.includes('muffinns_cookie_cream'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'three-milk-cake' || item.id === 'three-milk-cup') && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'puffs-baqir-khani-box' || item.id === 'poster-baqir-khani') && existing.image !== item.image && (!existing.image || existing.image.includes('baqir_khani') || existing.image.includes('puffs_baqir_khani'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'honey-cake' || item.id === 'honey-dry-cake' || item.id === 'poster-honey-cake') && existing.image !== item.image && (!existing.image || existing.image.includes('muffinns_honey_cake') || existing.image.includes('honey_cake'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'special-biscuit' || item.id === 'poster-biscuits-cookies' || item.id === 'poster-biscuits-tier') && existing.image !== item.image && (!existing.image || existing.image.includes('cookies_poster') || existing.image.includes('biscuits_cookies') || existing.image.includes('cookies_stack'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'brown-burfi' || item.id === 'brown-barfi' || item.id === 'poster-barfi-brown') && existing.image !== item.image && (!existing.image || existing.image.includes('barfi_brown') || existing.image.includes('brown_burfi') || existing.image.includes('unsplash'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'chocolate-burfi' || item.id === 'qalakand' || item.id === 'pista-kajoo-burfi' || item.id === 'habshi-jamun' || item.id === 'lamba-jamun' || item.id === 'rasgullah' || item.id === 'balushahi' || item.id === 'mesu' || item.id === 'muffin-kitkat' || item.id === 'muffin-honey' || item.id === 'muffin-red-velvet' || item.id === 'kulfi' || item.id === 'ras-malai' || item.id === 'muffin-nutella' || item.id === 'honey-slice') && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'panjeeri' || item.id === 'poster-panjeri') && existing.image !== item.image && (!existing.image || existing.image.includes('panjeri') || existing.image.includes('panjeeri'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'coco-nello-cake' || item.id === 'poster-coco-nello') && existing.image !== item.image && (!existing.image || existing.image.includes('coco_nello') || existing.image.includes('coconello'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'lotus-three-milk-cake' && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'lotus-cake' || item.id === 'poster-lotus-biscoff-cake' || item.id === 'lotus-cup') && existing.image !== item.image && (!existing.image || existing.image.includes('lotus') || existing.image.includes('muffinns_lotus'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'malt-cake' || item.id === 'poster-malt-cake' || item.id === 'malteser-cake') && existing.image !== item.image && (!existing.image || existing.image.includes('malt'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'pina-colada-cake' && existing.image !== item.image && (!existing.image || existing.image.includes('pina_colada') || existing.image.includes('pina-colada'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'mango-cheese-special' && existing.image !== item.image && (!existing.image || existing.image.includes('mango_cheese') || existing.image.includes('mango-cheese'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'mango-tart-special' && existing.image !== item.image && (!existing.image || existing.image.includes('mango_tart') || existing.image.includes('mango-tart'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'multi-grain-bread' && existing.image !== item.image && (!existing.image || existing.image.includes('multi_grain') || existing.image.includes('multigrain') || existing.image.includes('multi-grain'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'mix-sweets' && existing.image !== item.image && (!existing.image || existing.image.includes('muffinns_mithai_gift_box') || existing.image.includes('mithai_gift_box'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'lotus-slice' && existing.image !== item.image && (!existing.image || existing.image.includes('lotus_slice') || existing.image.includes('lotus-slice'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'moti-chour-laddu-gold' && existing.image !== item.image && (!existing.image || existing.image.includes('moti_chour') || existing.image.includes('moti-chour') || existing.image.includes('motichoor'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'gajjar-halwa' && existing.image !== item.image && (!existing.image || existing.image.includes('gajar_halwa') || existing.image.includes('gajjar') || existing.image.includes('gajar'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'sada-sohan-halwa' || item.id === 'poster-sohan-halwa') && existing.image !== item.image && (!existing.image || existing.image.includes('sohan_halwa') || existing.image.includes('badami_sohan') || existing.image.includes('sohan'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'croissant-butter' && existing.image !== item.image && (!existing.image || existing.image.includes('unsplash') || existing.image.includes('croissant'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'pure-milk' || item.id === 'poster-pure-milk') && existing.image !== item.image && (!existing.image || existing.image.includes('muffinns_pure_flavored_milk') || existing.image.includes('pure_milk') || existing.image.includes('pure-milk'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'chocolate-tart' || item.id === 'poster-chocolate-tart') && existing.image !== item.image && (!existing.image || existing.image.includes('muffinns_chocolate_tart') || existing.image.includes('chocolate_tart') || existing.image.includes('chocolate-tart'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'laddu-box' || item.id === 'milky-coconut-laddu' || item.id === 'milky-laddu') && existing.image !== item.image && (!existing.image || existing.image.includes('variety_laddus') || existing.image.includes('muffinns_milky_laddu') || existing.image.includes('milky_laddu') || existing.image.includes('milky-laddu'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'red-velvet-slice' || item.id === 'red-velvet-cake-slice') && existing.image !== item.image && (!existing.image || existing.image.includes('muffinns_red_velvet_slice') || existing.image.includes('red_velvet_slice') || existing.image.includes('red-velvet-slice'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'creamy-gulab-jamun' || item.id === 'poster-gulab-jamun' || item.id === 'gulab-jamun') && existing.image !== item.image && (!existing.image || existing.image.includes('gulab_jamun') || existing.image.includes('gulab-jamun'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'french-heart' || item.id === 'french-heart-biscuits') && existing.image !== item.image && (!existing.image || existing.image.includes('muffinns_french_heart') || existing.image.includes('french_heart') || existing.image.includes('french-heart'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'sundae-cups-trio' || item.id === 'poster-sundae-cups' || item.id === 'caramel-crunch-sundae') && existing.image !== item.image && (!existing.image || existing.image.includes('muffinns_sundae_cups') || existing.image.includes('sundae_cups') || existing.image.includes('sundae-cups'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'bento-cake' || item.id === 'poster-bento-cakes-collection' || item.id === 'bento-cream-cake') && existing.image !== item.image && (!existing.image || existing.image.includes('muffinns_bento') || existing.image.includes('bento_cake') || existing.image.includes('bento-cake'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'bakery-bliss-cupcakes-muffins' || item.id === 'poster-bakery-bliss' || item.id === 'muffins-cupcakes-3tier-stand' || item.id === 'muffin-choco-chip') && existing.image !== item.image && (!existing.image || existing.image.includes('muffinns_signature_muffins') || existing.image.includes('signature_muffins') || existing.image.includes('muffins_cupcakes_real'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'cookies-naan-khatai' || item.id === 'poster-almond-khatai' || item.id === 'almond-khatai') && existing.image !== item.image && (!existing.image || existing.image.includes('muffinns_almond_khatai') || existing.image.includes('almond_khatai') || existing.image.includes('khatai'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'daal-halwa' || item.id === 'poster-daal-halwa') && existing.image !== item.image && (!existing.image || existing.image.includes('daal_halwa') || existing.image.includes('dal_halwa'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'cake-rusk' || item.id === 'poster-cake-rusk') && existing.image !== item.image && (!existing.image || existing.image.includes('cake_rusk') || existing.image.includes('almond_rusk') || existing.image.includes('rusk'))) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'special-rus' || item.id === 'special-rusk' || item.id === 'almond-special-rusk') && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            name: item.name,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'muffins-cupcakes-3tier-stand' || item.id === 'poster-muffins-cupcakes-tier' || item.id === 'bakery-bliss-cupcakes-muffins') && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'mothers-day-bento' || item.id === 'poster-mothers-day-bento') && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'badami-sohan-halwa' || item.id === 'poster-badami-sohan-halwa') && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'special-donut' || item.id === 'poster-assorted-donuts' || item.id === 'cake-donut' || item.id === 'filled-donut') && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'brownie-fudge' || item.id === 'brownie-walnut' || item.id === 'brownie-kitkat' || item.id === 'poster-chocolate-brownie') && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'fruit-cake' || item.id === 'poster-fruit-cake') && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'laddu-box' || item.id === 'poster-variety-laddus') && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'slice-rus' || item.id === 'slice-rusk') && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if ((item.id === 'burger-rus' || item.id === 'burger-rusk') && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        } else if (item.id === 'lemon-tart' && existing.image !== item.image) {
          const itemDocRef = doc(db, MENU_COLLECTION, item.id);
          await updateDoc(itemDocRef, {
            image: item.image,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, MENU_COLLECTION);
  }
}

// Subscribe to real-time menu items updates
export function subscribeToMenu(callback: (items: MenuItem[]) => void) {
  try {
    const menuRef = collection(db, MENU_COLLECTION);
    return onSnapshot(menuRef, (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({ id: docSnap.id, ...data } as MenuItem);
      });
      if (items.length > 0) {
        callback(items);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, MENU_COLLECTION);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, MENU_COLLECTION);
    return () => {};
  }
}

// Subscribe to real-time custom image mappings in Firestore
export function subscribeToCustomImages(callback: (imageMap: Record<string, string>) => void) {
  try {
    const imagesRef = collection(db, CUSTOM_IMAGES_COLLECTION);
    return onSnapshot(imagesRef, (snapshot) => {
      const map: Record<string, string> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.image) {
          map[docSnap.id] = data.image;
        }
      });
      callback(map);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, CUSTOM_IMAGES_COLLECTION);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, CUSTOM_IMAGES_COLLECTION);
    return () => {};
  }
}

// Save or Update a Menu Item in Firestore (Permanently stored in cloud!)
export async function saveMenuItemToFirestore(item: MenuItem) {
  try {
    // 1. Save in menu_items collection
    const itemDocRef = doc(db, MENU_COLLECTION, item.id);
    await setDoc(itemDocRef, {
      ...item,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // 2. Also persist image in dedicated custom_images collection for multi-layer redundancy
    if (item.image) {
      const imageDocRef = doc(db, CUSTOM_IMAGES_COLLECTION, item.id);
      await setDoc(imageDocRef, {
        id: item.id,
        image: item.image,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${MENU_COLLECTION}/${item.id}`);
  }
}

// Delete a Menu Item from Firestore permanently
export async function deleteMenuItemFromFirestore(itemId: string) {
  try {
    const itemDocRef = doc(db, MENU_COLLECTION, itemId);
    await deleteDoc(itemDocRef);

    const imageDocRef = doc(db, CUSTOM_IMAGES_COLLECTION, itemId);
    await deleteDoc(imageDocRef).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${MENU_COLLECTION}/${itemId}`);
  }
}

// Save or Update image for a specific item in Firestore
export async function updateMenuItemImageInFirestore(itemId: string, newImageUrl: string) {
  try {
    // 1. Update in menu_items
    const itemDocRef = doc(db, MENU_COLLECTION, itemId);
    await setDoc(itemDocRef, {
      image: newImageUrl,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // 2. Update in custom_images
    const imageDocRef = doc(db, CUSTOM_IMAGES_COLLECTION, itemId);
    await setDoc(imageDocRef, {
      id: itemId,
      image: newImageUrl,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${MENU_COLLECTION}/${itemId}`);
  }
}

// Helper to handle image uploads / file-to-data-URL conversion
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// ORDERS FIRESTORE REAL-TIME SYNC HELPERS
// Ensures both customer website & admin panel use the exact same Firestore collection 'orders'
// ============================================================================

export async function saveOrderToFirestore(order: Order): Promise<void> {
  const orderId = String(order.id || order.order_id || `ORD-${Date.now()}`);
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);

    // Deep clean items to ensure no undefined or invalid values
    const cleanItems = (order.items || []).map((it: any) => ({
      itemId: String(it.itemId || it.id || ''),
      name: String(it.name || it.itemTitle || 'Bakery Item'),
      quantity: Number(it.quantity || it.qty || 1),
      price: Number(it.price || 0),
      size: String(it.size || ''),
      notes: String(it.notes || ''),
      total: Number(it.total || (Number(it.price || 0) * Number(it.quantity || it.qty || 1)))
    }));

    const cleanOrderData: Record<string, any> = {
      id: orderId,
      order_id: orderId,
      customerName: String(order.customerName || order.customer_name || 'Guest Customer'),
      customer_name: String(order.customerName || order.customer_name || 'Guest Customer'),
      customerPhone: String(order.customerPhone || order.phone || ''),
      phone: String(order.customerPhone || order.phone || ''),
      customerAddress: String(order.customerAddress || order.address || ''),
      address: String(order.customerAddress || order.address || ''),
      city: String(order.city || 'Bahawalpur'),
      items: cleanItems,
      totalAmount: Number(order.totalAmount || order.total_price || 0),
      total_price: Number(order.totalAmount || order.total_price || 0),
      status: String(order.status || 'New'),
      paymentMethod: String(order.paymentMethod || 'Cash on Delivery'),
      paymentReference: String(order.paymentReference || ''),
      createdAt: order.createdAt || new Date().toISOString(),
      created_at: order.created_at || new Date().toLocaleString(),
      timestamp: serverTimestamp()
    };

    await setDoc(orderDocRef, cleanOrderData, { merge: true });
    console.log(`[Firestore] Order #${orderId} saved successfully to Firestore collection 'orders'.`);
  } catch (err: any) {
    console.error('[Firestore] Error saving order to Firestore:', err);
    // Fallback attempt without serverTimestamp if serverTimestamp was rejected
    try {
      const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
      const fallbackData = {
        id: orderId,
        order_id: orderId,
        customerName: String(order.customerName || order.customer_name || 'Guest Customer'),
        customerPhone: String(order.customerPhone || order.phone || ''),
        customerAddress: String(order.customerAddress || order.address || ''),
        city: String(order.city || 'Bahawalpur'),
        items: (order.items || []).map((it: any) => ({
          name: String(it.name || it.itemTitle || 'Item'),
          quantity: Number(it.quantity || it.qty || 1),
          price: Number(it.price || 0)
        })),
        totalAmount: Number(order.totalAmount || order.total_price || 0),
        status: String(order.status || 'New'),
        paymentMethod: String(order.paymentMethod || 'Cash on Delivery'),
        createdAt: new Date().toISOString()
      };
      await setDoc(orderDocRef, fallbackData, { merge: true });
      console.log(`[Firestore] Order #${orderId} saved via fallback without serverTimestamp.`);
      return;
    } catch (fallbackErr) {
      handleFirestoreError(fallbackErr, OperationType.WRITE, `${ORDERS_COLLECTION}/${orderId}`);
      throw fallbackErr;
    }
  }
}

export function subscribeToOrders(
  onOrdersReceived: (orders: Order[]) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const ordersColRef = collection(db, ORDERS_COLLECTION);
    
    // We listen to the whole collection and sort client-side by newest first
    return onSnapshot(ordersColRef, (snapshot) => {
      const ordersList: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        ordersList.push({
          id: docSnap.id,
          order_id: data.order_id || docSnap.id,
          customerName: data.customerName || data.customer_name || '',
          customer_name: data.customer_name || data.customerName || '',
          customerPhone: data.customerPhone || data.phone || '',
          phone: data.phone || data.customerPhone || '',
          customerAddress: data.customerAddress || data.address || '',
          address: data.address || data.customerAddress || '',
          city: data.city || 'Bahawalpur',
          items: data.items || [],
          totalAmount: Number(data.totalAmount || data.total_price || 0),
          total_price: Number(data.total_price || data.totalAmount || 0),
          status: (data.status as OrderStatus) || 'New',
          paymentMethod: data.paymentMethod || 'Cash on Delivery',
          paymentReference: data.paymentReference || '',
          paymentProofUrl: data.paymentProofUrl || '',
          createdAt: data.createdAt || (data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()),
          created_at: data.created_at || ''
        });
      });

      // Sort newest first by createdAt timestamp
      ordersList.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      onOrdersReceived(ordersList);
    }, (err) => {
      console.warn('[Firestore] Real-time orders subscription notice:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, ORDERS_COLLECTION);
    });
  } catch (err) {
    console.error('[Firestore] subscribeToOrders failed to attach:', err);
    if (onError) onError(err);
    return () => {};
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: OrderStatus): Promise<void> {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderDocRef, {
      status,
      updatedAt: serverTimestamp()
    });
    console.log(`[Firestore] Order #${orderId} status updated to '${status}'.`);
  } catch (err: any) {
    console.error(`[Firestore] Failed to update status for order #${orderId}:`, err);
    handleFirestoreError(err, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
    throw err;
  }
}

