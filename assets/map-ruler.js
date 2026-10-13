export function installMapRuler({region,createMapRuler,personal,onStateChange,toast}) {
  const host=document.createElement('div');host.className='pbb-ruler-result';region.append(host);
  let map=null,ruler=null,frame=0,disposed=false,revision=0;
  const state=()=>ruler?.getState()||{active:false,pending:false,destroyed:!map};
  function place(){frame=0;if(disposed||!ruler)return;const size=ruler.getSize();if(!size.width||!size.height)return;
    host.style.bottom='16px';const base=host.getBoundingClientRect(),area=region.getBoundingClientRect();let bottom=base.bottom;
    const obstacles=[...document.querySelectorAll('.pbb-personal-card,.pbb-personal-rail,.pbb-personal-object,.pbb-location-toast .ui-toast,#locate-control,.ui-map-scale')].filter(e=>!e.hidden&&e.getClientRects().length).map(e=>e.getBoundingClientRect()).filter(r=>r.left<base.right+8&&r.right>base.left-8);
    for(let i=0;i<=obstacles.length;i++){let next=bottom;for(const r of obstacles)if(r.bottom>bottom-size.height-8&&r.top<bottom+8)next=Math.min(next,r.top-8);if(next===bottom)break;bottom=next;}
    host.style.bottom=`${Math.min(Math.max(16,16+base.bottom-bottom),Math.max(16,area.height-size.height-16))}px`;
  }
  function queue(){if(!disposed&&!frame)frame=requestAnimationFrame(place);}
  // Observe competing overlays, excluding the host styles updated by placement.
  const observer=new MutationObserver(records=>{if(records.some(r=>!host.contains(r.target)))queue();}),resize=new ResizeObserver(queue);
  observer.observe(region,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','style']});resize.observe(region);
  function cancel(){revision++;ruler?.deactivate();}
  function setMap(next){cancel();ruler?.destroy();ruler=null;map?.off('move',queue);map?.off('resize',queue);map=next;
    if(map&&!disposed){const context=map;ruler=createMapRuler(host,{map,maplibre:window.maplibregl,beforeActivate:async({signal})=>{const token=revision;const ready=await personal.requestExit({signal});return ready&&!signal.aborted&&!disposed&&map===context&&revision===token&&!personal.isEditing();},onStateChange:s=>{onStateChange?.(s);queue();},onError:error=>{if(!ruler?.getState().copyStatus)toast.show(error?.message||'Measurement could not start.',{type:'error',dismissible:true});}});map.on('move',queue);map.on('resize',queue);}
    onStateChange?.(state());queue();
  }
  return{getState:state,isOwningInput:()=>{const s=state();return s.active||s.pending;},toggle(){if(!ruler||disposed)return;if(state().active||state().pending)cancel();else void ruler.activate();},cancel,setMap,destroy(){if(disposed)return;setMap(null);disposed=true;cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();host.remove();}};
}
