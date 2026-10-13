// Canonical ScaleControl owns labels and distance. This only reserves overlay space.
export function installScalePlacement({map,region,createMapScale}) {
  const scale=createMapScale({map}),element=scale.getElement();
  let frame=0,disposed=false,offset=0;
  function place(){
    frame=0;if(disposed||!element?.isConnected)return;
    const area=region.getBoundingClientRect(),box=element.getBoundingClientRect();
    // Recover the default bottom edge so an earlier offset cannot accumulate.
    const size=scale.getSize(),bottom=box.bottom+offset;
    const rectangles=[...document.querySelectorAll('#map-region .pbb-personal-card,#map-region .pbb-personal-object,#map-region .pbb-personal-rail,.pbb-location-toast .ui-toast,#locate-control')].filter(e=>!e.hidden&&e.getClientRects().length).map(e=>e.getBoundingClientRect()).filter(r=>r.left<box.left+size.width+8&&r.right>box.left-8);
    let candidate=bottom;
    for(let pass=0;pass<=rectangles.length;pass++){
      let nextBottom=candidate;
      for(const rect of rectangles)if(rect.bottom>candidate-size.height-8&&rect.top<candidate+8)nextBottom=Math.min(nextBottom,rect.top-8);
      if(nextBottom===candidate)break;
      candidate=nextBottom;
    }
    const next=Math.max(0,Math.min(bottom-candidate,area.height-size.height-16));
    if(next!==offset){offset=next;scale.update({offset});}
  }
  function queue(){if(!disposed&&!frame)frame=requestAnimationFrame(place);}
  const observer=new MutationObserver(queue),resize=new ResizeObserver(queue);
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','style','class']});resize.observe(region);
  function destroy(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();map.off('move',queue);map.off('resize',queue);map.off('remove',destroy);scale.destroy();}
  map.on('move',queue);map.on('resize',queue);map.on('remove',destroy);queue();
  return {destroy};
}
