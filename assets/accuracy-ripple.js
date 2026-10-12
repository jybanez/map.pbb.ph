import { accuracyPolygon } from './location.js?v=20261012-personal-ui4';

// Helper has no geographic accuracy-ripple component. This adapter updates one
// GeoJSON source in metres; MapLibre projects it with terrain, tilt and bearing.
export function createAccuracyRipple({visibility=document,motion=window.matchMedia('(prefers-reduced-motion: reduce)'),now=Date.now,staleMs=60000}={}) {
  const source='pbb-accuracy-ripple',layer=source+'-line',fill=source+'-fill';
  let map=null,position=null,available=false,disposed=false,frame=null,expiry=null,start=0,last=0;
  const fresh=()=>position&&now()-position.timestamp<staleMs&&position.timestamp<=now()+1000;
  const active=()=>!disposed&&map&&available&&fresh()&&position.accuracy>0&&!visibility.hidden&&!motion.matches;
  function hide(){if(map?.getLayer(layer))map.setLayoutProperty(layer,'visibility','none');if(map?.getLayer(fill))map.setLayoutProperty(fill,'visibility','none');}
  function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;clearTimeout(expiry);expiry=null;hide();}
  function ensure(){
    if(!map||!position)return false;
    if(!map.getSource(source))map.addSource(source,{type:'geojson',data:{type:'FeatureCollection',features:[]}});
    if(!map.getLayer(fill))map.addLayer({id:fill,type:'fill',source,paint:{'fill-color':'#6ea6ff','fill-opacity':['get','fillOpacity']}},map.getLayer(layer)?layer:undefined);
    if(!map.getLayer(layer))map.addLayer({id:layer,type:'line',source,paint:{'line-color':'#80baff','line-width':2,'line-opacity':['get','opacity']}});
    map.setLayoutProperty(fill,'visibility','visible');map.setLayoutProperty(layer,'visibility','visible');
    return true;
  }
  function tick(time){
    frame=null;if(!active()){stop();return;}
    if(time-last>=50){
      last=time;const elapsed=time-start;
      try{
        if(!map.getSource(source)||!map.getLayer(layer)||!map.getLayer(fill)){stop();return;}
        const features=Array.from({length:3},(_,index)=>{
          const age=elapsed-index*1000,phase=age<0?0:(age%3000)/3000;
          const feature=accuracyPolygon({...position,accuracy:position.accuracy*phase});
          feature.properties={opacity:age<0?0:0.5*(1-phase),fillOpacity:age<0?0:0.07*(1-phase)};
          return feature;
        });
        map.getSource(source).setData({type:'FeatureCollection',features});
      }catch{stop();return;}
    }
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    stop();if(!active()||!ensure())return;
    start=performance.now();last=-Infinity;
    expiry=setTimeout(sync,Math.max(1,position.timestamp+staleMs-now()));
    frame=requestAnimationFrame(tick);
  }
  function styleLoaded(){sync();}
  function removeLayers(){if(!map)return;if(map.getLayer(layer))map.removeLayer(layer);if(map.getLayer(fill))map.removeLayer(fill);if(map.getSource(source))map.removeSource(source);}
  visibility.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
  return {
    setPosition(next){
      // Repainting an existing fix after a style reload/retry must not renew it.
      position={...next,timestamp:Number.isFinite(next.timestamp)?next.timestamp:now()};sync();
    },
    setAvailable(value){available=!!value;sync();},
    setMap(next){stop();map?.off('style.load',styleLoaded);removeLayers();map=next;map?.on('style.load',styleLoaded);sync();},
    destroy(){stop();disposed=true;map?.off('style.load',styleLoaded);removeLayers();map=null;visibility.removeEventListener('visibilitychange',sync);motion.removeEventListener('change',sync);},
  };
}
