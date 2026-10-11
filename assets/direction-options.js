// Optional session override of automatic approximation through the complete canonical declarative form modal.
export function createDirectionOptions({createFormModal,uiAlert,getState,apply}){
 let modal=null,disposed=false,token=0,alertLife=null;
 const rows=eligible=>[
  [{type:'text',content:'When altitude is unavailable, PBB assumes ordinary ground use and estimates direction in the supported Philippines region. Magnetic interference can affect the result.'}],
  [{type:'select',name:'choice',label:'Direction mode',options:[{value:'strict',label:'Keep direction off until altitude is available'},{value:'approximate',label:'Automatic approximate direction when altitude is unavailable'}]}]
 ];
 function close(){token++;alertLife?.abort();if(modal?.getState().open)void modal.close({reason:'context-change'});}
 return {open(){
  if(disposed||modal?.getState().open)return;const id=++token;
  let instance;modal=instance=createFormModal({title:'Direction options',ariaLabel:'Direction options',workspaceBridge:false,columns:1,rows:[],initialValues:{choice:'approximate'},submitLabel:'Apply',cancelLabel:'Cancel',manageBusyOnSubmit:false,autoBusy:false,closeWhileBusy:true,backdropCloseWhileBusy:true,escapeCloseWhileBusy:true,
   onBeforeClose:()=>{token++;alertLife?.abort();},onClose:()=>{if(modal===instance)modal=null;},
   validate:values=>['strict','approximate'].includes(values.choice)?{}:{choice:'Choose automatic approximate direction or strict mode.'},
   onInvalid:({errors})=>{alertLife?.abort();alertLife=new AbortController();return uiAlert('Please address the following issues before continuing:',{title:'Check direction options',variant:'error',items:Object.keys(errors).map(()=>'Direction mode — choose automatic approximation or strict mode'),draggable:true,workspaceBridge:false,signal:alertLife.signal});},
   onSubmit:values=>{if(disposed||id!==token)return false;modal.setBusy(true,{message:'Applying direction mode…'});try{apply(values.choice==='approximate');return true;}catch{modal.setFormError('Direction mode could not be applied. Close and retry.');return false;}finally{modal?.setBusy(false);}}
  });
  modal.setBusy(true,{message:'Reading direction options…'});modal.open();
  void new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0))).then(()=>{
   if(disposed||id!==token||!modal?.getState().open)return;
   try{const state=getState();modal.update({rows:rows(state.eligible),initialValues:{choice:state.selected?'approximate':'strict'}});modal.setBusy(false);}catch{modal.setBusy(false);modal.setFormError('Direction options could not load. Close, reload the app and retry.');}
  });
 },close,destroy(){disposed=true;close();modal?.destroy();modal=null;}};
}
