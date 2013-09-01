
// allow printing of functions
// modified from http://www.sitepoint.com/javascript-json-serialization/
var jsonStringify =  function (obj, indentedTimes) { 
    if (!indentedTimes) indentedTimes = 0; 
    var indentPrefix = "";
    var indentOneMorePrefix =  "";
    var indentSpaces = 4;

    for (var i = 0; i < indentSpaces * indentedTimes; i ++) {
        indentPrefix += " "; 
    } 
    indentOneMorePrefix = indentPrefix;
    for (var i = 0; i < indentSpaces; i ++) {
        indentOneMorePrefix += " "; 
    } 

    var t = typeof (obj);
    if (t != "object" || obj === null) {
        // simple data type
        if (t == "string") obj = '"'+obj+'"';
        return String(obj);
    }
    else {
        // recurse array or object
        var n, v, json = [], arr = (obj && obj.constructor == Array);
        for (n in obj) {
            v = obj[n]; t = typeof(v);
            if (t == "string") v = '"'+v+'"';
            else if (t == "object" && v !== null) v = jsonStringify(v, ++ indentedTimes);
            json.push((arr ? "" : '' + n + ' : ') + String(v));
        }
        var string = "";
        for(var i = 0, j = json.length; i < j; i++) {
            string +=  ( string ? ",\n" + indentOneMorePrefix + json[i] : indentOneMorePrefix + json[i] ) ; 
        }
        return  (arr ? "[\n" : "{\n") + string + "\n" + indentPrefix + (arr ? "]" : "}");
    }
};

var fixCase = function(name, style) {
    if (typeof name != "string") return "";

    if (style == "class") {
        return name.substr(0,1).toUpperCase() + name.substr(1);
    }
    if (style == "instance") {
        return name.substr(0,1).toLowerCase() + name.substr(1);
    }
};


// http://lions-mark.com/jquery/scrollTo/
$.fn.scrollTo = function( target, options, callback ){
  if(typeof options == 'function' && arguments.length == 2){ callback = options; options = target; }
  var settings = $.extend({
    scrollTarget  : target,
    offsetTop     : 50,
    duration      : 500,
    easing        : 'swing'
  }, options);
  return this.each(function(){
    var scrollPane = $(this);
    var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
    var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
    scrollPane.animate({scrollTop : scrollY }, parseInt(settings.duration), settings.easing, function(){
      if (typeof callback == 'function') { callback.call(this); }
    });
  });
}

$.fn.selectAll = function(){ 
    this.focus();
    this.select();
    try { // only works on ie
        var r = this[0].createTextRange();
        r.execCommand("Copy");
    }
    catch (e) {}
    return this;
}
