
(function(){
  const ADMIN_KEY="iontech_admin_session_v1";
  const ADMIN_PASSWORD="CHANGE-ME-1234"; // DEMO ONLY. Replace with a real backend/authentication for production.

  function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function getOverrides(){return IONTECH.readOverrides();}
  function saveOverrides(o){localStorage.setItem(IONTECH.STORAGE,JSON.stringify(o));}
  function settings(){return IONTECH.readSettings();}
  function saveSettings(s){localStorage.setItem(IONTECH.SETTINGS,JSON.stringify(s));}

  function logged(){return sessionStorage.getItem(ADMIN_KEY)==="1";}
  function show(id,on){document.getElementById(id)?.classList.toggle("hidden",!on);}
  function init(){
    show("loginPanel",!logged()); show("adminPanel",logged());
    if(logged()) renderAdmin();
  }

  document.getElementById("loginForm")?.addEventListener("submit",e=>{
    e.preventDefault();
    const p=document.getElementById("adminPassword").value;
    if(p===ADMIN_PASSWORD){sessionStorage.setItem(ADMIN_KEY,"1");init();}
    else document.getElementById("loginError").textContent="Incorrect password.";
  });
  document.getElementById("logout")?.addEventListener("click",()=>{sessionStorage.removeItem(ADMIN_KEY);location.reload();});

  function renderAdmin(){
    const s=settings();
    document.getElementById("companyName").value=s.companyName||"IONTECH";
    document.getElementById("siteTitle").value=s.siteTitle||"IONTECH Professional Computing Catalog";
    document.getElementById("siteDescription").value=s.siteDescription||"Professional workstations and business computing products.";
    document.getElementById("productSearch").value="";
    renderRows();
  }

  function renderRows(){
    const q=(document.getElementById("productSearch").value||"").toLowerCase();
    const products=IONTECH.getProducts().filter(p=>(p.model+" "+p.sku+" "+p.category).toLowerCase().includes(q));
    document.getElementById("adminCount").textContent=`${products.length} products`;
    document.getElementById("adminRows").innerHTML=products.map(p=>`
      <div class="admin-row">
        <div><strong>${esc(p.model)}</strong><div class="small">${esc(p.sku)} · ${esc(p.category)}</div></div>
        <button class="btn btn-primary" data-edit="${esc(p.sku)}">Edit</button>
      </div>`).join("");
  }
  document.getElementById("productSearch")?.addEventListener("input",renderRows);

  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-edit]");
    if(b) editProduct(b.dataset.edit);
  });

  function editProduct(sku){
    const p=IONTECH.getProducts().find(x=>x.sku===sku); if(!p)return;
    const o=getOverrides();
    const current=o[sku]||{};
    document.getElementById("editPanel").classList.remove("hidden");
    document.getElementById("editSku").value=sku;
    document.getElementById("editModel").value=current.model||p.model;
    document.getElementById("editDescription").value=current.description||p.description;
    document.getElementById("editOnhand").value=current.onhandPrice||p.onhandPrice||"";
    document.getElementById("editOrder").value=current.orderBasisPrice||p.orderBasisPrice||"";
    document.getElementById("editQty").value=current.openQty||p.openQty||"";
    document.getElementById("editImage1").value="";
    document.getElementById("editImage2").value="";
    preview("preview1",current.image1||p.image1,"Image 1");
    preview("preview2",current.image2||p.image2,"Image 2");
    window.scrollTo({top:document.getElementById("editPanel").offsetTop-90,behavior:"smooth"});
  }
  function preview(id,src,label){
    document.getElementById(id).innerHTML=src?`<img src="${esc(src)}" alt="${esc(label)} preview">`:`<div class="placeholder">${esc(label)}<br>Not uploaded</div>`;
  }
  function readImage(file){
    return new Promise((resolve,reject)=>{
      if(!file)return resolve("");
      const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file);
    });
  }

  document.getElementById("editImage1")?.addEventListener("change",async e=>{const x=await readImage(e.target.files[0]);if(x)preview("preview1",x,"Image 1");});
  document.getElementById("editImage2")?.addEventListener("change",async e=>{const x=await readImage(e.target.files[0]);if(x)preview("preview2",x,"Image 2");});

  document.getElementById("saveProduct")?.addEventListener("click",async()=>{
    const sku=document.getElementById("editSku").value;
    const base=IONTECH.getProducts().find(x=>x.sku===sku);
    const o=getOverrides(); const old=o[sku]||{};
    const i1=await readImage(document.getElementById("editImage1").files[0]);
    const i2=await readImage(document.getElementById("editImage2").files[0]);
    o[sku]={
      ...old,
      model:document.getElementById("editModel").value.trim()||base.model,
      description:document.getElementById("editDescription").value.trim()||base.description,
      onhandPrice:document.getElementById("editOnhand").value.trim(),
      orderBasisPrice:document.getElementById("editOrder").value.trim(),
      openQty:document.getElementById("editQty").value.trim(),
      image1:i1||old.image1||base.image1||"",
      image2:i2||old.image2||base.image2||""
    };
    saveOverrides(o);
    document.getElementById("saveStatus").textContent="Saved in this browser.";
    setTimeout(()=>document.getElementById("saveStatus").textContent="",2500);
    renderRows();
  });

  document.getElementById("cancelEdit")?.addEventListener("click",()=>document.getElementById("editPanel").classList.add("hidden"));

  document.getElementById("saveSettings")?.addEventListener("click",()=>{
    const old=settings();
    saveSettings({
      ...old,
      companyName:document.getElementById("companyName").value.trim()||"IONTECH",
      siteTitle:document.getElementById("siteTitle").value.trim(),
      siteDescription:document.getElementById("siteDescription").value.trim()
    });
    document.getElementById("settingsStatus").textContent="Site settings saved in this browser.";
    IONTECH.applyBrand();
  });

  document.getElementById("logoFile")?.addEventListener("change",async e=>{
    const x=await readImage(e.target.files[0]); if(!x)return;
    const s=settings(); s.logo=x; saveSettings(s);
    preview("logoPreview",x,"Company logo");
    IONTECH.applyBrand();
  });

  document.getElementById("exportData")?.addEventListener("click",()=>{
    const payload={settings:settings(),overrides:getOverrides()};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="iontech-catalog-admin-backup.json";a.click();
  });
  document.getElementById("importData")?.addEventListener("change",()=>{
    const file=document.getElementById("importData").files[0];if(!file)return;
    const r=new FileReader();r.onload=()=>{
      try{
        const p=JSON.parse(r.result);
        if(p.settings)localStorage.setItem(IONTECH.SETTINGS,JSON.stringify(p.settings));
        if(p.overrides)localStorage.setItem(IONTECH.STORAGE,JSON.stringify(p.overrides));
        alert("Backup imported.");location.reload();
      }catch(e){alert("Invalid backup file.");}
    };r.readAsText(file);
  });

  window.addEventListener("DOMContentLoaded",init);
})();
