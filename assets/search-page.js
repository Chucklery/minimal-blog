(async function(){const r=document.getElementById("search-input"),s=document.getElementById("search-results");if(!r||!s)return;let i=[];try{const e=await fetch("/assets/search-index.json");if(!e.ok)throw new Error("Index not found");i=await e.json()}catch{s.innerHTML='<p class="search-error">Search index unavailable.</p>';return}function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function h(e){return`
    <article class="search-result">
      <h3 class="search-result-title">
        <a href="/posts/${t(e.slug)}.html">${t(e.title)}</a>
      </h3>
      <div class="search-result-meta">${t(e.date)}${e.tags.length?" \xB7 "+e.tags.map(t).join(", "):""}</div>
      <p class="search-result-desc">${t(e.description)}</p>
    </article>`}function o(e){if(!e.trim()){s.innerHTML='<p class="search-empty">Type to search...</p>';return}const l=e.toLowerCase(),a=i.filter(n=>n.title.toLowerCase().includes(l)||n.description.toLowerCase().includes(l)||n.tags&&n.tags.some(d=>d.toLowerCase().includes(l)));if(a.length===0){s.innerHTML=`<p class="search-empty">No results for "${t(e)}".</p>`;return}s.innerHTML=`<p class="search-count">${a.length} result${a.length>1?"s":""}</p>${a.map(h).join("")}`}let u;r.addEventListener("input",()=>{clearTimeout(u),u=setTimeout(()=>o(r.value),100)});const c=new URLSearchParams(location.search).get("q");c&&(r.value=c,o(c))})();
