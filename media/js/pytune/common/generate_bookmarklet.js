PYTUNE.generate_bookmarklet = function() {
    var href = "javascript:function pytune_bookmarklet() { var d=document,z=d.createElement('scr'+'ipt'),b=d.body,l=d.location; try{ if(!b) { throw(0); } d.title = '(Sharing...) ' + d.title; z.setAttribute('src','https://"+PYTUNE.URLs['domain']+"/api/add_site_load_script/"+PYTUNE.Globals['secret_token']+"?url='+encodeURIComponent(l.href)+'&time='+(new Date().getTime())); b.appendChild(z); } catch(e) {alert('Please wait until the page has loaded.');}}pytune_bookmarklet();void(0)";
    
    var $bookmarklet = $.make('a', { 
        className: 'NB-goodies-bookmarklet-button',
        href: href
    }, 'Share on PyTune');
    
    return $bookmarklet;
};