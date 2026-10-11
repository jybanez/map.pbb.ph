import test from 'node:test';
import assert from 'node:assert/strict';
import {createPoiCategories,classColor,eligiblePoi} from '../assets/poi-categories.js';
const point=(name,group,child,x=123.9)=>({properties:{name,class:group,subclass:child},geometry:{type:'Point',coordinates:[x,10.3]}});
test('eligible counts exclude unnamed/exclusions, deduplicate loaded copies and ignore visibility',()=>{
 const state=createPoiCategories(['parking']);const fs=[point('Church','place_of_worship','church'),point('Church','place_of_worship','church'),point('Chapel','place_of_worship','chapel'),point('  ','shop','mall'),point('Park','parking',''),point('Mystery',undefined,undefined)];
 const rows=state.count(fs);assert.equal(rows.length,2);assert.equal(rows.reduce((n,r)=>n+r.count,0),3);assert.equal(rows.find(r=>r.group==='place_of_worship').count,2);
 state.setAll(false);assert.deepEqual(state.count(fs).map(r=>r.count),rows.map(r=>r.count));assert.equal(state.visible(fs[0].properties),false);assert.equal(rows.find(r=>r.group==='').children[0].label,'Unspecified');
});
test('children independent, mixed parents, class and global actions persist across new data/master changes',()=>{
 const state=createPoiCategories([]),fs=[point('A','shop','mall'),point('B','shop','bakery')];state.setChild('shop','mall',false);assert.equal(state.count(fs)[0].mixed,true);assert.equal(state.selected('shop','bakery'),true);assert.equal(state.selected('shop','new'),true);
 state.setClass('shop',false);assert.equal(state.selected('shop','new'),false);state.setChild('shop','mall',true);assert.equal(state.count(fs)[0].mixed,true);state.setMaster(false);assert.equal(state.visible(fs[0].properties),false);assert.equal(state.count(fs)[0].mixed,true);state.setMaster(true);assert.equal(state.visible(fs[0].properties),true);
 state.setAll(true);assert.equal(state.count(fs)[0].mixed,false);assert.equal(state.selected('shop','mall'),true);assert.equal(state.selected('unknown','new'),true);
});
test('stable palette independent of loaded row order and shared exclusion eligibility',()=>{
 assert.equal(classColor('shop'),classColor('shop'));assert.match(classColor('shop'),/^#[a-f0-9]{6}$/);assert.equal(eligiblePoi({name:'A',class:'shop',subclass:'Parking'},['parking']),false);assert.equal(eligiblePoi({name:'', 'name:en':'English',class:'shop'},[]),true);
});
