'use strict';
// The host runs the simulation. The guest sends directions and draws snapshots.
const net=(()=>{
 const $=id=>document.getElementById(id);
 const panel=$('roomPanel'),status=$('roomStatus');
 let role='',pc=null,channel=null,connected=false,lastSend=0,localXP=0,remoteName='',generation=0,timer=null;
 const say=text=>status.textContent=text;
 function send(value){if(channel?.readyState==='open'&&channel.bufferedAmount<100000)channel.send(JSON.stringify(value));}
 function leave(){const wasGuest=role==='guest';generation++;clearTimeout(timer);const old=pc;pc=null;channel=null;connected=false;role='';if(old)old.close();panel.hidden=true;if(wasGuest)xp=localXP;ui.pause.hidden=false;ui.start.hidden=false;ui.restart.hidden=false;ui.revive.hidden=true;ui.skipRevive.hidden=true;mode=Number(ui.mode.value);reset();setupScreen();}
 function failed(){if(!role)return;connected=false;state='disconnected';ui.pause.disabled=true;panel.hidden=false;$('beginOnline').hidden=true;say('Your friend disconnected, or the connection was blocked. Go back and make fresh codes to try again.');}
 function bind(dc){channel=dc;dc.onopen=()=>{connected=true;clearTimeout(timer);say(role==='host'?'Friend connected! Waiting for their name�':'Connected! Wait for the captain to start.');send({type:'hello',name:$('onlineName').value.trim().slice(0,16)});};dc.onclose=failed;dc.onerror=failed;dc.onmessage=e=>{try{const m=JSON.parse(e.data);if(role==='host'){
 if(m.type==='hello'&&typeof m.name==='string'&&m.name.trim()){remoteName=m.name.trim().slice(0,16);$('beginOnline').hidden=false;say(remoteName+' is here! Press Start together.');}
 if(m.type==='direction'&&state==='playing'&&Number.isFinite(m.angle)&&Math.abs(m.angle)<=Math.PI&&players[1]?.alive)players[1].target=m.angle;
 }else if(m.type==='snapshot')receive(m);
 }catch{say('That message could not be read.');}};}
 function open(nextRole){if(!window.RTCPeerConnection)throw Error('This browser cannot connect. Try a recent Chrome, Edge, Firefox or Safari.');if(!$('onlineName').value.trim())throw Error('Type your name first.');
 if(pc)throw Error('Go back to local game before making a new room.');localXP=xp;role=nextRole;generation++;remoteName='';state='lobby';ui.pause.disabled=true;
 pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});pc.onconnectionstatechange=()=>{if(pc&&['failed','disconnected'].includes(pc.connectionState))failed();};
 pc.ondatachannel=e=>bind(e.channel);$('codeFields').hidden=false;$('hostRoom').disabled=true;$('joinRoom').disabled=true;
 }
 async function gather(current){if(current.iceGatheringState==='complete')return;await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{cleanup();reject(Error('Finding a connection took too long. Go back and try again.'));},15000);const changed=()=>{if(current.iceGatheringState==='complete'){cleanup();resolve();}};const cleanup=()=>{clearTimeout(timeout);current.removeEventListener('icegatheringstatechange',changed);};current.addEventListener('icegatheringstatechange',changed);changed();});}
 // Zip the connection details instead of sending a big JSON document.
 async function code(description){
  if(typeof CompressionStream==='undefined')return JSON.stringify({game:'snake-arena',version:1,type:description.type,sdp:description.sdp});
  const stream=new Blob([description.sdp]).stream().pipeThrough(new CompressionStream('deflate'));
  const bytes=new Uint8Array(await new Response(stream).arrayBuffer());
  let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
  return 'S2'+(description.type==='offer'?'O':'A')+'.'+btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 }
 async function parse(value,type){
  if(value.length>40000)throw Error('That code is too long.');
  if(value.trim().startsWith('{')){
   let m;try{m=JSON.parse(value);}catch{throw Error('Paste the whole code.');}
   if(m.game!=='snake-arena'||m.version!==1||m.type!==type||typeof m.sdp!=='string'||m.sdp.length>39000)throw Error('That is not the right Snake Arena code. Ask your friend for a fresh one.');
   return {type:m.type,sdp:m.sdp};
  }
  value=value.replace(/\s/g,'');
  const match=/^S2([OA])\.([A-Za-z0-9_-]+)$/.exec(value);
  if(!match)throw Error('That code looks incomplete. Copy the whole code and try again.');
  if(match[1]!== (type==='offer'?'O':'A'))throw Error(type==='offer'?"Paste the captain's invitation, not a reply.":"Paste your friend's reply, not your invitation.");
  if(typeof DecompressionStream==='undefined')throw Error('Please update your browser to use this shorter code.');
  try{
   const binary=atob(match[2].replace(/-/g,'+').replace(/_/g,'/'));
   const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
   const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
   const chunks=[];let total=0;
   for(;;){const {value:chunk,done}=await reader.read();if(done)break;total+=chunk.length;if(total>39000){await reader.cancel();throw Error('Too large');}chunks.push(chunk);}
   const result=new Uint8Array(total);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}
   const sdp=new TextDecoder('utf-8',{fatal:true}).decode(result);
   if(!sdp)throw Error('Empty code');
   return {type,sdp};
  }catch{throw Error('That code is broken or incomplete. Ask your friend to copy it again.');}
 }
 async function host(){open('host');const current=pc;bind(pc.createDataChannel('snake'));say('Making your invitation�');await pc.setLocalDescription(await pc.createOffer());await gather(current);if(pc!==current)return;const output=await code(current.localDescription);if(pc!==current)return;$('outCode').value=output;say('1. Send this invitation to your friend. 2. Paste their reply below.');}
 async function use(){if(!pc)throw Error('Choose Host or Join first.');const current=pc;const description=await parse($('inCode').value.trim(),role==='host'?'answer':'offer');if(pc!==current)return;if(pc.remoteDescription)throw Error('This code was already used. Make a fresh room to try again.');say('Connecting�');await pc.setRemoteDescription(description);if(role==='guest'){await pc.setLocalDescription(await pc.createAnswer());await gather(current);if(pc!==current)return;const output=await code(current.localDescription);if(pc!==current)return;$('outCode').value=output;say('Send your reply code to the captain. Keep this page open!');}timer=setTimeout(()=>{if(!connected)failed();},45000);}
 function receive(m){if(!Array.isArray(m.snakes)||!Array.isArray(m.pearls)||!['playing','paused','reviving','won','lost'].includes(m.state))return;
 snakes=m.snakes;players=snakes.filter(s=>s.isPlayer);player=players[1];pearls=m.pearls;state=m.state;mode=2;xp=m.xp;
 panel.hidden=true;ui.setup.hidden=true;ui.overlay.hidden=m.overlayHidden;ui.heading.textContent=m.heading;ui.message.textContent=m.message;ui.details.hidden=false;ui.details.textContent=m.details+(state==='reviving'?'\nCaptain chooses the revive. '+m.seconds+' seconds left.':'');ui.gameActions.hidden=true;ui.pause.hidden=true;ui.highScore.textContent=m.best;ui.controlHint.textContent='You: WASD / arrows / pointer. Captain controls pause and revives.';updateHUD();}
 function tick(time){if(role!=='host'||!connected||state==='lobby'||state==='disconnected'||time-lastSend<65)return;lastSend=time;send({type:'snapshot',state,xp,overlayHidden:ui.overlay.hidden,heading:ui.heading.textContent,message:ui.message.textContent,details:ui.details.textContent,best:ui.highScore.textContent,seconds:Math.max(0,Math.ceil((reviveDeadline-performance.now())/1000)),snakes:snakes.map(s=>({x:s.x,y:s.y,size:s.size,color:s.color,angle:s.angle,isPlayer:s.isPlayer,alive:s.alive,name:s.name,score:s.score||0,kills:s.kills||0,shield:s.shield||0,parts:s.parts})),pearls});}
 function key(e){if(!role)return false;if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.target instanceof HTMLTextAreaElement)return true;const k=e.key.toLowerCase();if(role==='guest'){if(k in directions){e.preventDefault();if(state==='playing')send({type:'direction',angle:directions[k]});}return true;}if(k in directions&&state==='playing'){e.preventDefault();if(players[0]?.alive){pointer=null;players[0].target=directions[k];}return true;}return false;}
 function pointerInput(e){if(role!=='guest'||state!=='playing'||!player?.alive)return;const r=canvas.getBoundingClientRect();send({type:'direction',angle:Math.atan2((e.clientY-r.top)*CONFIG.height/r.height-player.y,(e.clientX-r.left)*CONFIG.width/r.width-player.x)});}
 function action(fn){return async()=>{try{await fn();}catch(e){say(e.message||'Could not connect. Try fresh codes.');}};}
 $('onlineButton').addEventListener('click',()=>{if(!role){pause();localXP=xp;$('onlineName').value=ui.name1.value||names[0];$('codeFields').hidden=true;$('outCode').value='';$('inCode').value='';$('hostRoom').disabled=false;$('joinRoom').disabled=false;$('beginOnline').hidden=true;say('Choose Host or Join. Each host makes a separate private room.');}panel.hidden=false;});
 $('hostRoom').addEventListener('click',action(host));$('joinRoom').addEventListener('click',action(()=>{open('guest');say('Paste the captain�s invitation below, then press Use friend�s code.');}));$('useCode').addEventListener('click',action(use));
 $('copyCode').addEventListener('click',action(async()=>{if(!$('outCode').value)throw Error('No code yet.');try{await navigator.clipboard.writeText($('outCode').value);say('Copied! Send it to your friend.');}catch{$('outCode').focus();$('outCode').select();say('Code selected. Press Ctrl+C (or Copy on your phone).');}}));
 $('beginOnline').addEventListener('click',()=>{if(role!=='host'||!connected||!remoteName)return;mode=2;names=[$('onlineName').value.trim().slice(0,16),remoteName];panel.hidden=true;ui.controlHint.textContent='You: WASD / arrows. Friend: their own keyboard. Shared captain XP.';start();});$('leaveRoom').addEventListener('click',leave);
 return {get role(){return role;},leave,tick,key,pointer:pointerInput,parse,code};
})();
