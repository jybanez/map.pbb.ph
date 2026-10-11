import test from 'node:test';
import assert from 'node:assert/strict';
import {poiName} from '../assets/poi-name.js';
test('actual POI names skip blank/non-string fields and preserve local/English precedence',()=>{
 for(const value of [undefined,null,'',' \t\n\u00a0',17])assert.equal(poiName({name:value,class:'church'}),'');
 assert.equal(poiName({name:'Local', 'name:en':'English',name_en:'Generated'}),'Local');
 assert.equal(poiName({name:' \t', 'name:en':'English',name_en:'Generated'}),'English');
 assert.equal(poiName({name:null,'name:en':'',name_en:' Generated '}),'Generated');
 for(const value of ['0','01','123','教会'])assert.equal(poiName({name:value}),value);
});
