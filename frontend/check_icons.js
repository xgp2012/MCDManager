var icons = Object.keys(require('@ant-design/icons-vue'));
var keywords = ['server', 'hdd', 'cluster', 'desktop', 'database', 'cloud', 'computer'];
var filtered = icons.filter(function(k) {
  var lower = k.toLowerCase();
  return keywords.some(function(kw) { return lower.indexOf(kw) >= 0; });
});
console.log(filtered.sort().join('\n'));