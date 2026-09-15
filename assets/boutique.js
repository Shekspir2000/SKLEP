(() => {
  const S=window.ARIA_SHOP_STORAGE;
  const $=selector=>document.querySelector(selector);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const photo=value=>escape(/^(assets\/|uploads\/|data:image\/(jpeg|png|webp);base64,|https:\/\/)/.test(value||'')?value:'assets/collection/hero.webp');
  const icon=name=>`<i data-lucide="${name}"></i>`;
  const icons=()=>window.lucide?.createIcons();
  const money=value=>new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN',maximumFractionDigits:2}).format(value);
  const labels={available:'1 sztuka',reserved:'Zarezerwowane',sold:'Sprzedane'};
  const link=p=>`produkt.html?id=${encodeURIComponent(p.id)}`;
  const brand=`<a class="brand-lockup" href="sklep.html" aria-label="Ariańska Selection — sklep"><img src="assets/collection/mark.png" alt=""><span class="brand-name">ARIAŃSKA<small>SELECTION</small></span></a>`;
  const cats=['Marynarki','Kurtki i płaszcze','Sukienki','Swetry','Spodnie','Spódnice','Akcesoria'];
  const catLink=c=>`sklep.html?category=${encodeURIComponent(c)}#nowosci`;
  $('#site-header').innerHTML=`<div class="masthead"><button class="menu-button" id="menu-toggle" aria-expanded="false" aria-controls="mega-menu" aria-label="Menu">${icon('menu')}<span>Menu</span></button>${brand}<div class="header-tools"><button class="icon-button" data-open="search-dialog" aria-label="Szukaj" data-tip="Szukaj">${icon('search')}</button><button class="icon-button wishlist-header" data-open="favorites-dialog" aria-label="Ulubione" data-tip="Ulubione">${icon('heart')}<span class="count" id="favorite-count" hidden></span></button><button class="icon-button" data-open="cart-dialog" aria-label="Koszyk" data-tip="Koszyk">${icon('shopping-bag')}<span class="count" id="cart-count" hidden></span></button></div></div><nav class="category-nav" aria-label="Kategorie"><a href="sklep.html#nowosci">Nowości</a>${cats.map(c=>`<a href="${catLink(c)}">${c}</a>`).join('')}</nav><div id="mega-menu" class="mega-menu" hidden><nav aria-label="Sklep"><strong>SKLEP</strong><a href="sklep.html#nowosci">Nowości</a><a href="sklep.html#nowosci">Wszystkie ubrania</a><button class="text-button" data-open="favorites-dialog">Ulubione</button><a href="sklep.html?status=available#nowosci">Dostępne rzeczy</a></nav><nav aria-label="Wszystkie kategorie"><strong>KATEGORIE</strong>${cats.map(c=>`<a href="${catLink(c)}">${c}</a>`).join('')}</nav><nav aria-label="Ariańska"><strong>ARIAŃSKA</strong><a href="https://arianskaselection.pl/o-nas">O nas</a><a href="regulamin-sklepu.html">Jak kupować</a><a href="https://arianskaselection.pl/">Kontakt</a><a href="admin.html">Panel testowy</a></nav><div class="menu-feature"><img src="assets/collection/hero.webp" alt="Dodatki w Ariańskiej"><p>Dobre rzeczy<br>mają dłuższe<br>historie.</p></div></div>`;
  $('#site-footer').innerHTML=`<div class="footer-main">${brand}<nav class="footer-links" aria-label="Stopka"><a href="https://arianskaselection.pl/o-nas">O nas</a><a href="https://arianskaselection.pl/">Kontakt</a><a href="regulamin-sklepu.html">Dostawa i zwroty</a><a href="polityka-prywatnosci.html">Prywatność</a><a href="admin.html">Panel testowy</a></nav></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Ariańska Selection</span><span>Wersja testowa sklepu · bez rzeczywistych płatności</span></div>`;
  document.body.insertAdjacentHTML('beforeend',`<dialog id="search-dialog"><div class="dialog-heading"><h2>Znajdź swoją rzecz</h2><button class="icon-button" data-close aria-label="Zamknij">${icon('x')}</button></div><form class="search-form" id="search-form"><input type="search" name="q" aria-label="Szukaj produktu" placeholder="Nazwa, kategoria, kolor…"><button class="button primary" aria-label="Wyszukaj">${icon('search')}</button></form></dialog><dialog class="drawer" id="favorites-dialog"><div class="dialog-heading"><h2>Ulubione</h2><button class="icon-button" data-close aria-label="Zamknij">${icon('x')}</button></div><div id="favorites-content"></div></dialog><dialog class="drawer" id="cart-dialog"><div class="dialog-heading"><h2>Twój koszyk</h2><button class="icon-button" data-close aria-label="Zamknij">${icon('x')}</button></div><div id="cart-content"></div></dialog><div class="toast" role="status" id="toast" hidden></div>`);
  let toastTimer;
  const toast=text=>{const el=$('#toast');el.textContent=text;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3500);};
  const menuClose=()=>{$('#mega-menu').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');};
  $('#menu-toggle').onclick=()=>{const open=$('#mega-menu').hidden;$('#mega-menu').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')menuClose();});
  document.addEventListener('click',e=>{if(!e.target.closest('#site-header'))menuClose();});
  $('#search-form').onsubmit=e=>{e.preventDefault();const q=new FormData(e.target).get('q').trim();location.href=`sklep.html?q=${encodeURIComponent(q)}#nowosci`;};
  const lineItem=(p,action)=>`<article class="line-item"><a href="${link(p)}"><img src="${photo(p.cover)}" alt="${escape(p.name)}"></a><div><h3><a href="${link(p)}">${escape(p.name)}</a></h3><p>Rozmiar ${escape(p.size)} · ${money(p.price)}</p><p>${labels[p.status]||''}</p></div>${action?`<button class="icon-button" data-${action}="${escape(p.id)}" aria-label="Usuń ${escape(p.name)}">${icon('x')}</button>`:''}</article>`;
  function updateDrawers(){
    const products=S.allProducts(),cart=products.filter(p=>S.cart().includes(p.id)),favorites=products.filter(p=>S.favorites().includes(p.id));
    for(const [id,number] of [['cart-count',cart.length],['favorite-count',favorites.length]]){$('#'+id).textContent=number;$('#'+id).hidden=!number;}
    $('#favorites-content').innerHTML=favorites.length?favorites.map(p=>lineItem(p,'favorite')).join(''):'<div class="empty">Twoja lista czeka na pierwszą perełkę.</div>';
    $('#cart-content').innerHTML=cart.length?cart.map(p=>lineItem(p,'remove-cart')).join('')+`<div class="total-row"><span>Produkty</span><strong>${money(cart.reduce((sum,p)=>sum+p.price,0))}</strong></div><p class="test-note">Dodanie do koszyka nie rezerwuje rzeczy. Dostępność potwierdzimy przy rozpoczęciu zakupu testowego.</p><a class="button primary" href="sklep-zamowienie.html">Przejdź do zamówienia ${icon('arrow-right')}</a>`:'<div class="empty">Koszyk jest jeszcze pusty.<br>Znajdź coś dla siebie.</div><a class="button primary" href="sklep.html#nowosci">Odkryj nowości</a>';
    document.querySelectorAll('[data-favorite]').forEach(b=>b.setAttribute('aria-pressed',String(S.favorites().includes(b.dataset.favorite))));icons();
  }
  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-open]');if(open){menuClose();updateDrawers();$('#'+open.dataset.open).showModal();}
    const close=e.target.closest('[data-close]');if(close)close.closest('dialog').close();
    const favorite=e.target.closest('[data-favorite]');if(favorite)try{S.toggleFavorite(favorite.dataset.favorite);}catch{toast('Nie udało się zapisać ulubionych.');}
    const remove=e.target.closest('[data-remove-cart]');if(remove)S.setCart(S.cart().filter(id=>id!==remove.dataset.removeCart));
    const add=e.target.closest('[data-add-cart]');if(add)try{S.addToCart(add.dataset.addCart);toast('Dodano do koszyka. Jedna, wyjątkowa sztuka.');}catch(error){toast(error.message);}
  });
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}}));
  const params=new URLSearchParams(location.search);
  let renderPage=()=>{};
  if(document.body.dataset.page==='shop'){
    const turnedProducts=new Set();
    const cardMedia=p=>{
      if(p.cardBackground && !(p.gallery?.length>1))return `<img class="product-backdrop" src="${photo(p.cardBackground)}" alt="" loading="lazy"><a class="product-layer-single" href="${link(p)}"><img src="${photo(p.cover)}" alt="${escape(p.name)}" loading="lazy"></a>`;
      if(p.cardBackground && p.gallery?.length>1){
        const back=turnedProducts.has(p.id);
        return `<img class="product-backdrop" src="${photo(p.cardBackground)}" alt="" loading="lazy"><button type="button" class="product-turn" data-turn="${escape(p.id)}" aria-pressed="${back}" aria-label="Pokaż ${back?'przód':'tył'}: ${escape(p.name)}" title="Przód / tył"><img class="product-front" src="${photo(p.gallery[0])}" alt="${escape(p.name)} — przód" aria-hidden="${back}" loading="lazy"><img class="product-back" src="${photo(p.gallery[1])}" alt="${escape(p.name)} — tył" aria-hidden="${!back}" loading="lazy"><span class="turn-indicator" aria-hidden="true">${icon('rotate-3d')}</span></button>`;
      }
      return `<a href="${link(p)}"><img src="${photo(p.cover)}" alt="${escape(p.name)}" loading="lazy"></a>${p.gallery?.length>1?`<button class="photo-flip" data-flip="${escape(p.id)}" aria-label="Pokaż tył: ${escape(p.name)}" title="Przód / tył">${icon('rotate-3d')}</button>`:''}`;
    };
    const categories=[...new Set([...cats,...S.allProducts().map(p=>p.category)])];
    $('#category').innerHTML='<option value="all">Wszystkie kategorie</option>'+categories.map(c=>`<option>${escape(c)}</option>`).join('');
    $('#size').innerHTML='<option value="all">Wszystkie rozmiary</option>'+[...new Set(S.allProducts().map(p=>p.size))].map(s=>`<option>${escape(s)}</option>`).join('');
    if(categories.includes(params.get('category')))$('#category').value=params.get('category');
    if(['available','reserved','sold'].includes(params.get('status')))$('#status').value=params.get('status');
    let query=params.get('q')||'';
    $('#filter-toggle').onclick=()=>{const open=$('#filters').hidden;$('#filters').hidden=!open;$('#filter-toggle').setAttribute('aria-expanded',String(open));};
    renderPage=()=>{
      const cat=$('#category').value,size=$('#size').value,status=$('#status').value;
      let products=S.allProducts().filter(p=>(cat==='all'||p.category===cat)&&(size==='all'||p.size===size)&&(status==='all'||p.status===status)&&(!query||`${p.name} ${p.category} ${p.description}`.toLocaleLowerCase('pl').includes(query.toLocaleLowerCase('pl'))));
      const order=$('#sort').value;
      products.sort((a,b)=>order==='low'?a.price-b.price:order==='high'?b.price-a.price:order==='name'?a.name.localeCompare(b.name,'pl'):(b.createdAt||0)-(a.createdAt||0));
      $('#catalog-heading').textContent=cat==='all'?'Nowości':cat;
      $('#product-count').textContent=`${products.length} / ${S.allProducts().length}`;
      $('#active-search').hidden=!query;$('#active-search').innerHTML=`Wyniki dla: <strong>${escape(query)}</strong> <button class="text-button" id="clear-query">Wyczyść</button>`;
      $('#clear-query').onclick=()=>{query='';renderPage();};
      $('#product-grid').innerHTML=products.length?products.map(p=>`<article class="product-card"><div class="product-media ${p.cardBackground?'product-media-layered':''}" style="--product-inset:${Number.isFinite(p.cardInset)?Math.max(0,Math.min(35,p.cardInset)):8}%">${cardMedia(p)}<span class="stock-tag ${p.status}">${labels[p.status]}</span><button class="icon-button" data-favorite="${escape(p.id)}" aria-label="Ulubione: ${escape(p.name)}" aria-pressed="${S.favorites().includes(p.id)}">${icon('heart')}</button></div><div class="product-info"><h3><a href="${link(p)}">${escape(p.name)}</a></h3><p>${escape(p.category)} · Rozmiar ${escape(p.size)}</p><strong>${money(p.price)}</strong></div></article>`).join(''):'<div class="empty"><h2>Jeszcze nie ma tu Twojej rzeczy</h2><p>Zmień filtry i zajrzyj do pozostałych nowości.</p><button class="text-button" id="reset-empty">Pokaż wszystkie rzeczy</button></div>';
      $('#reset-empty')?.addEventListener('click',clear);icons();
    };
    const clear=()=>{$('#category').value=$('#size').value=$('#status').value='all';query='';renderPage();};
    $('#clear-filters').onclick=clear;
    ['#category','#size','#status','#sort'].forEach(s=>$(s).onchange=renderPage);
    $('#product-grid').onclick=e=>{
      const turn=e.target.closest('[data-turn]');
      if(turn){
        const p=S.allProducts().find(p=>p.id===turn.dataset.turn);if(!p)return;
        const back=!turnedProducts.has(p.id);
        if(back)turnedProducts.add(p.id);else turnedProducts.delete(p.id);
        turn.setAttribute('aria-pressed',String(back));
        turn.setAttribute('aria-label',`Pokaż ${back?'przód':'tył'}: ${p.name}`);
        turn.querySelector('.product-front').setAttribute('aria-hidden',String(back));
        turn.querySelector('.product-back').setAttribute('aria-hidden',String(!back));
        return;
      }
      const b=e.target.closest('[data-flip]');if(!b)return;const p=S.allProducts().find(p=>p.id===b.dataset.flip);const img=b.closest('.product-media').querySelector('img');const back=b.dataset.back!=='true';b.dataset.back=String(back);img.src=p.gallery[back?1:0];img.alt=p.name+(back?' — tył':' — przód');b.setAttribute('aria-label',`Pokaż ${back?'przód':'tył'}: ${p.name}`);
    };
  }
  if(document.body.dataset.page==='product'){
    let selected=0;
    renderPage=()=>{
      const p=S.allProducts().find(p=>p.id===params.get('id'));
      if(!p){$('#product-view').innerHTML='<div class="empty"><h1>Nie znaleźliśmy tej rzeczy</h1><a class="button primary" href="sklep.html">Wróć do sklepu</a></div>';return;}
      document.title=`${p.name} | Ariańska Selection`;const gallery=p.gallery?.length?p.gallery:[p.cover];selected=Math.min(selected,gallery.length-1);
      $('#product-view').innerHTML=`<nav class="breadcrumbs"><a href="sklep.html">Sklep</a> / <a href="${catLink(p.category)}">${escape(p.category)}</a> / ${escape(p.name)}</nav><section class="product-detail"><div><img class="main-photo" src="${photo(gallery[selected])}" alt="${escape(p.name)}${selected?' — tył':''}"><div class="thumbnails">${gallery.map((src,i)=>`<button data-gallery="${i}" aria-label="Zdjęcie ${i+1}" aria-pressed="${i===selected}"><img src="${photo(src)}" alt=""></button>`).join('')}</div></div><article class="product-summary"><p class="eyebrow">${escape(p.category)}</p><h1>${escape(p.name)}</h1><span class="status-label">${labels[p.status]}${p.status==='available'?' · wybrana dla Ciebie':''}</span><strong class="price">${money(p.price)}</strong><p>${escape(p.description)}</p><dl><div><dt>Rozmiar</dt><dd>${escape(p.size)}</dd></div><div><dt>Wymiary</dt><dd>${escape(p.dimensions)}</dd></div><div><dt>Materiał</dt><dd>${escape(p.material)}</dd></div><div><dt>Ilość</dt><dd>Jeden egzemplarz</dd></div></dl><div class="product-action-row"><button class="button primary" data-add-cart="${escape(p.id)}" ${p.status!=='available'?'disabled':''}>${p.status==='available'?'Dodaj do koszyka':labels[p.status]} ${icon('shopping-bag')}</button><button class="icon-button" data-favorite="${escape(p.id)}" aria-label="Dodaj do ulubionych" aria-pressed="${S.favorites().includes(p.id)}">${icon('heart')}</button></div><details><summary>Dostawa i odbiór</summary><p>Odbiór w butiku przy Ariańskiej 18/1 w Krakowie. W wersji testowej sprawdzisz również wybór paczkomatu i kuriera.</p></details><details><summary>Jedyna sztuka</summary><p>To jeden konkretny egzemplarz. Dodanie do koszyka nie rezerwuje produktu. Dostępność sprawdzana jest ponownie przy zamówieniu.</p></details><p class="test-note">${escape(p.note)}</p></article></section>`;
      document.querySelectorAll('[data-gallery]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.gallery);renderPage();});icons();
    };
  }
  if(document.body.dataset.page==='checkout'){
    renderPage=()=>{
      const root=$('#checkout-view'),o=S.order();
      if(o?.status==='paid' && params.get('order')===o.id){
        root.innerHTML=`<section class="success">${icon('circle-check')}<p class="eyebrow">Zakup testowy zakończony</p><h2>Ta historia ma ciąg dalszy</h2><p>Wybrane rzeczy mają teraz status „Sprzedane” w tej przeglądarce. Nie można kupić ich ponownie. Nie pobraliśmy pieniędzy.</p>${o.items.map(p=>lineItem({...p,status:'sold'})).join('')}<a class="button primary" href="sklep.html#nowosci">Wróć do sklepu ${icon('arrow-right')}</a></section>`;icons();return;
      }
      if(o?.status==='pending' && o.expiresAt>Date.now()){
        root.innerHTML=`<div class="checkout-layout"><section><h2>Rzeczy czekają na Ciebie</h2><p>Rezerwacja testowa: <span class="timer" id="reservation-timer"></span></p><p>Wybierz wynik symulacji płatności.</p><div class="payment-actions"><button class="button primary" id="pay-demo">Symuluj udaną płatność</button><button class="button outline" id="cancel-demo">Anuluj płatność</button></div><p class="test-note">To symulacja w tej przeglądarce. Nie łączymy się z Przelewy24.</p></section><aside class="checkout-summary">${o.items.map(p=>lineItem({...p,status:'reserved'})).join('')}<div class="total-row"><span>Dostawa</span><strong>${money(o.deliveryPrice)}</strong></div><div class="total-row"><span>Razem</span><strong>${money(o.total/100)}</strong></div></aside></div>`;
        $('#pay-demo').onclick=async()=>{try{params.set('order',o.id);history.replaceState(null,'',`sklep-zamowienie.html?order=${encodeURIComponent(o.id)}`);await S.finish('paid');renderPage();}catch(error){toast(error.message);renderPage();}};
        $('#cancel-demo').onclick=async()=>{try{await S.finish('cancelled');renderPage();toast('Rezerwacja zwolniona.');}catch(error){toast(error.message);}};icons();timer();return;
      }
      const ids=params.has('id')?[params.get('id')]:S.cart();
      const products=ids.map(id=>S.allProducts().find(p=>p.id===id)).filter(Boolean);
      if(!products.length){root.innerHTML='<div class="empty"><h2>Twój koszyk jest pusty</h2><a class="button primary" href="sklep.html#nowosci">Odkryj nowości</a></div>';return;}
      const unavailable=products.some(p=>p.status!=='available');
      root.innerHTML=`<form class="checkout-layout" id="checkout-form"><section><h2>Odbiór i dostawa</h2><fieldset class="delivery-options"><legend class="sr-only">Metoda dostawy</legend><label><input type="radio" name="delivery" value="pickup" checked>Odbiór w butiku · bezpłatnie</label><label><input type="radio" name="delivery" value="locker">Paczkomat · 17 zł</label><label><input type="radio" name="delivery" value="courier">Kurier · 22 zł</label></fieldset><label class="consent"><input type="checkbox" required><span>Rozumiem, że to zakup testowy, bez pobrania pieniędzy. <a href="regulamin-sklepu.html">Regulamin sklepu</a></span></label><p class="test-note">Każda rzecz ma jeden egzemplarz. Rozpoczęcie symulacji rezerwuje ją na 15 minut w tej przeglądarce.</p>${unavailable?'<p role="alert">Część rzeczy jest niedostępna. Usuń je z koszyka, aby kontynuować.</p>':''}<button class="button primary" type="submit" ${unavailable?'disabled':''}>Rozpocznij zakup testowy ${icon('arrow-right')}</button></section><aside class="checkout-summary"><h2>Twoje rzeczy</h2>${products.map(p=>lineItem(p,params.has('id')?null:'remove-cart')).join('')}<div class="total-row"><span>Dostawa</span><strong id="delivery-total">0 zł</strong></div><div class="total-row"><span>Razem</span><strong id="checkout-total">${money(products.reduce((sum,p)=>sum+p.price,0))}</strong></div></aside></form>`;
      $('#checkout-form').onchange=()=>{const fee=({pickup:0,locker:17,courier:22})[$('input[name=delivery]:checked').value];$('#delivery-total').textContent=money(fee);$('#checkout-total').textContent=money(products.reduce((sum,p)=>sum+p.price,0)+fee);};
      $('#checkout-form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button[type=submit]');button.disabled=true;try{await S.reserve(ids,new FormData(e.target).get('delivery'));renderPage();}catch(error){toast(error.message);renderPage();}};icons();
    };
    const timer=()=>{const el=$('#reservation-timer'),o=S.order();if(!el||!o)return;const seconds=Math.max(0,Math.ceil((o.expiresAt-Date.now())/1000));el.textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;if(!seconds)renderPage();};
    setInterval(timer,1000);
  }
  window.addEventListener('shop-change',()=>{updateDrawers();renderPage();});
  window.addEventListener('pageshow',()=>{updateDrawers();renderPage();});
  window.addEventListener('focus',()=>{updateDrawers();renderPage();});
  setInterval(()=>{if(document.visibilityState==='visible'){updateDrawers();if(document.body.dataset.page!=='checkout')renderPage();}},30000);
  updateDrawers();renderPage();icons();
})();
