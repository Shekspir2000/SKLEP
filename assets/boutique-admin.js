(() => {
  const S=window.ARIA_SHOP_STORAGE,form=document.querySelector('#product-form'),message=document.querySelector('#admin-message'),preview=document.querySelector('#admin-preview');
  let editing=null;
  const backgrounds=window.ARIA_SHOP_BACKGROUNDS;
  const backdrop=document.querySelector('#editor-backdrop'),frame=document.querySelector('#editor-preview-frame');
  let selectedBackground=backgrounds[0],draft={front:'',back:''},side='front',uploadVersion={front:0,back:0};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const render=()=>{
    document.querySelector('#admin-list').innerHTML=S.allProducts().map(p=>`<article class="line-item"><img src="${esc(p.cover)}" alt=""><div><h3>${esc(p.name)}</h3><p>${esc(p.category)} · ${esc(p.size)} · ${p.price.toLocaleString('pl-PL')} zł</p><p>${({available:'Dostępne',reserved:'Zarezerwowane',sold:'Sprzedane'})[p.status]}</p></div><div class="admin-actions"><a class="icon-button" href="produkt.html?id=${encodeURIComponent(p.id)}" aria-label="Zobacz ${esc(p.name)}" title="Zobacz"><i data-lucide="eye"></i></a><button class="icon-button" data-edit="${esc(p.id)}" aria-label="Edytuj ${esc(p.name)}" title="Edytuj"><i data-lucide="pencil"></i></button><button class="icon-button" data-delete="${esc(p.id)}" aria-label="Usuń ${esc(p.name)}" title="Usuń"><i data-lucide="trash-2"></i></button></div></article>`).join('');window.lucide?.createIcons();
  };
  document.querySelector('#tile-options').innerHTML=backgrounds.map((bg,i)=>`<label class="tile-option"><input type="radio" name="cardBackground" value="${esc(bg.src)}" ${i===0?'checked':''}><span class="tile-swatch">${bg.src?`<img src="${esc(bg.src)}" alt="" loading="lazy">`:'<i data-lucide="image-off"></i>'}</span><span>${esc(bg.name)}</span></label>`).join('');
  const updatePreview=()=>{
    if(side==='back'&&!draft.back)side='front';
    if(selectedBackground.src)backdrop.src=selectedBackground.src;else backdrop.removeAttribute('src');
    backdrop.hidden=!selectedBackground.src;
    frame.classList.toggle('has-background',!!selectedBackground.src);
    frame.style.setProperty('--product-inset',`${selectedBackground.inset}%`);
    if(draft[side])preview.src=draft[side];else preview.removeAttribute('src');
    preview.hidden=!draft[side];
    document.querySelectorAll('[data-preview-side]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.previewSide===side));b.disabled=b.dataset.previewSide==='back'&&!draft.back;});
  };
  document.querySelector('#tile-options').onchange=e=>{selectedBackground=backgrounds.find(bg=>bg.src===e.target.value)||backgrounds[0];updatePreview();};
  document.querySelectorAll('[data-preview-side]').forEach(b=>b.onclick=()=>{side=b.dataset.previewSide;updatePreview();});
  for(const [field,view] of [['cover','front'],['back','back']])form.elements[field].onchange=async()=>{
    const version=++uploadVersion[view];
    try{
      const src=await S.fileToDataUrl(form.elements[field].files[0]);
      if(version!==uploadVersion[view])return;
      draft[view]=src||(view==='front'?editing?.cover:editing?.gallery?.[1])||'';
      side=view;updatePreview();message.textContent='';
    }catch(e){if(version===uploadVersion[view])message.textContent=e.message;}
  };
  form.onreset=()=>{editing=null;uploadVersion.front++;uploadVersion.back++;draft={front:'',back:''};side='front';selectedBackground=backgrounds[0];updatePreview();document.querySelector('#form-heading').textContent='Dodaj produkt';message.textContent='';};
  form.onsubmit=async e=>{
    e.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;
    try{
      const values=new FormData(form),name=String(values.get('name')).trim();
      const cover=await S.fileToDataUrl(form.elements.cover.files[0])||editing?.cover;
      if(!cover)throw new Error('Dodaj zdjęcie główne produktu.');
      const back=await S.fileToDataUrl(form.elements.back.files[0])||editing?.gallery?.[1];
      const p={id:editing?.id||`${S.slugify(name)}-${Date.now().toString(36)}`,name,category:values.get('category'),size:values.get('size').trim(),price:Number(values.get('price')),status:values.get('status'),cover,gallery:back?[cover,back]:[cover],description:values.get('description').trim(),material:values.get('material').trim()||'Do uzupełnienia',dimensions:values.get('dimensions').trim()||'Do uzupełnienia',note:editing?.note||'Produkt dodany testowo w tej przeglądarce.',createdAt:editing?.createdAt||Date.now()};
      p.cardBackground=selectedBackground.src;p.cardInset=selectedBackground.inset;
      S.saveProduct(p);form.reset();message.textContent='Produkt zapisany. Jest już widoczny w sklepie w tej przeglądarce.';render();
    }catch(error){message.textContent=error.name==='QuotaExceededError'?'Brak miejsca w pamięci przeglądarki. Usuń niepotrzebne produkty testowe.':error.message;}finally{button.disabled=false;}
  };
  document.querySelector('#admin-list').onclick=e=>{
    const edit=e.target.closest('[data-edit]'),remove=e.target.closest('[data-delete]');
    if(edit){editing=S.rawProducts().find(p=>p.id===edit.dataset.edit);uploadVersion.front++;uploadVersion.back++;for(const field of ['name','category','size','price','status','description','material','dimensions'])form.elements[field].value=editing[field]||'';form.elements.cover.value='';form.elements.back.value='';draft={front:editing.cover,back:editing.gallery?.[1]||''};side='front';selectedBackground=backgrounds.find(bg=>bg.src===(editing.cardBackground||''))||backgrounds[0];form.elements.cardBackground.value=selectedBackground.src;updatePreview();document.querySelector('#form-heading').textContent='Edytuj produkt';form.scrollIntoView({behavior:'smooth',block:'start'});message.textContent='';}
    if(remove && confirm('Usunąć ten produkt z wersji testowej?')){S.removeProduct(remove.dataset.delete);render();}
  };
  document.querySelector('#reset-demo').onclick=()=>{if(confirm('Przywrócić dostępność rzeczy sprzedanych lub zarezerwowanych przez symulację? Dodane produkty zostaną zachowane.')){S.resetDemo();render();}};
  window.addEventListener('shop-change',render);render();updatePreview();
})();
