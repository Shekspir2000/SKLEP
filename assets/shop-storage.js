(() => {
  const PRODUCT_KEY = 'arianska_selection_test_shop_products';
  const STATE_KEY = 'arianska_boutique_demo_state_v1';
  const CART_KEY = 'arianska_boutique_cart_v1';
  const FAVORITES_KEY = 'arianska_boutique_favorites_v1';
  const read = (key, fallback) => {try {return JSON.parse(localStorage.getItem(key)) ?? fallback;} catch {return fallback;}};
  const write = (key, value) => {localStorage.setItem(key, JSON.stringify(value));};
  const list = key => {const value=read(key,[]); return Array.isArray(value)?value:[];};
  const state = () => {const value=read(STATE_KEY,{}); return {inventory:value.inventory||{},orders:value.orders||{}};};
  const notify = () => window.dispatchEvent(new Event('shop-change'));
  const customProducts = () => list(PRODUCT_KEY);
  const rawProducts = () => {
    const map = new Map((window.ARIA_SHOP_PRODUCTS||[]).map(p=>[p.id,p]));
    for(const p of customProducts()) if(p && typeof p.id==='string') map.set(p.id,p);
    return [...map.values()].filter(p=>!p.deleted);
  };
  const statusOf = (product, current) => {
    if(product.status!=='available') return product.status;
    const slot = current.inventory[product.id];
    if(slot?.status==='sold') return 'sold';
    if(slot?.status==='reserved' && slot.expiresAt>Date.now()) return 'reserved';
    return 'available';
  };
  const allProducts = () => {const current=state();return rawProducts().map(p=>({...p,status:statusOf(p,current)}));};
  const saveProduct = product => {
    if(!product.name?.trim() || !Number.isFinite(product.price) || product.price<=0) throw new Error('Uzupełnij nazwę i prawidłową cenę.');
    if(!['available','reserved','sold'].includes(product.status)) throw new Error('Nieprawidłowy status produktu.');
    const products=customProducts().filter(p=>p.id!==product.id);
    write(PRODUCT_KEY,[...products,product]);notify();return product;
  };
  const removeProduct = id => {
    const p=rawProducts().find(p=>p.id===id);if(!p)return;
    write(PRODUCT_KEY,[...customProducts().filter(p=>p.id!==id),{...p,deleted:true}]);notify();
  };
  const slugify = value => String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || `produkt-${Date.now()}`;
  const cart = () => [...new Set(list(CART_KEY))].filter(id=>rawProducts().some(p=>p.id===id));
  const setCart = ids => {write(CART_KEY,[...new Set(ids)]);notify();};
  const addToCart = id => {
    const p=allProducts().find(p=>p.id===id);
    if(!p || p.status!=='available') throw new Error('Ta rzecz nie jest już dostępna.');
    setCart([...cart(),id]);
  };
  const favorites = () => [...new Set(list(FAVORITES_KEY))];
  const toggleFavorite = id => {const ids=favorites();write(FAVORITES_KEY,ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);notify();};
  const owner = () => {
    let id=sessionStorage.getItem('aria-boutique-owner');
    if(!id){id=crypto.randomUUID();sessionStorage.setItem('aria-boutique-owner',id);}return id;
  };
  // Browser locks serialize demo reservations between tabs on the same origin.
  // This is not a server lock and must never be used to collect real payments.
  const locked = action => navigator.locks ? navigator.locks.request('aria-demo-inventory',action) : Promise.resolve().then(action);
  const reserve = (ids,delivery='pickup') => locked(() => {
    ids=[...new Set(ids)];if(!ids.length)throw new Error('Koszyk jest pusty.');
    const current=state();const products=rawProducts();
    for(const id of ids){const p=products.find(p=>p.id===id);if(!p||statusOf(p,current)!=='available')throw new Error('Jedna z rzeczy jest już zarezerwowana lub sprzedana. Sprawdź koszyk.');}
    const id=crypto.randomUUID();const expiresAt=Date.now()+15*60*1000;
    const items=ids.map(id=>{const p=products.find(p=>p.id===id);return {id,name:p.name,price:p.price,cover:p.cover,size:p.size};});
    const deliveryPrice=({pickup:0,locker:17,courier:22})[delivery]??0;
    const order={id,owner:owner(),status:'pending',expiresAt,items,delivery,deliveryPrice,total:items.reduce((sum,p)=>sum+Math.round(p.price*100),0)+deliveryPrice*100};
    current.orders[id]=order;
    ids.forEach(id=>current.inventory[id]={status:'reserved',orderId:order.id,expiresAt});
    write(STATE_KEY,current);sessionStorage.setItem('aria-current-order',id);notify();return order;
  });
  const order = () => {const o=state().orders[sessionStorage.getItem('aria-current-order')];return o?.owner===owner()?o:null;};
  const finish = outcome => locked(() => {
    const current=state();const id=sessionStorage.getItem('aria-current-order');const o=current.orders[id];
    if(!o || o.owner!==owner())throw new Error('Nie znaleziono rezerwacji.');
    if(o.status==='paid')return o;
    if(o.status!=='pending')throw new Error('Ta rezerwacja została już zakończona.');
    const expired=o.expiresAt<=Date.now();
    const valid=o.items.every(p=>current.inventory[p.id]?.orderId===id && rawProducts().some(raw=>raw.id===p.id&&raw.status==='available'));
    if(outcome==='paid' && !expired && valid){
      o.status='paid';o.items.forEach(p=>current.inventory[p.id]={status:'sold',orderId:id});
      write(CART_KEY,cart().filter(productId=>!o.items.some(p=>p.id===productId)));
    }else{
      o.status=expired?'expired':'cancelled';
      o.items.forEach(p=>{if(current.inventory[p.id]?.orderId===id)delete current.inventory[p.id];});
    }
    write(STATE_KEY,current);notify();
    if(outcome==='paid' && o.status!=='paid')throw new Error('Rezerwacja wygasła lub produkt nie jest już dostępny. Rozpocznij zamówienie ponownie.');
    return o;
  });
  const resetDemo = () => {localStorage.removeItem(STATE_KEY);sessionStorage.removeItem('aria-current-order');notify();};
  const fileToDataUrl = file => new Promise((resolve,reject)=>{
    if(!file){resolve('');return;}
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)){reject(new Error('Wybierz zdjęcie JPG, PNG lub WebP.'));return;}
    const url=URL.createObjectURL(file), img=new Image();
    img.onload=()=>{try{const scale=Math.min(1,1000/img.width);const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.84));}catch(error){reject(error);}finally{URL.revokeObjectURL(url);}};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Nie udało się odczytać zdjęcia.'));};img.src=url;
  });
  window.ARIA_SHOP_STORAGE={allProducts,rawProducts,customProducts,saveProduct,removeProduct,slugify,fileToDataUrl,cart,setCart,addToCart,favorites,toggleFavorite,reserve,order,finish,resetDemo};
  window.addEventListener('storage',notify);
})();
