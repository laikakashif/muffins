import { MenuItem } from '../types';
import { MENU_ITEMS } from '../data/menu';
import { 
  initializeMenuInFirestore, 
  subscribeToMenu, 
  subscribeToCustomImages,
  saveMenuItemToFirestore, 
  deleteMenuItemFromFirestore,
  updateMenuItemImageInFirestore
} from '../firebase/config';

const STORAGE_KEY = 'muffinns_custom_menu_images';
const CUSTOM_ITEMS_KEY = 'muffinns_custom_added_items';
const DELETED_ITEMS_KEY = 'muffinns_deleted_item_ids';

let firestoreItemsCache: MenuItem[] | null = null;
let firestoreImagesMapCache: Record<string, string> = {};
let isFirestoreInitialized = false;

// Initialize Firestore sync on startup
export function initFirestoreMenuSync(onMenuUpdate?: (items: MenuItem[]) => void) {
  if (isFirestoreInitialized) return;
  isFirestoreInitialized = true;

  // Seed default menu items if Firestore is empty without overriding user edits
  initializeMenuInFirestore(MENU_ITEMS);

  // Ensure stale local cache for kajoo-kattli & brown-bread is refreshed with the new photos
  try {
    const currentLocal = getCustomImageMap();
    let changed = false;
    if (currentLocal['kajoo-kattli'] && (currentLocal['kajoo-kattli'].includes('kaju_katli_poster') || currentLocal['kajoo-kattli'].includes('muffinns_kaju_katli'))) {
      currentLocal['kajoo-kattli'] = 'https://i.ibb.co/spTXGPJD/IMG-7593.jpg';
      changed = true;
    }
    if (currentLocal['brown-bread'] && (currentLocal['brown-bread'].includes('irish_brown_bread') || currentLocal['brown-bread'].includes('muffinns_brown_bread'))) {
      currentLocal['brown-bread'] = 'https://i.ibb.co/TDR0rg2p/IMG-7595.jpg';
      changed = true;
    }
    if (currentLocal['mix-dry-cake'] && (currentLocal['mix-dry-cake'].includes('muffinns_almond_walnut_pistachio_cake') || currentLocal['mix-dry-cake'].includes('unsplash'))) {
      currentLocal['mix-dry-cake'] = 'https://i.ibb.co/tMmbLKPw/IMG-7598.jpg';
      changed = true;
    }
    if (currentLocal['dry-almond-cake'] && (currentLocal['dry-almond-cake'].includes('muffinns_almond_walnut_pistachio_cake') || currentLocal['dry-almond-cake'].includes('unsplash'))) {
      currentLocal['dry-almond-cake'] = 'https://i.ibb.co/tMmbLKPw/IMG-7598.jpg';
      changed = true;
    }
    if (currentLocal['oreo-special-cake'] && (currentLocal['oreo-special-cake'].includes('oreo_cake_top') || currentLocal['oreo-special-cake'].includes('oreo_special_cake') || currentLocal['oreo-special-cake'].includes('muffinns_oreo_cake'))) {
      currentLocal['oreo-special-cake'] = 'https://i.ibb.co/YTPkB88V/Whats-App-Image-2026-07-22-at-15-01-45.jpg';
      changed = true;
    }
    if (currentLocal['customized-cake-cream'] && (currentLocal['customized-cake-cream'].includes('customized_heart_cake') || currentLocal['customized-cake-cream'].includes('customized_wedding_cake') || currentLocal['customized-cake-cream'].includes('muffinns_customized'))) {
      currentLocal['customized-cake-cream'] = 'https://i.ibb.co/Wvhk67VM/IMG-7609.jpg';
      changed = true;
    }
    if (currentLocal['customized-cake-fondant'] && (currentLocal['customized-cake-fondant'].includes('customized_heart_cake') || currentLocal['customized-cake-fondant'].includes('customized_wedding_cake') || currentLocal['customized-cake-fondant'].includes('muffinns_customized'))) {
      currentLocal['customized-cake-fondant'] = 'https://i.ibb.co/Wvhk67VM/IMG-7609.jpg';
      changed = true;
    }
    if (currentLocal['brownie-fudge'] && (currentLocal['brownie-fudge'].includes('chocolate_brownie_poster') || currentLocal['brownie-fudge'].includes('muffinns_fudge_brownies') || currentLocal['brownie-fudge'].includes('unsplash'))) {
      currentLocal['brownie-fudge'] = 'https://i.ibb.co/xS9rpJFJ/IMG-7599.jpg';
      changed = true;
    }
    if (currentLocal['brownie-walnut'] && currentLocal['brownie-walnut'].includes('unsplash')) {
      currentLocal['brownie-walnut'] = 'https://i.ibb.co/xS9rpJFJ/IMG-7599.jpg';
      changed = true;
    }
    if (currentLocal['brownie-kitkat'] && currentLocal['brownie-kitkat'].includes('unsplash')) {
      currentLocal['brownie-kitkat'] = 'https://i.ibb.co/xS9rpJFJ/IMG-7599.jpg';
      changed = true;
    }
    if (currentLocal['red-velvet-cake'] && (currentLocal['red-velvet-cake'].includes('red_velvet_poster') || currentLocal['red-velvet-cake'].includes('red_velvet_cake') || currentLocal['red-velvet-cake'].includes('muffinns_red_velvet') || currentLocal['red-velvet-cake'].includes('red_velvet_real'))) {
      currentLocal['red-velvet-cake'] = 'https://cdn.phototourl.com/free/2026-08-29-a18650e9-cebb-4b34-856a-519994f67778.jpg';
      changed = true;
    }
    if (currentLocal['pistachio-kunafa-cake'] && (currentLocal['pistachio-kunafa-cake'].includes('pistachio_kunafa_poster') || currentLocal['pistachio-kunafa-cake'].includes('muffinns_pistachio_kunafa'))) {
      currentLocal['pistachio-kunafa-cake'] = 'https://i.ibb.co/hRfq00Pt/Whats-App-Image-2026-07-21-at-20-25-20.jpg';
      changed = true;
    }
    if (currentLocal['arabic-special-sweets-platter'] && (currentLocal['arabic-special-sweets-platter'].includes('muffinns_baklava') || currentLocal['arabic-special-sweets-platter'].includes('baklava'))) {
      currentLocal['arabic-special-sweets-platter'] = 'https://i.ibb.co/hxgSjCt3/Whats-App-Image-2026-07-21-at-20-24-58.jpg';
      changed = true;
    }
    if (currentLocal['special-sweets'] && (currentLocal['special-sweets'].includes('muffinns_baklava') || currentLocal['special-sweets'].includes('baklava'))) {
      currentLocal['special-sweets'] = 'https://i.ibb.co/hxgSjCt3/Whats-App-Image-2026-07-21-at-20-24-58.jpg';
      changed = true;
    }
    if (currentLocal['akhroti-sohan-halwa'] && (currentLocal['akhroti-sohan-halwa'].includes('akhroti_sohan_halwa_poster') || currentLocal['akhroti-sohan-halwa'].includes('akhroti_halwa') || currentLocal['akhroti-sohan-halwa'].includes('muffinns_akhroti') || currentLocal['akhroti-sohan-halwa'].includes('xS20qR9B'))) {
      currentLocal['akhroti-sohan-halwa'] = 'https://i.ibb.co/XcVkDms/Whats-App-Image-2026-08-30-at-7-47-56-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-akhroti-halwa'] && (currentLocal['poster-akhroti-halwa'].includes('akhroti') || currentLocal['poster-akhroti-halwa'].includes('xS20qR9B'))) {
      currentLocal['poster-akhroti-halwa'] = 'https://i.ibb.co/XcVkDms/Whats-App-Image-2026-08-30-at-7-47-56-PM.jpg';
      changed = true;
    }
    if (currentLocal['mango-pistachio-special'] && (currentLocal['mango-pistachio-special'].includes('mango_pistachio_poster') || currentLocal['mango-pistachio-special'].includes('muffinns_mango_pistachio'))) {
      currentLocal['mango-pistachio-special'] = 'https://i.ibb.co/RkTtsmby/Whats-App-Image-2026-07-21-at-20-24-03.jpg';
      changed = true;
    }
    if (currentLocal['mango-pistachio-cake'] && (currentLocal['mango-pistachio-cake'].includes('mango_pistachio_poster') || currentLocal['mango-pistachio-cake'].includes('muffinns_mango_pistachio'))) {
      currentLocal['mango-pistachio-cake'] = 'https://i.ibb.co/RkTtsmby/Whats-App-Image-2026-07-21-at-20-24-03.jpg';
      changed = true;
    }
    if (currentLocal['cookie-cream-cake'] && (currentLocal['cookie-cream-cake'].includes('cookie_cream_poster') || currentLocal['cookie-cream-cake'].includes('muffinns_cookie_cream'))) {
      currentLocal['cookie-cream-cake'] = 'https://i.ibb.co/F4JSFFXW/Whats-App-Image-2026-07-21-at-20-25-19.jpg';
      changed = true;
    }
    if (currentLocal['three-milk-cake']) {
      currentLocal['three-milk-cake'] = 'https://i.ibb.co/jk7rk9Hk/three-milk-cake.webp';
      changed = true;
    }
    if (currentLocal['three-milk-cup']) {
      currentLocal['three-milk-cup'] = 'https://i.ibb.co/jk7rk9Hk/three-milk-cake.webp';
      changed = true;
    }
    if (currentLocal['puffs-baqir-khani-box'] && (currentLocal['puffs-baqir-khani-box'].includes('baqir_khani') || currentLocal['puffs-baqir-khani-box'].includes('puffs_baqir_khani'))) {
      currentLocal['puffs-baqir-khani-box'] = 'https://i.ibb.co/1GSsGjSf/Whats-App-Image-2026-08-30-at-7-47-51-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-baqir-khani'] && (currentLocal['poster-baqir-khani'].includes('baqir_khani') || currentLocal['poster-baqir-khani'].includes('puffs_baqir_khani'))) {
      currentLocal['poster-baqir-khani'] = 'https://i.ibb.co/1GSsGjSf/Whats-App-Image-2026-08-30-at-7-47-51-PM.jpg';
      changed = true;
    }
    if (currentLocal['honey-cake'] && (currentLocal['honey-cake'].includes('muffinns_honey_cake') || currentLocal['honey-cake'].includes('honey_cake'))) {
      currentLocal['honey-cake'] = 'https://i.ibb.co/DHYzrB7p/Whats-App-Image-2026-08-30-at-7-47-52-PM.jpg';
      changed = true;
    }
    if (currentLocal['honey-dry-cake'] && (currentLocal['honey-dry-cake'].includes('muffinns_honey_cake') || currentLocal['honey-dry-cake'].includes('honey_cake'))) {
      currentLocal['honey-dry-cake'] = 'https://i.ibb.co/DHYzrB7p/Whats-App-Image-2026-08-30-at-7-47-52-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-honey-cake'] && (currentLocal['poster-honey-cake'].includes('muffinns_honey_cake') || currentLocal['poster-honey-cake'].includes('honey_cake'))) {
      currentLocal['poster-honey-cake'] = 'https://i.ibb.co/DHYzrB7p/Whats-App-Image-2026-08-30-at-7-47-52-PM.jpg';
      changed = true;
    }
    if (currentLocal['special-biscuit'] && (currentLocal['special-biscuit'].includes('cookies_poster') || currentLocal['special-biscuit'].includes('biscuits_cookies') || currentLocal['special-biscuit'].includes('cookies_stack'))) {
      currentLocal['special-biscuit'] = 'https://i.ibb.co/mVPxn44G/Whats-App-Image-2026-08-30-at-7-47-53-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-biscuits-cookies'] && (currentLocal['poster-biscuits-cookies'].includes('cookies_poster') || currentLocal['poster-biscuits-cookies'].includes('biscuits_cookies'))) {
      currentLocal['poster-biscuits-cookies'] = 'https://i.ibb.co/mVPxn44G/Whats-App-Image-2026-08-30-at-7-47-53-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-biscuits-tier'] && (currentLocal['poster-biscuits-tier'].includes('cookies_poster') || currentLocal['poster-biscuits-tier'].includes('biscuits_cookies'))) {
      currentLocal['poster-biscuits-tier'] = 'https://i.ibb.co/mVPxn44G/Whats-App-Image-2026-08-30-at-7-47-53-PM.jpg';
      changed = true;
    }
    if (currentLocal['brown-burfi'] && (currentLocal['brown-burfi'].includes('barfi_brown') || currentLocal['brown-burfi'].includes('brown_burfi') || currentLocal['brown-burfi'].includes('unsplash'))) {
      currentLocal['brown-burfi'] = 'https://i.ibb.co/QvqZT4P9/Whats-App-Image-2026-08-30-at-7-47-55-PM.jpg';
      changed = true;
    }
    if (currentLocal['brown-barfi'] && (currentLocal['brown-barfi'].includes('barfi_brown') || currentLocal['brown-barfi'].includes('brown_burfi'))) {
      currentLocal['brown-barfi'] = 'https://i.ibb.co/QvqZT4P9/Whats-App-Image-2026-08-30-at-7-47-55-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-barfi-brown'] && (currentLocal['poster-barfi-brown'].includes('barfi_brown') || currentLocal['poster-barfi-brown'].includes('brown_burfi'))) {
      currentLocal['poster-barfi-brown'] = 'https://i.ibb.co/QvqZT4P9/Whats-App-Image-2026-08-30-at-7-47-55-PM.jpg';
      changed = true;
    }
    if (currentLocal['panjeeri'] && (currentLocal['panjeeri'].includes('panjeri') || currentLocal['panjeeri'].includes('panjeeri'))) {
      currentLocal['panjeeri'] = 'https://i.ibb.co/zWVgJjfM/Whats-App-Image-2026-08-30-at-7-47-56-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-panjeri'] && (currentLocal['poster-panjeri'].includes('panjeri') || currentLocal['poster-panjeri'].includes('panjeeri'))) {
      currentLocal['poster-panjeri'] = 'https://i.ibb.co/zWVgJjfM/Whats-App-Image-2026-08-30-at-7-47-56-PM.jpg';
      changed = true;
    }
    if (currentLocal['coco-nello-cake'] && (currentLocal['coco-nello-cake'].includes('coco_nello') || currentLocal['coco-nello-cake'].includes('coconello'))) {
      currentLocal['coco-nello-cake'] = 'https://i.ibb.co/7JTqyKyP/Whats-App-Image-2026-08-30-at-7-47-56-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-coco-nello'] && (currentLocal['poster-coco-nello'].includes('coco_nello') || currentLocal['poster-coco-nello'].includes('coconello'))) {
      currentLocal['poster-coco-nello'] = 'https://i.ibb.co/7JTqyKyP/Whats-App-Image-2026-08-30-at-7-47-56-PM.jpg';
      changed = true;
    }
    if (currentLocal['lotus-cake'] && (currentLocal['lotus-cake'].includes('lotus') || currentLocal['lotus-cake'].includes('muffinns_lotus'))) {
      currentLocal['lotus-cake'] = 'https://i.ibb.co/Vc4q0Cdw/Whats-App-Image-2026-08-30-at-7-47-57-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-lotus-biscoff-cake'] && (currentLocal['poster-lotus-biscoff-cake'].includes('lotus') || currentLocal['poster-lotus-biscoff-cake'].includes('muffinns_lotus'))) {
      currentLocal['poster-lotus-biscoff-cake'] = 'https://i.ibb.co/Vc4q0Cdw/Whats-App-Image-2026-08-30-at-7-47-57-PM.jpg';
      changed = true;
    }
    if (currentLocal['lotus-three-milk-cake']) {
      currentLocal['lotus-three-milk-cake'] = 'https://i.ibb.co/7tfzd9vQ/download.jpg';
      changed = true;
    }
    if (currentLocal['lotus-cup'] && (currentLocal['lotus-cup'].includes('lotus') || currentLocal['lotus-cup'].includes('muffinns_lotus'))) {
      currentLocal['lotus-cup'] = 'https://i.ibb.co/Vc4q0Cdw/Whats-App-Image-2026-08-30-at-7-47-57-PM.jpg';
      changed = true;
    }
    if (currentLocal['malt-cake'] && currentLocal['malt-cake'].includes('malt')) {
      currentLocal['malt-cake'] = 'https://i.ibb.co/vyPhqKZ/Whats-App-Image-2026-08-30-at-7-47-57-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-malt-cake'] && currentLocal['poster-malt-cake'].includes('malt')) {
      currentLocal['poster-malt-cake'] = 'https://i.ibb.co/vyPhqKZ/Whats-App-Image-2026-08-30-at-7-47-57-PM.jpg';
      changed = true;
    }
    if (currentLocal['malteser-cake'] && currentLocal['malteser-cake'].includes('malt')) {
      currentLocal['malteser-cake'] = 'https://i.ibb.co/vyPhqKZ/Whats-App-Image-2026-08-30-at-7-47-57-PM.jpg';
      changed = true;
    }
    if (currentLocal['pina-colada-cake'] && (currentLocal['pina-colada-cake'].includes('pina_colada') || currentLocal['pina-colada-cake'].includes('pina-colada'))) {
      currentLocal['pina-colada-cake'] = 'https://i.ibb.co/bjB4Vmy7/Whats-App-Image-2026-08-30-at-7-47-58-PM.jpg';
      changed = true;
    }
    if (currentLocal['mango-cheese-special'] && (currentLocal['mango-cheese-special'].includes('mango_cheese') || currentLocal['mango-cheese-special'].includes('mango-cheese'))) {
      currentLocal['mango-cheese-special'] = 'https://i.ibb.co/FLkZJbL5/Whats-App-Image-2026-07-21-at-20-24-02.jpg';
      changed = true;
    }
    if (currentLocal['mango-tart-special'] && (currentLocal['mango-tart-special'].includes('mango_tart') || currentLocal['mango-tart-special'].includes('mango-tart'))) {
      currentLocal['mango-tart-special'] = 'https://i.ibb.co/ZRTKjHTZ/Whats-App-Image-2026-08-31-at-4-52-47-PM.jpg';
      changed = true;
    }
    if (currentLocal['multi-grain-bread'] && (currentLocal['multi-grain-bread'].includes('multi_grain') || currentLocal['multi-grain-bread'].includes('multigrain') || currentLocal['multi-grain-bread'].includes('multi-grain'))) {
      currentLocal['multi-grain-bread'] = 'https://i.ibb.co/gbrdCkvj/Whats-App-Image-2026-08-31-at-4-52-56-PM.jpg';
      changed = true;
    }
    if (currentLocal['mix-sweets'] && (currentLocal['mix-sweets'].includes('muffinns_mithai_gift_box') || currentLocal['mix-sweets'].includes('mithai_gift_box'))) {
      currentLocal['mix-sweets'] = 'https://i.ibb.co/RpchxQFm/Whats-App-Image-2026-08-31-at-4-52-35-PM.jpg';
      changed = true;
    }
    if (currentLocal['lotus-slice'] && (currentLocal['lotus-slice'].includes('lotus_slice') || currentLocal['lotus-slice'].includes('lotus-slice'))) {
      currentLocal['lotus-slice'] = 'https://i.ibb.co/JFjhrypp/Whats-App-Image-2026-08-31-at-4-52-35-PM.jpg';
      changed = true;
    }
    if (currentLocal['moti-chour-laddu-gold'] && (currentLocal['moti-chour-laddu-gold'].includes('moti_chour') || currentLocal['moti-chour-laddu-gold'].includes('moti-chour') || currentLocal['moti-chour-laddu-gold'].includes('motichoor'))) {
      currentLocal['moti-chour-laddu-gold'] = 'https://i.ibb.co/JRb5s3kf/Whats-App-Image-2026-08-31-at-4-52-44-PM.jpg';
      changed = true;
    }
    if (currentLocal['gajjar-halwa'] && (currentLocal['gajjar-halwa'].includes('gajar_halwa') || currentLocal['gajjar-halwa'].includes('gajjar') || currentLocal['gajjar-halwa'].includes('gajar'))) {
      currentLocal['gajjar-halwa'] = 'https://i.ibb.co/B2ZXCgS5/Whats-App-Image-2026-08-31-at-4-52-45-PM.jpg';
      changed = true;
    }
    if (currentLocal['sada-sohan-halwa'] && (currentLocal['sada-sohan-halwa'].includes('sohan_halwa') || currentLocal['sada-sohan-halwa'].includes('badami_sohan') || currentLocal['sada-sohan-halwa'].includes('sohan'))) {
      currentLocal['sada-sohan-halwa'] = 'https://i.ibb.co/LzX9J46x/Whats-App-Image-2026-08-31-at-4-52-46-PM.jpg';
      changed = true;
    }
    if (currentLocal['croissant-butter'] && (currentLocal['croissant-butter'].includes('unsplash') || currentLocal['croissant-butter'].includes('croissant'))) {
      currentLocal['croissant-butter'] = 'https://i.ibb.co/N6vt99Gr/Whats-App-Image-2026-08-31-at-4-52-43-PM.jpg';
      changed = true;
    }
    if (currentLocal['pure-milk'] && (currentLocal['pure-milk'].includes('muffinns_pure_flavored_milk') || currentLocal['pure-milk'].includes('pure_milk') || currentLocal['pure-milk'].includes('pure-milk'))) {
      currentLocal['pure-milk'] = 'https://i.ibb.co/x86WYVC8/Whats-App-Image-2026-08-31-at-4-52-57-PM.jpg';
      changed = true;
    }
    if (currentLocal['chocolate-tart'] && (currentLocal['chocolate-tart'].includes('muffinns_chocolate_tart') || currentLocal['chocolate-tart'].includes('chocolate_tart') || currentLocal['chocolate-tart'].includes('chocolate-tart'))) {
      currentLocal['chocolate-tart'] = 'https://i.ibb.co/rGJkMj85/Whats-App-Image-2026-08-31-at-4-53-04-PM.jpg';
      changed = true;
    }
    if (currentLocal['laddu-box'] && (currentLocal['laddu-box'].includes('variety_laddus') || currentLocal['laddu-box'].includes('milky_laddu'))) {
      currentLocal['laddu-box'] = 'https://i.ibb.co/mV6Bmg5P/Whats-App-Image-2026-08-31-at-4-53-04-PM.jpg';
      changed = true;
    }
    if (currentLocal['milky-coconut-laddu'] || currentLocal['milky-laddu']) {
      currentLocal['milky-coconut-laddu'] = 'https://i.ibb.co/mV6Bmg5P/Whats-App-Image-2026-08-31-at-4-53-04-PM.jpg';
      currentLocal['milky-laddu'] = 'https://i.ibb.co/mV6Bmg5P/Whats-App-Image-2026-08-31-at-4-53-04-PM.jpg';
      changed = true;
    }
    if (currentLocal['red-velvet-slice'] && (currentLocal['red-velvet-slice'].includes('muffinns_red_velvet_slice') || currentLocal['red-velvet-slice'].includes('red_velvet_slice') || currentLocal['red-velvet-slice'].includes('red-velvet-slice'))) {
      currentLocal['red-velvet-slice'] = 'https://i.ibb.co/39BHMfzG/Whats-App-Image-2026-08-31-at-4-53-01-PM.jpg';
      changed = true;
    }
    if (currentLocal['creamy-gulab-jamun'] && (currentLocal['creamy-gulab-jamun'].includes('gulab_jamun') || currentLocal['creamy-gulab-jamun'].includes('gulab-jamun'))) {
      currentLocal['creamy-gulab-jamun'] = 'https://i.ibb.co/rKGTdj3Z/Whats-App-Image-2026-08-31-at-4-53-08-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-gulab-jamun']) {
      currentLocal['poster-gulab-jamun'] = 'https://i.ibb.co/rKGTdj3Z/Whats-App-Image-2026-08-31-at-4-53-08-PM.jpg';
      changed = true;
    }
    if (currentLocal['french-heart'] && (currentLocal['french-heart'].includes('muffinns_french_heart') || currentLocal['french-heart'].includes('french_heart') || currentLocal['french-heart'].includes('french-heart'))) {
      currentLocal['french-heart'] = 'https://i.ibb.co/C3xfQZzb/Whats-App-Image-2026-08-31-at-4-52-58-PM.jpg';
      changed = true;
    }
    if (currentLocal['sundae-cups-trio'] && (currentLocal['sundae-cups-trio'].includes('muffinns_sundae_cups') || currentLocal['sundae-cups-trio'].includes('sundae_cups') || currentLocal['sundae-cups-trio'].includes('sundae-cups'))) {
      currentLocal['sundae-cups-trio'] = 'https://i.ibb.co/zVg0BtNX/Whats-App-Image-2026-08-31-at-4-52-57-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-sundae-cups'] && (currentLocal['poster-sundae-cups'].includes('muffinns_sundae_cups') || currentLocal['poster-sundae-cups'].includes('sundae_cups') || currentLocal['poster-sundae-cups'].includes('sundae-cups'))) {
      currentLocal['poster-sundae-cups'] = 'https://i.ibb.co/zVg0BtNX/Whats-App-Image-2026-08-31-at-4-52-57-PM.jpg';
      changed = true;
    }
    if (currentLocal['caramel-crunch-sundae'] && (currentLocal['caramel-crunch-sundae'].includes('muffinns_sundae_cups') || currentLocal['caramel-crunch-sundae'].includes('sundae_cups') || currentLocal['caramel-crunch-sundae'].includes('sundae-cups'))) {
      currentLocal['caramel-crunch-sundae'] = 'https://i.ibb.co/zVg0BtNX/Whats-App-Image-2026-08-31-at-4-52-57-PM.jpg';
      changed = true;
    }
    if (currentLocal['bento-cake'] && (currentLocal['bento-cake'].includes('muffinns_bento') || currentLocal['bento-cake'].includes('bento_cake') || currentLocal['bento-cake'].includes('bento-cake'))) {
      currentLocal['bento-cake'] = 'https://i.ibb.co/mKGS7Rp/Whats-App-Image-2026-08-31-at-4-52-55-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-bento-cakes-collection']) {
      currentLocal['poster-bento-cakes-collection'] = 'https://i.ibb.co/mKGS7Rp/Whats-App-Image-2026-08-31-at-4-52-55-PM.jpg';
      changed = true;
    }
    if (currentLocal['bento-cream-cake']) {
      currentLocal['bento-cream-cake'] = 'https://i.ibb.co/mKGS7Rp/Whats-App-Image-2026-08-31-at-4-52-55-PM.jpg';
      changed = true;
    }
    if (currentLocal['bakery-bliss-cupcakes-muffins'] && (currentLocal['bakery-bliss-cupcakes-muffins'].includes('muffinns_signature_muffins') || currentLocal['bakery-bliss-cupcakes-muffins'].includes('signature_muffins') || currentLocal['bakery-bliss-cupcakes-muffins'].includes('muffins_cupcakes_real'))) {
      currentLocal['bakery-bliss-cupcakes-muffins'] = 'https://i.ibb.co/KjxwTQQt/Whats-App-Image-2026-08-31-at-4-53-00-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-bakery-bliss']) {
      currentLocal['poster-bakery-bliss'] = 'https://i.ibb.co/KjxwTQQt/Whats-App-Image-2026-08-31-at-4-53-00-PM.jpg';
      changed = true;
    }
    if (currentLocal['muffins-cupcakes-3tier-stand'] && (currentLocal['muffins-cupcakes-3tier-stand'].includes('muffinns_signature_muffins') || currentLocal['muffins-cupcakes-3tier-stand'].includes('signature_muffins'))) {
      currentLocal['muffins-cupcakes-3tier-stand'] = 'https://i.ibb.co/KjxwTQQt/Whats-App-Image-2026-08-31-at-4-53-00-PM.jpg';
      changed = true;
    }
    if (currentLocal['muffin-choco-chip'] && (currentLocal['muffin-choco-chip'].includes('muffinns_signature_muffins') || currentLocal['muffin-choco-chip'].includes('signature_muffins'))) {
      currentLocal['muffin-choco-chip'] = 'https://i.ibb.co/KjxwTQQt/Whats-App-Image-2026-08-31-at-4-53-00-PM.jpg';
      changed = true;
    }
    if (currentLocal['cookies-naan-khatai'] && (currentLocal['cookies-naan-khatai'].includes('muffinns_almond_khatai') || currentLocal['cookies-naan-khatai'].includes('almond_khatai') || currentLocal['cookies-naan-khatai'].includes('khatai'))) {
      currentLocal['cookies-naan-khatai'] = 'https://i.ibb.co/HpzsGBhB/Whats-App-Image-2026-08-31-at-4-53-05-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-almond-khatai']) {
      currentLocal['poster-almond-khatai'] = 'https://i.ibb.co/HpzsGBhB/Whats-App-Image-2026-08-31-at-4-53-05-PM.jpg';
      changed = true;
    }
    if (currentLocal['almond-khatai']) {
      currentLocal['almond-khatai'] = 'https://i.ibb.co/HpzsGBhB/Whats-App-Image-2026-08-31-at-4-53-05-PM.jpg';
      changed = true;
    }
    if (currentLocal['daal-halwa'] && (currentLocal['daal-halwa'].includes('daal_halwa') || currentLocal['daal-halwa'].includes('dal_halwa'))) {
      currentLocal['daal-halwa'] = 'https://i.ibb.co/fdnsJxgd/Whats-App-Image-2026-08-31-at-4-52-36-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-daal-halwa']) {
      currentLocal['poster-daal-halwa'] = 'https://i.ibb.co/fdnsJxgd/Whats-App-Image-2026-08-31-at-4-52-36-PM.jpg';
      changed = true;
    }
    if (currentLocal['cake-rusk'] && (currentLocal['cake-rusk'].includes('cake_rusk') || currentLocal['cake-rusk'].includes('almond_rusk') || currentLocal['cake-rusk'].includes('rusk'))) {
      currentLocal['cake-rusk'] = 'https://i.ibb.co/9mtmrvkv/Whats-App-Image-2026-08-31-at-4-52-39-PM.jpg';
      changed = true;
    }
    if (currentLocal['poster-cake-rusk']) {
      currentLocal['poster-cake-rusk'] = 'https://i.ibb.co/9mtmrvkv/Whats-App-Image-2026-08-31-at-4-52-39-PM.jpg';
      changed = true;
    }
    if (currentLocal['special-rus'] || currentLocal['special-rusk'] || currentLocal['special-rusk-cake']) {
      currentLocal['special-rus'] = 'https://i.ibb.co/LdY9YGDs/Whats-App-Image-2026-08-31-at-4-52-38-PM.jpg';
      currentLocal['special-rusk-cake'] = 'https://i.ibb.co/LdY9YGDs/Whats-App-Image-2026-08-31-at-4-52-38-PM.jpg';
      changed = true;
    }
    if (currentLocal['muffins-cupcakes-3tier-stand'] || currentLocal['poster-muffins-cupcakes-tier'] || currentLocal['muffins-cupcakes']) {
      currentLocal['muffins-cupcakes-3tier-stand'] = 'https://i.ibb.co/Cs4P2zPz/Whats-App-Image-2026-08-31-at-4-52-40-PM.jpg';
      currentLocal['poster-muffins-cupcakes-tier'] = 'https://i.ibb.co/Cs4P2zPz/Whats-App-Image-2026-08-31-at-4-52-40-PM.jpg';
      changed = true;
    }
    if (currentLocal['mothers-day-bento'] || currentLocal['poster-mothers-day-bento'] || currentLocal['mothers-day-cake']) {
      currentLocal['mothers-day-bento'] = 'https://i.ibb.co/JRbJ4np8/Whats-App-Image-2026-08-31-at-4-53-05-PM.jpg';
      currentLocal['poster-mothers-day-bento'] = 'https://i.ibb.co/JRbJ4np8/Whats-App-Image-2026-08-31-at-4-53-05-PM.jpg';
      changed = true;
    }
    if (currentLocal['badami-sohan-halwa'] || currentLocal['poster-badami-sohan-halwa'] || (currentLocal['badami-sohan-halwa'] && currentLocal['badami-sohan-halwa'].includes('badami_sohan_halwa'))) {
      currentLocal['badami-sohan-halwa'] = 'https://i.ibb.co/3y4dvDph/Whats-App-Image-2026-08-30-at-7-47-56-PM.jpg';
      currentLocal['poster-badami-sohan-halwa'] = 'https://i.ibb.co/3y4dvDph/Whats-App-Image-2026-08-30-at-7-47-56-PM.jpg';
      changed = true;
    }
    if (currentLocal['special-donut'] || currentLocal['poster-assorted-donuts'] || currentLocal['assorted-donuts'] || currentLocal['donuts'] || (currentLocal['special-donut'] && currentLocal['special-donut'].includes('assorted_donuts'))) {
      currentLocal['special-donut'] = 'https://i.ibb.co/2fyCdpK/Whats-App-Image-2026-08-31-at-4-53-07-PM.jpg';
      currentLocal['poster-assorted-donuts'] = 'https://i.ibb.co/2fyCdpK/Whats-App-Image-2026-08-31-at-4-53-07-PM.jpg';
      changed = true;
    }
    if (currentLocal['brownie-fudge'] || currentLocal['brownie-walnut'] || currentLocal['brownie-kitkat'] || currentLocal['poster-chocolate-brownie'] || (currentLocal['brownie-fudge'] && currentLocal['brownie-fudge'].includes('IMG-7599'))) {
      currentLocal['brownie-fudge'] = 'https://i.ibb.co/ym1jScvx/Whats-App-Image-2026-08-31-at-4-53-11-PM.jpg';
      currentLocal['brownie-walnut'] = 'https://i.ibb.co/ym1jScvx/Whats-App-Image-2026-08-31-at-4-53-11-PM.jpg';
      currentLocal['brownie-kitkat'] = 'https://i.ibb.co/ym1jScvx/Whats-App-Image-2026-08-31-at-4-53-11-PM.jpg';
      currentLocal['poster-chocolate-brownie'] = 'https://i.ibb.co/ym1jScvx/Whats-App-Image-2026-08-31-at-4-53-11-PM.jpg';
      changed = true;
    }
    if (currentLocal['fruit-cake'] || currentLocal['poster-fruit-cake'] || (currentLocal['fruit-cake'] && currentLocal['fruit-cake'].includes('fruit_cake'))) {
      currentLocal['fruit-cake'] = 'https://i.ibb.co/RpZ2N3Xc/Whats-App-Image-2026-09-01-at-8-42-45-PM.jpg';
      currentLocal['poster-fruit-cake'] = 'https://i.ibb.co/RpZ2N3Xc/Whats-App-Image-2026-09-01-at-8-42-45-PM.jpg';
      changed = true;
    }
    if (currentLocal['laddu-box'] || currentLocal['poster-variety-laddus'] || currentLocal['variety-laddus'] || (currentLocal['poster-variety-laddus'] && currentLocal['poster-variety-laddus'].includes('variety_laddus'))) {
      currentLocal['laddu-box'] = 'https://i.ibb.co/YT2gwHGR/Whats-App-Image-2026-09-01-at-8-44-26-PM.jpg';
      currentLocal['poster-variety-laddus'] = 'https://i.ibb.co/YT2gwHGR/Whats-App-Image-2026-09-01-at-8-44-26-PM.jpg';
      changed = true;
    }
    if (currentLocal['slice-rus'] || currentLocal['slice-rusk'] || (currentLocal['slice-rus'] && currentLocal['slice-rus'].includes('unsplash'))) {
      currentLocal['slice-rus'] = 'https://i.ibb.co/pk2q6mB/slice-rusk.webp';
      currentLocal['slice-rusk'] = 'https://i.ibb.co/pk2q6mB/slice-rusk.webp';
      changed = true;
    }
    if (currentLocal['three-milk-cake'] || currentLocal['three-milk-cup']) {
      currentLocal['three-milk-cake'] = 'https://i.ibb.co/jk7rk9Hk/three-milk-cake.webp';
      currentLocal['three-milk-cup'] = 'https://i.ibb.co/jk7rk9Hk/three-milk-cake.webp';
      changed = true;
    }
    if (currentLocal['burger-rus'] || currentLocal['burger-rusk'] || (currentLocal['burger-rus'] && currentLocal['burger-rus'].includes('unsplash'))) {
      currentLocal['burger-rus'] = 'https://i.ibb.co/GvhqmvX7/burger-rusk.webp';
      currentLocal['burger-rusk'] = 'https://i.ibb.co/GvhqmvX7/burger-rusk.webp';
      changed = true;
    }
    if (currentLocal['lemon-tart'] !== 'https://ik.imagekit.io/wvchctn6t/images%20(4).jfif?updatedAt=1788964827732') {
      currentLocal['lemon-tart'] = 'https://ik.imagekit.io/wvchctn6t/images%20(4).jfif?updatedAt=1788964827732';
      changed = true;
      try {
        updateMenuItemImageInFirestore('lemon-tart', 'https://ik.imagekit.io/wvchctn6t/images%20(4).jfif?updatedAt=1788964827732');
      } catch (e) {}
    }
    if (currentLocal['lotus-three-milk-cake']) {
      currentLocal['lotus-three-milk-cake'] = 'https://i.ibb.co/7tfzd9vQ/download.jpg';
      changed = true;
    }
    if (currentLocal['nutella-cake'] || currentLocal['poster-nutella-cake'] || !currentLocal['nutella-cake'] || (currentLocal['nutella-cake'] && currentLocal['nutella-cake'].includes('unsplash'))) {
      currentLocal['nutella-cake'] = 'https://i.ibb.co/6jrJNTn/Whats-App-Image-2026-09-05-at-10-43-56-AM.jpg';
      currentLocal['poster-nutella-cake'] = 'https://i.ibb.co/6jrJNTn/Whats-App-Image-2026-09-05-at-10-43-56-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('nutella-cake', 'https://i.ibb.co/6jrJNTn/Whats-App-Image-2026-09-05-at-10-43-56-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['cappuccino-coffee-cafe'] || currentLocal['poster-cappuccino'] || !currentLocal['cappuccino-coffee-cafe'] || (currentLocal['cappuccino-coffee-cafe'] && currentLocal['cappuccino-coffee-cafe'].includes('cappuccino_poster_1785057776626.jpg'))) {
      currentLocal['cappuccino-coffee-cafe'] = 'https://i.ibb.co/Y7y49jq5/Whats-App-Image-2026-09-08-at-2-42-57-PM.jpg';
      currentLocal['poster-cappuccino'] = 'https://i.ibb.co/Y7y49jq5/Whats-App-Image-2026-09-08-at-2-42-57-PM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('cappuccino-coffee-cafe', 'https://i.ibb.co/Y7y49jq5/Whats-App-Image-2026-09-08-at-2-42-57-PM.jpg');
      } catch (e) {}
    }
    if (currentLocal['rolled-ice-cream-cafe'] || currentLocal['poster-rolled-ice-cream'] || !currentLocal['rolled-ice-cream-cafe'] || (currentLocal['rolled-ice-cream-cafe'] && currentLocal['rolled-ice-cream-cafe'].includes('rolled_ice_cream_poster_1785057787641.jpg'))) {
      currentLocal['rolled-ice-cream-cafe'] = 'https://i.ibb.co/P05RLgj/Whats-App-Image-2026-09-08-at-2-42-59-PM.jpg';
      currentLocal['poster-rolled-ice-cream'] = 'https://i.ibb.co/P05RLgj/Whats-App-Image-2026-09-08-at-2-42-59-PM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('rolled-ice-cream-cafe', 'https://i.ibb.co/P05RLgj/Whats-App-Image-2026-09-08-at-2-42-59-PM.jpg');
      } catch (e) {}
    }
    if (currentLocal['oreo-shake-cafe'] || currentLocal['poster-oreo-shake'] || !currentLocal['oreo-shake-cafe'] || (currentLocal['oreo-shake-cafe'] && currentLocal['oreo-shake-cafe'].includes('oreo_shake_poster_1785057764973.jpg'))) {
      currentLocal['oreo-shake-cafe'] = 'https://i.ibb.co/jc3JPkZ/Whats-App-Image-2026-09-08-at-2-43-00-PM.jpg';
      currentLocal['poster-oreo-shake'] = 'https://i.ibb.co/jc3JPkZ/Whats-App-Image-2026-09-08-at-2-43-00-PM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('oreo-shake-cafe', 'https://i.ibb.co/jc3JPkZ/Whats-App-Image-2026-09-08-at-2-43-00-PM.jpg');
      } catch (e) {}
    }
    if (currentLocal['qalakand'] || !currentLocal['qalakand'] || (currentLocal['qalakand'] && currentLocal['qalakand'].includes('unsplash'))) {
      currentLocal['qalakand'] = 'https://i.ibb.co/S7DB1CPN/Whats-App-Image-2026-09-05-at-10-48-58-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('qalakand', 'https://i.ibb.co/S7DB1CPN/Whats-App-Image-2026-09-05-at-10-48-58-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['chocolate-burfi'] || !currentLocal['chocolate-burfi'] || (currentLocal['chocolate-burfi'] && currentLocal['chocolate-burfi'].includes('unsplash'))) {
      currentLocal['chocolate-burfi'] = 'https://i.ibb.co/hRkb6P38/Whats-App-Image-2026-09-05-at-10-50-02-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('chocolate-burfi', 'https://i.ibb.co/hRkb6P38/Whats-App-Image-2026-09-05-at-10-50-02-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['pista-kajoo-burfi'] || !currentLocal['pista-kajoo-burfi'] || (currentLocal['pista-kajoo-burfi'] && currentLocal['pista-kajoo-burfi'].includes('unsplash'))) {
      currentLocal['pista-kajoo-burfi'] = 'https://i.ibb.co/qY00Z0sz/Whats-App-Image-2026-09-05-at-10-51-46-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('pista-kajoo-burfi', 'https://i.ibb.co/qY00Z0sz/Whats-App-Image-2026-09-05-at-10-51-46-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['habshi-jamun'] || !currentLocal['habshi-jamun'] || (currentLocal['habshi-jamun'] && currentLocal['habshi-jamun'].includes('unsplash'))) {
      currentLocal['habshi-jamun'] = 'https://i.ibb.co/sdKnL9sm/Whats-App-Image-2026-09-05-at-10-54-34-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('habshi-jamun', 'https://i.ibb.co/sdKnL9sm/Whats-App-Image-2026-09-05-at-10-54-34-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['lamba-jamun'] || !currentLocal['lamba-jamun'] || (currentLocal['lamba-jamun'] && currentLocal['lamba-jamun'].includes('unsplash'))) {
      currentLocal['lamba-jamun'] = 'https://i.ibb.co/M5VkpFy3/Whats-App-Image-2026-09-05-at-10-55-46-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('lamba-jamun', 'https://i.ibb.co/M5VkpFy3/Whats-App-Image-2026-09-05-at-10-55-46-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['rasgullah'] || !currentLocal['rasgullah'] || (currentLocal['rasgullah'] && currentLocal['rasgullah'].includes('unsplash'))) {
      currentLocal['rasgullah'] = 'https://i.ibb.co/LD3RsM81/Whats-App-Image-2026-09-05-at-10-57-04-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('rasgullah', 'https://i.ibb.co/LD3RsM81/Whats-App-Image-2026-09-05-at-10-57-04-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['balushahi'] || !currentLocal['balushahi'] || (currentLocal['balushahi'] && currentLocal['balushahi'].includes('unsplash'))) {
      currentLocal['balushahi'] = 'https://i.ibb.co/GQKmCCqv/Whats-App-Image-2026-09-05-at-10-58-24-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('balushahi', 'https://i.ibb.co/GQKmCCqv/Whats-App-Image-2026-09-05-at-10-58-24-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['mesu'] || !currentLocal['mesu'] || (currentLocal['mesu'] && currentLocal['mesu'].includes('unsplash'))) {
      currentLocal['mesu'] = 'https://i.ibb.co/VW2rg5s3/Whats-App-Image-2026-09-05-at-11-00-44-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('mesu', 'https://i.ibb.co/VW2rg5s3/Whats-App-Image-2026-09-05-at-11-00-44-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['muffin-kitkat'] || !currentLocal['muffin-kitkat'] || (currentLocal['muffin-kitkat'] && currentLocal['muffin-kitkat'].includes('unsplash'))) {
      currentLocal['muffin-kitkat'] = 'https://i.ibb.co/QFYv4SdF/Whats-App-Image-2026-09-05-at-11-03-11-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('muffin-kitkat', 'https://i.ibb.co/QFYv4SdF/Whats-App-Image-2026-09-05-at-11-03-11-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['muffin-honey'] || !currentLocal['muffin-honey'] || (currentLocal['muffin-honey'] && currentLocal['muffin-honey'].includes('unsplash'))) {
      currentLocal['muffin-honey'] = 'https://i.ibb.co/6pLr3bj/Whats-App-Image-2026-09-05-at-11-04-41-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('muffin-honey', 'https://i.ibb.co/6pLr3bj/Whats-App-Image-2026-09-05-at-11-04-41-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['muffin-red-velvet'] || !currentLocal['muffin-red-velvet'] || (currentLocal['muffin-red-velvet'] && (currentLocal['muffin-red-velvet'].includes('Cs4P2zPz') || currentLocal['muffin-red-velvet'].includes('unsplash')))) {
      currentLocal['muffin-red-velvet'] = 'https://i.ibb.co/1JpwyS9m/Whats-App-Image-2026-09-05-at-11-06-22-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('muffin-red-velvet', 'https://i.ibb.co/1JpwyS9m/Whats-App-Image-2026-09-05-at-11-06-22-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['kulfi'] || !currentLocal['kulfi'] || (currentLocal['kulfi'] && currentLocal['kulfi'].includes('unsplash'))) {
      currentLocal['kulfi'] = 'https://i.ibb.co/svbhztPP/Whats-App-Image-2026-09-05-at-11-08-51-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('kulfi', 'https://i.ibb.co/svbhztPP/Whats-App-Image-2026-09-05-at-11-08-51-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['ras-malai'] || !currentLocal['ras-malai'] || (currentLocal['ras-malai'] && currentLocal['ras-malai'].includes('unsplash'))) {
      currentLocal['ras-malai'] = 'https://i.ibb.co/PpcVv1M/Whats-App-Image-2026-09-05-at-11-09-33-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('ras-malai', 'https://i.ibb.co/PpcVv1M/Whats-App-Image-2026-09-05-at-11-09-33-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['muffin-nutella'] || !currentLocal['muffin-nutella'] || (currentLocal['muffin-nutella'] && currentLocal['muffin-nutella'].includes('unsplash'))) {
      currentLocal['muffin-nutella'] = 'https://i.ibb.co/rGxfZ4VD/Whats-App-Image-2026-09-05-at-11-11-17-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('muffin-nutella', 'https://i.ibb.co/rGxfZ4VD/Whats-App-Image-2026-09-05-at-11-11-17-AM.jpg');
      } catch (e) {}
    }
    if (currentLocal['honey-slice'] || !currentLocal['honey-slice'] || (currentLocal['honey-slice'] && currentLocal['honey-slice'].includes('unsplash'))) {
      currentLocal['honey-slice'] = 'https://i.ibb.co/HLr2SJ0h/Whats-App-Image-2026-09-05-at-11-18-47-AM.jpg';
      changed = true;
      try {
        updateMenuItemImageInFirestore('honey-slice', 'https://i.ibb.co/HLr2SJ0h/Whats-App-Image-2026-09-05-at-11-18-47-AM.jpg');
      } catch (e) {}
    }
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLocal));
    }
  } catch (e) {}

  // 1. Listen to live Firestore menu items
  subscribeToMenu((firestoreItems) => {
    if (firestoreItems && firestoreItems.length > 0) {
      firestoreItemsCache = firestoreItems;
      
      // Update image map
      const customMap = getCustomImageMap();
      firestoreItems.forEach((item) => {
        if (item.image) {
          customMap[item.id] = item.image;
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customMap));
      
      window.dispatchEvent(new Event('muffinns_menu_updated'));
      if (onMenuUpdate) {
        onMenuUpdate(getStoredMenuItems());
      }
    }
  });

  // 2. Listen to dedicated Firestore custom_images collection
  subscribeToCustomImages((cloudImageMap) => {
    if (cloudImageMap && Object.keys(cloudImageMap).length > 0) {
      firestoreImagesMapCache = { ...firestoreImagesMapCache, ...cloudImageMap };
      const localMap = getCustomImageMap();
      const merged = { ...localMap, ...cloudImageMap };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('muffinns_menu_updated'));
    }
  });
}

// Category fallback local images when an external network image fails
export function getCategoryFallbackImage(category?: string): string {
  switch (category) {
    case 'Breads':
      return '/assets/images/muffinns_multi_grain_bread.jpg';
    case 'Buns, Croissants & Tarts':
      return '/assets/images/muffinns_chocolate_tart.jpg';
    case 'Sweets':
    case 'Traditional & Pateesa':
      return '/assets/images/muffinns_patashay_sweets_1784645566064.jpg';
    case 'Biscuits & Cookies':
      return 'https://i.ibb.co/mVPxn44G/Whats-App-Image-2026-08-30-at-7-47-53-PM.jpg';
    case 'Muffins & Desserts':
      return 'https://i.ibb.co/KjxwTQQt/Whats-App-Image-2026-08-31-at-4-53-00-PM.jpg';
    case 'Pastries & Brownies':
      return 'https://i.ibb.co/xS9rpJFJ/IMG-7599.jpg';
    case 'Pattiess, Puffs & Donuts':
      return '/assets/images/assorted_donuts_poster_1785053725000_1785053747442.jpg';
    case 'Savory Snacks':
      return '/assets/images/muffinns_chicken_patty_1784645625734.jpg';
    case 'Sundae & Cups':
      return 'https://i.ibb.co/zVg0BtNX/Whats-App-Image-2026-08-31-at-4-52-57-PM.jpg';
    case 'Cakes (Classic & Dry)':
      return 'https://i.ibb.co/tMmbLKPw/IMG-7598.jpg';
    case 'Cakes (Cream & Special)':
    default:
      return '/assets/images/muffinns_three_milk_cake_1784645579407.jpg';
  }
}

// Get custom images map from localStorage
export function getCustomImageMap(): Record<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error parsing custom images from localStorage:', e);
  }
  return {};
}

// Get deleted item IDs
export function getDeletedItemIds(): string[] {
  try {
    const saved = localStorage.getItem(DELETED_ITEMS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

// Get custom added items
export function getCustomAddedItems(): MenuItem[] {
  try {
    const saved = localStorage.getItem(CUSTOM_ITEMS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

// Get all menu items with custom images & custom items applied
export function getStoredMenuItems(): MenuItem[] {
  const deletedIds = new Set(getDeletedItemIds());
  const customMap = { ...getCustomImageMap(), ...firestoreImagesMapCache };
  const customItems = getCustomAddedItems();

  const processImage = (img?: string, category?: string) => {
    if (!img || img.trim().length === 0 || img.includes('unsplash.com')) {
      return getCategoryFallbackImage(category);
    }
    return img;
  };

  const itemMap = new Map<string, MenuItem>();

  // 1. First add base code items
  for (const item of MENU_ITEMS) {
    if (!deletedIds.has(item.id)) {
      const customImg = customMap[item.id];
      itemMap.set(item.id, {
        ...item,
        image: processImage(customImg || item.image, item.category)
      });
    }
  }

  // 2. Add local custom-created items
  for (const item of customItems) {
    if (!deletedIds.has(item.id)) {
      const customImg = customMap[item.id];
      itemMap.set(item.id, {
        ...item,
        image: processImage(customImg || item.image, item.category)
      });
    }
  }

  // 3. Apply authoritative Firestore documents (Cloud Backend)
  if (firestoreItemsCache && firestoreItemsCache.length > 0) {
    for (const fsItem of firestoreItemsCache) {
      if (!deletedIds.has(fsItem.id)) {
        const customImg = customMap[fsItem.id];
        const existingLocal = itemMap.get(fsItem.id);
        const resolvedImage = fsItem.image || customImg || existingLocal?.image;
        
        itemMap.set(fsItem.id, {
          ...(existingLocal || {}),
          ...fsItem,
          image: processImage(resolvedImage, fsItem.category)
        });
      } else {
        itemMap.delete(fsItem.id);
      }
    }
  }

  return Array.from(itemMap.values());
}

// Helper to compress and convert file to base64 Data URL
export function compressImageFile(file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            width = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string || '');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target?.result as string || '');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Upload photo file and return resilient self-contained Data URL / ImgBB CDN URL
export async function uploadImageFileToServer(file: File, nameHint?: string): Promise<string> {
  try {
    const compressedDataUrl = await compressImageFile(file);
    
    // Send to Express backend which securely proxies to ImgBB (API key isolated on server)
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          fileName: nameHint || file.name || 'bakery_photo',
          base64Data: compressedDataUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.imageUrl) {
          console.log(`[ImgBB CDN] Photo uploaded successfully (${data.provider || 'imgbb'}):`, data.imageUrl);
          return data.imageUrl; // Direct https://i.ibb.co/... URL
        }
      }
    } catch (apiErr) {
      console.warn('Server ImgBB upload proxy unavailable, using local data URL fallback:', apiErr);
    }

    return compressedDataUrl;
  } catch (err) {
    console.error('Error compressing uploaded photo:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// Sync menu items from server API
export async function syncMenuItemsFromServer(): Promise<MenuItem[]> {
  const localMap = getCustomImageMap();
  try {
    const res = await fetch('/api/menu/images');
    if (res.ok) {
      const serverMap = await res.json();
      if (serverMap && typeof serverMap === 'object') {
        const mergedMap = { ...serverMap, ...localMap };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedMap));
        window.dispatchEvent(new Event('muffinns_menu_updated'));
      }
    }
  } catch (e) {
    console.log('Server menu sync skipped');
  }
  return getStoredMenuItems();
}

// Save or Update image for a specific item (Persists in localStorage, Express API & Firestore!)
export async function updateMenuItemImage(id: string, imageUrl: string): Promise<MenuItem[]> {
  try {
    // 1. LocalStorage
    const customMap = getCustomImageMap();
    customMap[id] = imageUrl;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customMap));

    // 2. Synchronous in-memory update
    if (firestoreItemsCache) {
      firestoreItemsCache = firestoreItemsCache.map(i => i.id === id ? { ...i, image: imageUrl } : i);
    }

    // 3. Broadcast local update
    window.dispatchEvent(new Event('muffinns_menu_updated'));

    // 4. Express server API
    fetch('/api/menu/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, imageUrl })
    }).catch(() => {});

    // 5. Firestore DB backend
    const currentList = getStoredMenuItems();
    const existingItem = currentList.find(i => i.id === id);
    if (existingItem) {
      const updatedItem = { ...existingItem, image: imageUrl };
      saveMenuItemToFirestore(updatedItem).catch(err => console.error('Firestore save err:', err));
    } else {
      updateMenuItemImageInFirestore(id, imageUrl).catch(err => console.error('Firestore image update err:', err));
    }
  } catch (e) {
    console.error('Error syncing image update with backend:', e);
  }
  return getStoredMenuItems();
}

// Save or Update FULL Menu Item (Name, Price, Category, Description, Image)
export async function updateFullMenuItem(item: MenuItem): Promise<MenuItem[]> {
  try {
    // Save image mapping
    if (item.image) {
      const customMap = getCustomImageMap();
      customMap[item.id] = item.image;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customMap));
    }

    // Synchronous in-memory update
    if (firestoreItemsCache) {
      const idx = firestoreItemsCache.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        firestoreItemsCache[idx] = item;
      } else {
        firestoreItemsCache.unshift(item);
      }
    }

    // Save custom added item list if custom
    const customItems = getCustomAddedItems();
    const existingIdx = customItems.findIndex(i => i.id === item.id);
    if (existingIdx !== -1) {
      customItems[existingIdx] = item;
      localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(customItems));
    } else if (!MENU_ITEMS.some(i => i.id === item.id)) {
      customItems.unshift(item);
      localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(customItems));
    }

    // Broadcast local update
    window.dispatchEvent(new Event('muffinns_menu_updated'));

    // Persist to Firestore DB backend
    await saveMenuItemToFirestore(item);
  } catch (e) {
    console.error('Error updating menu item in Firestore backend:', e);
  }
  return getStoredMenuItems();
}

// Add a NEW Menu Item
export async function addNewMenuItem(newItem: MenuItem): Promise<MenuItem[]> {
  try {
    // 1. Store in custom items list
    const customItems = getCustomAddedItems();
    customItems.unshift(newItem);
    localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(customItems));

    // 2. Store image in map
    if (newItem.image) {
      const customMap = getCustomImageMap();
      customMap[newItem.id] = newItem.image;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customMap));
    }

    // 3. Synchronous in-memory update
    if (firestoreItemsCache) {
      firestoreItemsCache.unshift(newItem);
    }

    // 4. Broadcast local update
    window.dispatchEvent(new Event('muffinns_menu_updated'));

    // 5. Save to Firestore backend permanently!
    await saveMenuItemToFirestore(newItem);
  } catch (e) {
    console.error('Error adding new menu item to Firestore backend:', e);
  }
  return getStoredMenuItems();
}

// Delete a Menu Item entirely from backend and store
export async function deleteFullMenuItem(itemId: string): Promise<MenuItem[]> {
  try {
    // 1. Add to deleted list
    const deleted = getDeletedItemIds();
    if (!deleted.includes(itemId)) {
      deleted.push(itemId);
      localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(deleted));
    }

    // 2. Synchronous in-memory deletion
    if (firestoreItemsCache) {
      firestoreItemsCache = firestoreItemsCache.filter(i => i.id !== itemId);
    }

    // 3. Remove from custom items list
    const customItems = getCustomAddedItems().filter(i => i.id !== itemId);
    localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(customItems));

    // 4. Remove from custom image map
    const customMap = getCustomImageMap();
    delete customMap[itemId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customMap));

    // 5. Broadcast local update
    window.dispatchEvent(new Event('muffinns_menu_updated'));

    // 6. Delete from Express API
    fetch(`/api/menu/images/${itemId}`, { method: 'DELETE' }).catch(() => {});

    // 7. Delete from Firestore DB backend!
    await deleteMenuItemFromFirestore(itemId);
  } catch (e) {
    console.error('Error deleting menu item from Firestore backend:', e);
  }
  return getStoredMenuItems();
}

// Reset an item image to default
export async function resetMenuItemImage(id: string): Promise<MenuItem[]> {
  try {
    const customMap = getCustomImageMap();
    delete customMap[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customMap));

    const baseItem = MENU_ITEMS.find(i => i.id === id);
    const defaultImg = baseItem ? baseItem.image : getCategoryFallbackImage();

    if (firestoreItemsCache) {
      firestoreItemsCache = firestoreItemsCache.map(i => i.id === id ? { ...i, image: defaultImg } : i);
    }

    window.dispatchEvent(new Event('muffinns_menu_updated'));

    fetch(`/api/menu/images/${id}`, { method: 'DELETE' }).catch(() => {});

    // Reset in Firestore if default item
    if (baseItem) {
      saveMenuItemToFirestore(baseItem).catch(err => console.error(err));
    }
  } catch (e) {
    console.error('Error resetting image:', e);
  }
  return getStoredMenuItems();
}

// Reset all images to default
export async function resetAllCustomImages(): Promise<MenuItem[]> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUSTOM_ITEMS_KEY);
    localStorage.removeItem(DELETED_ITEMS_KEY);
    window.dispatchEvent(new Event('muffinns_menu_updated'));
    fetch('/api/menu/images/reset', { method: 'POST' }).catch(() => {});

    // Re-seed default items to Firestore
    for (const item of MENU_ITEMS) {
      saveMenuItemToFirestore(item).catch(() => {});
    }
  } catch (e) {
    console.error('Error resetting all images:', e);
  }
  return MENU_ITEMS;
}
