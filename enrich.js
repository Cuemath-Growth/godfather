(async function() {
  var token = state.metaApi.token;
  var accounts = ['act_925205080936963','act_5215842511824318','act_888586384639855'];
  var idx = {};
  state.taggerData.forEach(function(c, i) {
    var n = (c['Ad name'] || c['ad name'] || '').toLowerCase().trim();
    if (n) idx[n] = i;
  });
  var matched = 0;
  var total = 0;
  for (var a = 0; a < accounts.length; a++) {
    var acct = accounts[a];
    console.log('Starting', acct);
    var url = 'https://graph.facebook.com/v21.0/' + acct + '/ads?fields=name,creative%7Bthumbnail_url,image_url,body,title%7D&limit=50&access_token=' + token;
    var page = 0;
    while (url && page < 30) {
      try {
        var resp = await fetch(url);
        var data = await resp.json();
        if (data.error) {
          console.log(acct, 'error:', data.error.message);
          break;
        }
        if (data.data && data.data.length > 0) {
          total += data.data.length;
          if (page % 5 === 0) console.log(acct, 'page', page, '- total so far:', total, 'matched:', matched);
          for (var j = 0; j < data.data.length; j++) {
            var ad = data.data[j];
            var key = (ad.name || '').toLowerCase().trim();
            var i = idx[key];
            if (i !== undefined && ad.creative) {
              state.taggerData[i].thumbnail_url = ad.creative.thumbnail_url || '';
              state.taggerData[i].image_url = ad.creative.image_url || '';
              if (ad.creative.body) state.taggerData[i].ad_body = ad.creative.body;
              if (ad.creative.title) state.taggerData[i].ad_title = ad.creative.title;
              matched++;
            }
          }
        }
        url = (data.paging && data.paging.next) ? data.paging.next : null;
        page++;
      } catch(e) {
        console.log(acct, 'fetch error:', e.message);
        break;
      }
    }
    console.log(acct, 'done -', page, 'pages');
  }
  saveTaggerData();
  console.log('DONE:', matched, 'enriched out of', total, 'API ads');
  showToast(matched + ' ads enriched with thumbnails + copy');
  if (typeof showTaggerResults === 'function') showTaggerResults();
})();
