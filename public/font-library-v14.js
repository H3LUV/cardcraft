(function cardcraftFontLibraryV14(){
  'use strict';

  const GROUPS=[
    ['한글 · 고딕/산세리프',[
      'Noto Sans KR','IBM Plex Sans KR','Nanum Gothic','Gowun Dodum','Pretendard',
      'Black Han Sans','Do Hyeon','Jua','Sunflower','Stylish','Gugi'
    ]],
    ['한글 · 명조/세리프',[
      'Noto Serif KR','Nanum Myeongjo','Gowun Batang','Hahmlet','Song Myung'
    ]],
    ['한글 · 손글씨/개성체',[
      'Gamja Flower','Gaegu','Poor Story','Single Day','East Sea Dokdo','Dokdo',
      'Hi Melody','Yeon Sung','Cute Font','Kirang Haerang','Nanum Pen Script','Nanum Brush Script'
    ]],
    ['영문 · 산세리프',[
      'Montserrat','Poppins','Raleway','Oswald','Space Grotesk','Inter','Roboto','Open Sans','Lato',
      'Work Sans','Manrope','Outfit','Urbanist','Archivo','Barlow','Barlow Condensed','Josefin Sans'
    ]],
    ['영문 · 세리프/클래식',[
      'Playfair Display','Cormorant Garamond','Bodoni Moda','DM Serif Display','Libre Baskerville',
      'Merriweather','Lora','EB Garamond','Prata','Marcellus','Libre Bodoni','Cormorant'
    ]],
    ['영문 · 디스플레이/강조',[
      'Cinzel','Bebas Neue','Anton','Abril Fatface','Fjalla One','Alfa Slab One','Righteous'
    ]]
  ];

  const GOOGLE=new Set([
    'Noto Sans KR','IBM Plex Sans KR','Nanum Gothic','Gowun Dodum','Black Han Sans','Do Hyeon','Jua','Sunflower','Stylish','Gugi',
    'Noto Serif KR','Nanum Myeongjo','Gowun Batang','Hahmlet','Song Myung','Gamja Flower','Gaegu','Poor Story','Single Day',
    'East Sea Dokdo','Dokdo','Hi Melody','Yeon Sung','Cute Font','Kirang Haerang','Nanum Pen Script','Nanum Brush Script',
    'Montserrat','Poppins','Raleway','Oswald','Space Grotesk','Inter','Roboto','Open Sans','Lato','Work Sans','Manrope','Outfit',
    'Urbanist','Archivo','Barlow','Barlow Condensed','Josefin Sans','Playfair Display','Cormorant Garamond','Bodoni Moda',
    'DM Serif Display','Libre Baskerville','Merriweather','Lora','EB Garamond','Prata','Marcellus','Libre Bodoni','Cormorant',
    'Cinzel','Bebas Neue','Anton','Abril Fatface','Fjalla One','Alfa Slab One','Righteous'
  ]);

  const loaded=new Set();
  const familyParam=name=>name.trim().replace(/ /g,'+');

  function ensureFont(name){
    if(!name||loaded.has(name))return;
    if(name==='Pretendard'){
      if(!document.getElementById('cc-font-pretendard')){
        const l=document.createElement('link');
        l.id='cc-font-pretendard';l.rel='stylesheet';
        l.href='https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css';
        document.head.appendChild(l);
      }
      loaded.add(name);return;
    }
    if(!GOOGLE.has(name))return;
    const id='cc-font-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    if(document.getElementById(id)){loaded.add(name);return;}
    const l=document.createElement('link');
    l.id=id;l.rel='stylesheet';
    l.href=`https://fonts.googleapis.com/css2?family=${familyParam(name)}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap`;
    l.onerror=()=>{
      // Some display families expose fewer axes/weights. Retry with family-only CSS.
      if(l.dataset.retried)return;
      l.dataset.retried='1';
      l.href=`https://fonts.googleapis.com/css2?family=${familyParam(name)}&display=swap`;
    };
    document.head.appendChild(l);
    loaded.add(name);
  }

  function rebuildSelect(select){
    if(!select||select.dataset.fontLibraryV14==='1')return;
    const current=select.value;
    select.innerHTML='';
    const base=document.createElement('option');base.value='';base.textContent='템플릿 기본';select.appendChild(base);
    GROUPS.forEach(([label,names])=>{
      const group=document.createElement('optgroup');group.label=label;
      names.forEach(name=>{
        const o=document.createElement('option');o.value=name;o.textContent=name;
        group.appendChild(o);
      });
      select.appendChild(group);
    });
    if(current){select.value=current;ensureFont(current);}
    select.dataset.fontLibraryV14='1';
  }

  function hydrate(){
    document.querySelectorAll('[data-style-font]').forEach(rebuildSelect);
  }

  document.addEventListener('change',e=>{
    const select=e.target.closest&&e.target.closest('[data-style-font]');
    if(!select)return;
    ensureFont(select.value);
    if(document.fonts&&select.value){
      document.fonts.load(`16px "${select.value}"`).then(()=>{
        if(typeof renderDynamic==='function')renderDynamic();
        if(typeof renderVariants==='function')renderVariants();
      }).catch(()=>{});
    }
  },true);

  const observer=new MutationObserver(hydrate);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hydrate,{once:true});else hydrate();
  console.info('Cardcraft expanded font library V14 active');
})();
