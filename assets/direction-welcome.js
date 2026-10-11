// Complete action modal: uiAlert's primary callback is deferred to a microtask.
export function createDirectionWelcome({createActionModal,needsActivation,enable,visible=()=>!document.hidden}){
 let modal=null,shown=false,disposed=false;
 function close(){if(modal?.getState().open)void modal.close({reason:'context-change'});}
 return{consider(){
  if(disposed)return;if(!needsActivation()){close();return;}if(shown||!visible())return;
  shown=true;
  modal=createActionModal({title:'Welcome to PBB Map',ariaLabel:'Welcome to PBB Map',workspaceBridge:false,
   content:'Welcome to PBB Map. Allow location to show where you are and direction sensors to turn your location marker.',
   autoBusy:false,closeOnBackdrop:true,closeOnEscape:true,
   actions:[{id:'continue',label:'Continue browsing',onClick:()=>true},
    {id:'enable',label:'Enable location and direction',variant:'primary',onClick:()=>{
      if(disposed||!visible()||!needsActivation())return true;
      // No async initialization before this call. Browser authorization stays native.
      enable();return true;
    }}]});modal.open();
 },close,destroy(){disposed=true;close();modal?.destroy();modal=null;}};
}
