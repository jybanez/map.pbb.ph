// Read-only content in the complete canonical action modal. No sensor requests,
// raw location/sensor samples, persistence, telemetry or clipboard actions.
export function createDirectionDiagnostics({createActionModal,getSnapshot}){
  let disposed=false,token=0;
  const modal=createActionModal({title:'Direction diagnostics',ariaLabel:'Direction diagnostics',workspaceBridge:false,
    autoBusy:false,closeWhileBusy:true,backdropCloseWhileBusy:true,escapeCloseWhileBusy:true,
    onBeforeClose:()=>{token++;},actions:[
      {id:'refresh',label:'Refresh diagnostics',closeOnClick:false,onClick:()=>refresh()},
      {id:'close',label:'Close',closeOnClick:true}
    ]});
  const paragraph=(parent,text)=>{const p=document.createElement('p');p.textContent=text;parent.appendChild(p);};
  async function refresh(){
    if(disposed||modal.isBusy())return;
    const id=++token;modal.setBusy(true,{message:'Reading local direction status…'});
    await read(id);
  }
  async function read(id){
    // Show the canonical dialog/loading state before reading even local data.
    await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
    if(disposed||id!==token||!modal.getState().open)return;
    const content=document.createElement('div');
    paragraph(content,'The map does not automatically rotate with the phone. Device direction affects the marker cue; compass-follow camera mode is a separate feature.');
    paragraph(content,'This is a local read-only snapshot. It contains no coordinates, heading angles or sensor samples and is not uploaded or saved. Gently rotate the phone while face-up, then choose Refresh diagnostics. Opening this dialog does not request permission.');
    try{
      const snapshot=getSnapshot();
      const heading=document.createElement('h4');heading.textContent=snapshot.issues.length?'Why the direction cue is unavailable':'Direction inputs are accepted';content.appendChild(heading);
      const list=document.createElement('ul');
      for(const issue of snapshot.issues){const li=document.createElement('li');li.textContent=issue;list.appendChild(li);}content.appendChild(list);
      const table=document.createElement('table');table.className='pbb-direction-diagnostics';
      for(const [label,value] of Object.entries(snapshot.fields)){const row=document.createElement('tr'),th=document.createElement('th'),td=document.createElement('td');th.scope='row';th.textContent=label;td.textContent=value;row.append(th,td);table.appendChild(row);}content.appendChild(table);
      paragraph(content,'If direction stays unavailable, tell us your phone model, browser/version and the listed rejection reasons. Do not share exact location or sensor readings. Supported inputs and real-phone behavior still need device validation.');
    }catch{paragraph(content,'Direction status could not be read. Close this dialog, reload the app, and reopen Direction diagnostics. Location and map navigation remain available.');}
    if(disposed||id!==token||!modal.getState().open)return;
    modal.setContent(content);modal.setBusy(false);
  }
  return{open(){if(disposed||modal.getState().open)return;const id=++token;modal.setContent(null);modal.setBusy(true,{message:'Reading local direction status…'});modal.open();void read(id);},
    close(){token++;if(modal.getState().open)void modal.close({reason:'context-change'});},
    destroy(){disposed=true;token++;modal.destroy();}};
}
