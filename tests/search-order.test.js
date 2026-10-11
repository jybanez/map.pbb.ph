import {test} from 'node:test';
import assert from 'node:assert/strict';
import {orderSearchResults} from '../assets/map-search.js';
const r=(name,lng,lat=0)=>({name,point:{lng,lat}});
test('name alone precedes full numeric distance, including equal rounded metre labels',()=>{
 const rows=[r('Zulu',0),r('Petron',0.02),r('Alpha',0.1),r('Petron',0.000104),r('Petron',0.0001),r('Petron',0.003)];
 assert.deepEqual(orderSearchResults(rows,{lat:0,lng:0}).map(x=>[x.name,x.point.lng]),[['Alpha',0.1],['Petron',0.0001],['Petron',0.000104],['Petron',0.003],['Petron',0.02],['Zulu',0]]);
});
test('distance sort occurs before cap; origin updates reorder full result pool',()=>{
 const rows=Array.from({length:25},(_,i)=>r('Petron',0.025-i*0.001));
 assert.equal(orderSearchResults(rows,{lat:0,lng:0})[0].point.lng,0.0010000000000000009);
 assert.equal(orderSearchResults(rows,{lat:0,lng:0}).length,20);
 assert.equal(orderSearchResults(rows,{lat:0,lng:0.025})[0].point.lng,0.025);
});
test('missing origin and equal distances have deterministic numeric coordinate ties',()=>{
 const rows=[r('Petron',1,1),r('Petron',-1,1),r('Petron',0,-1)];
 assert.deepEqual(orderSearchResults(rows,null).map(x=>x.point),[{lng:0,lat:-1},{lng:-1,lat:1},{lng:1,lat:1}]);
 assert.deepEqual(orderSearchResults([r('Petron',1),r('Petron',-1)],{lat:0,lng:0}).map(x=>x.point.lng),[-1,1]);
});
