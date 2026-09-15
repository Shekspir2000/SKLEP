(() => {
  const S=window.ARIA_SHOP_STORAGE,form=document.querySelector('#product-form'),message=document.querySelector('#admin-message'),preview=document.querySelector('#admin-preview');
  let editing=null;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const render=()=>{
    document.querySelector('#admin-list').innerHTML=S.allProducts().map(p=>`<article class="line-item"><img src="${esc(p.cover)}" alt=""><div><h3>${esc(p.name)}</h3><p>${esc(p.category)} · ${esc(p.size)} · ${p.price.toLocaleString('pl-PL')} zł</p><p>${({available:'Dostępne',reserved:'Zarezerwowane',sold:'Sprzedane'})[p.status]}</p></div><div class="admin-actions"><a class="icon-button" href="produkt.html?id=${encodeURIComponent(p.id)}" aria-label="Zobacz ${esc(p.name)}" title="Zobacz"><i data-lucide="eye"></i></a><button class="icon-button" data-edit="${esc(p.id)}" aria-label="Edytuj ${esc(p.name)}" title="Edytuj"><i data-lucide="pencil"></i></button><button class="icon-button" data-delete="${esc(p.id)}" aria-label="Usuń ${esc(p.name)}" title="Usuń"><i data-lucide="trash-2"></i></button></div></article>`).join('');window.lucide?.createIcons();
  };
  form.elements.cover.onchange=async()=>{try{const src=await S.fileToDataUrl(form.elements.cover.files[0]);preview.src=src;preview.hidden=!src;}catch(e){message.textContent=e.message;}};
  form.onreset=()=>{editing=null;preview.hidden=true;document.querySelector('#form-heading').textContent='Dodaj produkt';message.textContent='';};
  form.onsubmit=async e=>{
    e.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;
    try{
      const values=new FormData(form),name=String(values.get('name')).trim();
      const cover=await S.fileToDataUrl(form.elements.cover.files[0])||editing?.cover;
      if(!cover)throw new Error('Dodaj zdjęcie główne produktu.');
      const back=await S.fileToDataUrl(form.elements.back.files[0])||editing?.gallery?.[1];
      const p={id:editing?.id||`${S.slugify(name)}-${Date.now().toString(36)}`,name,category:values.get('category'),size:values.get('size').trim(),price:Number(values.get('price')),status:values.get('status'),cover,gallery:back?[cover,back]:[cover],description:values.get('description').trim(),material:values.get('material').trim()||'Do uzupełnienia',dimensions:values.get('dimensions').trim()||'Do uzupełnienia',note:editing?.note||'Produkt dodany testowo w tej przeglądarce.',createdAt:editing?.createdAt||Date.now()};
      S.saveProduct(p);form.reset();message.textContent='Produkt zapisany. Jest już widoczny w sklepie w tej przeglądarce.';render();
    }catch(error){message.textContent=error.name==='QuotaExceededError'?'Brak miejsca w pamięci przeglądarki. Usuń niepotrzebne produkty testowe.':error.message;}finally{button.disabled=false;}
  };
  document.querySelector('#admin-list').onclick=e=>{
    const edit=e.target.closest('[data-edit]'),remove=e.target.closest('[data-delete]');
    if(edit){editing=S.rawProducts().find(p=>p.id===edit.dataset.edit);for(const field of ['name','category','size','price','status','description','material','dimensions'])form.elements[field].value=editing[field]||'';form.elements.cover.value='';form.elements.back.value='';preview.src=editing.cover;preview.hidden=false;document.querySelector('#form-heading').textContent='Edytuj produkt';form.scrollIntoView({behavior:'smooth',block:'start'});message.textContent='';}
    if(remove && confirm('Usunąć ten produkt z wersji testowej?')){S.removeProduct(remove.dataset.delete);render();}
  };
  document.querySelector('#reset-demo').onclick=()=>{if(confirm('Przywrócić dostępność rzeczy sprzedanych lub zarezerwowanych przez symulację? Dodane produkty zostaną zachowane.')){S.resetDemo();render();}};
  window.addEventListener('shop-change',render);render();
})();
