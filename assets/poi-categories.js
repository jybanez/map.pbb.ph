import { poiName, poiNameExpression } from './poi-name.js?v=20261012-personal-ui3';

// Category keys retain exact source strings; empty/missing/nonstring values share Unspecified.
export const categoryValue = value => typeof value === 'string' && value.trim() ? value : '';
export const categoryExpression = key => {
  const value=['string',['get',key],''];
  const blank=['all',['==',['to-number',['concat','1',value],-1],1],['==',['to-number',['concat',value,'1'],-1],1]];
  return ['case',blank,'',value];
};
export const categoryKey = (group, child) => JSON.stringify([group, child]);
// Display only: never use formatted labels as category keys or predicates.
const CATEGORY_ACRONYMS = new Set(['atm','bbq','bmx','diy','ev','ngo','it','wc']);
export const categoryLabel = value => value ? value.replace(/_/g,' ').replace(/\S+/gu,word=>{
  if(CATEGORY_ACRONYMS.has(word.toLowerCase()))return word.toUpperCase();
  return word.replace(/^\p{L}/u,letter=>letter.toUpperCase());
}) : 'Unspecified';
export function eligiblePoi(properties, excluded) {
  return !!poiName(properties) && !['class','subclass','type'].some(key =>
    excluded.includes(String(properties?.[key] ?? '').toLowerCase()));
}
export function eligibilityExpression(excluded) {
  return ['all', ['!=', poiNameExpression(), ''], ...['class','type','subclass'].map(key =>
    ['!', ['in', ['downcase', ['to-string', ['coalesce', ['get', key], '']]], ['literal', excluded]]])];
}
export const CLASS_COLORS = ['#f4b43d','#56c8ed','#ec91bd','#9ed870','#c3a5ff','#ff966b','#64d5b9','#e4cd64','#a0bde9','#db9ee0','#b8ce8b','#f2a5a5'];
export function classColor(value) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0;
  return CLASS_COLORS[hash % CLASS_COLORS.length];
}
export function createPoiCategories(excluded) {
  const classChoices = new Map(), childChoices = new Map();
  let defaultVisible = true, masterVisible = true;
  const selected = (group,child) => childChoices.get(categoryKey(group,child)) ?? classChoices.get(group) ?? defaultVisible;
  function setClass(group, visible) {
    classChoices.set(group,!!visible);
    for (const key of childChoices.keys()) if (JSON.parse(key)[0]===group) childChoices.delete(key);
  }
  function setChild(group,child,visible) { childChoices.set(categoryKey(group,child),!!visible); }
  function setAll(visible) {defaultVisible=!!visible;classChoices.clear();childChoices.clear();}
  function visible(properties) {
    return masterVisible && eligiblePoi(properties,excluded) && selected(categoryValue(properties?.class),categoryValue(properties?.subclass));
  }
  function count(features) {
    const groups = new Map(), seen = new Set();
    for (const f of features) {
      const p=f.properties||{},coords=f.geometry?.coordinates;
      if(f.geometry?.type!=='Point'||!eligiblePoi(p,excluded)||!Number.isFinite(coords?.[0])||!Number.isFinite(coords?.[1]))continue;
      const group=categoryValue(p.class),child=categoryValue(p.subclass),name=poiName(p);
      // Approximate loaded-tile de-duplication; no stable upstream IDs are assumed.
      const key=JSON.stringify([name,group,child,coords[0].toFixed(5),coords[1].toFixed(5)]);
      if(seen.has(key))continue;seen.add(key);
      if(!groups.has(group))groups.set(group,new Map());const children=groups.get(group);children.set(child,(children.get(child)||0)+1);
    }
    return [...groups].sort(([a],[b])=>categoryLabel(a).localeCompare(categoryLabel(b))).map(([group,children])=>{
      const rows=[...children].sort(([a],[b])=>categoryLabel(a).localeCompare(categoryLabel(b))).map(([child,count])=>({id:'child:'+categoryKey(group,child),group,child,label:categoryLabel(child),count,checked:selected(group,child),color:classColor(group)}));
      return {id:'class:'+JSON.stringify(group),group,label:categoryLabel(group),count:rows.reduce((n,r)=>n+r.count,0),checked:rows.every(r=>r.checked),mixed:rows.some(r=>r.checked)&&rows.some(r=>!r.checked),color:classColor(group),children:rows};
    });
  }
  function expression() {
    const groupExpr=categoryExpression('class'),childExpr=categoryExpression('subclass');
    const cases=[];
    for(const [key,value] of childChoices){const [group,child]=JSON.parse(key);cases.push(['all',['==',groupExpr,group],['==',childExpr,child]],value);}
    for(const [group,value] of classChoices)cases.push(['==',groupExpr,group],value);
    const category=cases.length?['case',...cases,defaultVisible]:defaultVisible;
    return ['all',eligibilityExpression(excluded),masterVisible,category];
  }
  function colorExpression(groups) {return groups.length?['match',categoryExpression('class'),...groups.flatMap(row=>[row.group,row.color]),classColor('')]:classColor('');}
  return {count,visible,expression,colorExpression,setClass,setChild,setAll,selected,setMaster(value){masterVisible=!!value;},getMaster(){return masterVisible;}};
}
