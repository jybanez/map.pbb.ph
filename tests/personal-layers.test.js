import test from 'node:test';
import assert from 'node:assert/strict';
import {validateLayerDocument,createPersonalLayerStore,PERSONAL_DB} from '../assets/personal-layer-store.js';
import {createMapLibreDrawingAdapter} from '../vendor/helpers/js/ui/ui.map.drawing.maplibre.js';
function adapter(){
 const canvas=new EventTarget();canvas.style={cursor:'crosshair'};
 const target=new EventTarget();const before=[globalThis.addEventListener,globalThis.removeEventListener];globalThis.addEventListener=target.addEventListener.bind(target);globalThis.removeEventListener=target.removeEventListener.bind(target);
 const events=new Map(),map={on:(name,fn)=>events.set(name,fn),off:name=>events.delete(name),getCanvas:()=>canvas,addSource(){},getSource(){},getLayer(){},isStyleLoaded:()=>false};
 const a=createMapLibreDrawingAdapter(map);return {a,dispose(){a.destroy();[globalThis.addEventListener,globalThis.removeEventListener]=before;assert.equal(events.size,0);}};
}
test('authored document retains numeric zero IDs, hidden visibility, exact geometry and independent clones',()=>{
 const {a,dispose}=adapter();try{const saved={schema:1,revision:3,layers:[{id:'layer',name:'Cebu',visible:false,features:[{type:'Feature',id:0,properties:{nested:{text:'kept'}},geometry:{type:'Point',coordinates:[123.8,-0]}}]}]};const copy=validateLayerDocument(saved,a.validateFeatures);assert.equal(copy.layers[0].features[0].id,0);assert.ok(Object.is(copy.layers[0].features[0].geometry.coordinates[1],-0));assert.equal(copy.layers[0].visible,false);copy.layers[0].features[0].properties.nested.text='new';assert.equal(saved.layers[0].features[0].properties.nested.text,'kept');}finally{dispose();}
});
test('corrupt schema, duplicate layers and strict geometry are rejected without replacing editor model',()=>{
 const {a,dispose}=adapter();try{const feature={type:'Feature',id:0,properties:null,geometry:{type:'Point',coordinates:[123,10]}};a.setFeatures([feature]);for(const geometry of [{type:'Point',coordinates:[NaN,10]},{type:'Point',coordinates:[123,10,0]},{type:'LineString',coordinates:[[0,0]]},{type:'Polygon',coordinates:[[[0,0],[1,1],[2,2],[0,0]]]}])assert.throws(()=>validateLayerDocument({schema:1,revision:0,layers:[{id:'l',name:'Layer',visible:true,features:[{...feature,geometry}]}]},a.validateFeatures));assert.deepEqual(a.getFeatures(),[feature]);assert.throws(()=>validateLayerDocument({schema:2,revision:0,layers:[]}));assert.throws(()=>validateLayerDocument({schema:1,revision:0,layers:[{id:'l',name:'A',visible:true,features:[]},{id:'l',name:'B',visible:true,features:[]}]}));}finally{dispose();}
});
test('missing or denied authored storage never reports successful write and is distinct from map cache',async()=>{
 assert.equal(PERSONAL_DB,'pbb-personal-layers-v1');const missing=createPersonalLayerStore({indexedDB:null});await assert.rejects(missing.read(),/does not provide/);const denied=createPersonalLayerStore({indexedDB:{open(){throw Error('Storage denied');}}});await assert.rejects(denied.save({schema:1,revision:0,layers:[]}),/Storage denied/);denied.close();await assert.rejects(denied.read(),/closed/);
});
