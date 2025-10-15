(function(){
  // 将<img src>替换成data-src并添加loading=lazy
  function prepareLazyImages(){
    document.querySelectorAll('img').forEach(function(img){
      if (img.dataset.processed) return;
      var src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      if (!img.getAttribute('loading')) img.setAttribute('loading','lazy');
      img.setAttribute('data-src', src);
      img.removeAttribute('src');
      img.dataset.processed = '1';
    });
  }

  function toWebp(url){
    try{
      if (!/\.(png|jpe?g)$/i.test(url)) return url; 
      return url + '.webp';
    }catch(e){return url}
  }

  function swapInView(entries, observer){
    entries.forEach(function(entry){
      if (!entry.isIntersecting) return;
      var img = entry.target;
      var url = img.getAttribute('data-src');
      if (!url) return observer.unobserve(img);
      var webp = toWebp(url);
      var test = new Image();
      var done = function(finalUrl){ img.src = finalUrl; observer.unobserve(img); };
      test.onload = function(){ done(webp); };
      test.onerror = function(){ done(url); };
      test.src = webp;
    });
  }

  function init(){
    prepareLazyImages();
    var io = new IntersectionObserver(swapInView, {rootMargin:'200px'});
    document.querySelectorAll('img[data-src]').forEach(function(img){ io.observe(img); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
