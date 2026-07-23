import * as Icons from '@ant-design/icons-vue';
const names = Object.keys(Icons).filter(k => k.endsWith('Outlined')).sort();
console.log(names.join('\n'));