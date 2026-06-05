(async function(){const a=document.getElementById("search-input"),s=document.getElementById("search-results");if(!a||!s)return;const i=location.pathname.replace(/\/search\/.*$/,"");let o=[];try{const e=await fetch(`${i}/assets/search-index.json`);if(!e.ok)throw new Error("Index not found");o=await e.json()}catch{s.innerHTML='<p class="search-error">Search index unavailable.</p>';return}function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function p(e){return`
    <article class="search-result">
      <h3 class="search-result-title">
        <a href="${i}/posts/${t(e.slug)}.html">${t(e.title)}</a>
      </h3>
      <div class="search-result-meta">${t(e.date)}${e.tags.length?" \xB7 "+e.tags.map(t).join(", "):""}</div>
      <p class="search-result-desc">${t(e.description)}</p>
    </article>`}function u(e){if(!e.trim()){s.innerHTML='<p class="search-empty">Type to search...</p>';return}const l=e.toLowerCase(),r=o.filter(n=>n.title.toLowerCase().includes(l)||n.description.toLowerCase().includes(l)||n.tags&&n.tags.some(d=>d.toLowerCase().includes(l)));if(r.length===0){s.innerHTML=`<p class="search-empty">No results for "${t(e)}".</p>`;return}s.innerHTML=`<p class="search-count">${r.length} result${r.length>1?"s":""}</p>${r.map(p).join("")}`}let h;a.addEventListener("input",()=>{clearTimeout(h),h=setTimeout(()=>u(a.value),100)});const c=new URLSearchParams(location.search).get("q");c&&(a.value=c,u(c))})();
