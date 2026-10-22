(() => {
"use strict";
const SUITS=[
 {key:"S",symbol:"♠",name:"Spades",red:false},
 {key:"H",symbol:"♥",name:"Hearts",red:true},
 {key:"D",symbol:"♦",name:"Diamonds",red:true},
 {key:"C",symbol:"♣",name:"Clubs",red:false}
];
const RANKS=[{r:"2",v:2},{r:"3",v:3},{r:"4",v:4},{r:"5",v:5},{r:"6",v:6},{r:"7",v:7},{r:"8",v:8},{r:"9",v:9},{r:"10",v:10},{r:"J",v:11},{r:"Q",v:12},{r:"K",v:13},{r:"A",v:14}];
const PLAYERS=[{id:0,name:"You",team:0},{id:1,name:"Riya",team:0},{id:2,name:"Arjun",team:1},{id:3,name:"Karan",team:1}];
const $=id=>document.getElementById(id);
let state;
let turnTimer=null;
let locked=false;

function shuffledDeck(){
 const deck=[];
 for(const s of SUITS) for(const r of RANKS) deck.push({s:s.key,r:r.r,v:r.v});
 for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 return deck;
}
function newGame(){
 if(turnTimer) clearTimeout(turnTimer);
 const deck=shuffledDeck(), hands=[[],[],[],[]];
 for(let i=0;i<52;i++) hands[i%4].push(deck[i]);
 hands.forEach(h=>h.sort((a,b)=>SUITS.findIndex(s=>s.key===a.s)-SUITS.findIndex(s=>s.key===b.s)||a.v-b.v));
 state={hands,leader:Math.floor(Math.random()*4),current:0,trick:[],trump:null,revealed:false,scores:[0,0],tricks:0,captured:[[],[]],capturedTricks:[0,0],log:[],roundOver:false,lastCapture:null};
 state.current=state.leader;
 locked=false;
 addLog("New round started. 13 cards dealt to each player.");
 render();
 scheduleTurn();
}
function teamOf(player){return PLAYERS[player].team;}
function isTen(card){return card.v===10||card.r==="10";}
function suitInfo(key){return SUITS.find(s=>s.key===key);}
function cardLabel(card){return `${card.r}${suitInfo(card.s).symbol}`;}
function fullCard(card){return `${card.r} of ${suitInfo(card.s).name}`;}
function addLog(text){
 state.log.unshift(text);
 state.log=state.log.slice(0,24);
}
function legalCards(player){
 const hand=state.hands[player];
 if(!state.trick.length) return hand.slice();
 const lead=state.trick[0].card.s;
 const matching=hand.filter(c=>c.s===lead);
 return matching.length?matching:hand.slice();
}
function cardHTML(card, extra=""){
 const suit=suitInfo(card.s);
 return `<div class="seat-card ${suit.red?"red":""} ${extra}" aria-label="${fullCard(card)}"><span class="card-corner">${card.r}${suit.symbol}</span><span class="card-suit">${suit.symbol}</span><span class="card-bottom">${card.r}${suit.symbol}</span></div>`;
}
function handCardHTML(card,index,legal){
 const suit=suitInfo(card.s);
 return `<button class="hand-card ${suit.red?"red":""} ${legal?"legal":""}" data-index="${index}" ${!legal||state.current!==0||locked||state.roundOver?"disabled":""} aria-label="Play ${fullCard(card)}"><span class="card-corner">${card.r}${suit.symbol}</span><span class="card-suit">${suit.symbol}</span><span class="card-bottom">${card.r}${suit.symbol}</span></button>`;
}
function render(){
 $("score1").textContent=state.scores[0];
 $("score2").textContent=state.scores[1];
 $("tricks1").textContent=state.capturedTricks[0];
 $("tricks2").textContent=state.capturedTricks[1];
 $("roundCount").textContent=state.roundOver?"Round complete":`Trick ${Math.min(state.tricks+1,13)} / 13`;
 $("handCount").textContent=`${state.hands[0].length} cards`;
 $("trumpBadge").innerHTML=`TRUMP <strong>${state.trump?suitInfo(state.trump).name+" "+suitInfo(state.trump).symbol:"Not revealed"}</strong>`;
 $("back1").innerHTML=backs(state.hands[2].length);
 $("back2").innerHTML=backs(state.hands[1].length);
 $("back3").innerHTML=backs(state.hands[3].length);
 for(let p=0;p<4;p++){
   const slot=$("slot"+p);
   const play=state.trick.find(x=>x.player===p);
   slot.innerHTML=play?cardHTML(play.card):"";
 }
 const legal=legalCards(0);
 $("hand").innerHTML=state.hands[0].map((c,i)=>handCardHTML(c,i,legal.includes(c))).join("");
 $("hand").querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>playCard(0,Number(btn.dataset.index))));
 $("pileCount1").textContent=`${state.captured[0].length} cards`;
 $("pileCount2").textContent=`${state.captured[1].length} cards`;
 $("pileDehle1").textContent=state.scores[0];
 $("pileDehle2").textContent=state.scores[1];
 $("pileTricks1").textContent=state.capturedTricks[0];
 $("pileTricks2").textContent=state.capturedTricks[1];
 renderPile(0);renderPile(1);
 $("gameLog").innerHTML=state.log.map(line=>`<li>${escapeHTML(line)}</li>`).join("");
 if(state.roundOver){
   $("currentStatus").innerHTML=`<b>${escapeHTML(roundResult())}</b>`;
   $("tableHint").textContent="Round complete";
   $("handHelp").textContent="Choose New Game to play another round.";
 }else if(locked){
   $("currentStatus").textContent="Trick complete — watch the cards slide into the winning team's capture pile.";
   $("tableHint").textContent="Trick complete — capturing cards…";
 }else if(state.current===0){
   $("currentStatus").textContent=state.trick.length?`Your turn. Lead suit: ${suitInfo(state.trick[0].card.s).name}. Follow suit if possible.`:"Your turn — choose a card to lead.";
   $("tableHint").textContent=state.trick.length?`Follow ${suitInfo(state.trick[0].card.s).symbol} if possible`:"You may lead any card";
   $("handHelp").textContent=state.trick.length?"Highlighted cards are legal. If you have the led suit, you must follow it.":"Choose a card to lead the trick.";
 }else{
   $("currentStatus").textContent=`${PLAYERS[state.current].name} is choosing a card…`;
   $("tableHint").textContent=`${PLAYERS[state.current].name} is playing`;
 }
}
function backs(count){return Array.from({length:Math.min(count,13)},()=>'<span class="back-card"></span>').join("");}
function renderPile(team){
 const cards=state.captured[team].slice(-10);
 $("pile"+(team+1)).innerHTML=cards.map(c=>`<span class="mini-card ${suitInfo(c.s).red?"red":""} ${isTen(c)?"dehla":""}" title="${fullCard(c)}">${cardLabel(c)}</span>`).join("");
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function playCard(player,index){
 if(locked||state.roundOver||player!==state.current) return;
 const hand=state.hands[player], card=hand[index];
 if(!card) return;
 const legal=legalCards(player);
 if(!legal.includes(card)){showToast("You must follow the led suit if you have it.");return;}
 const lead=state.trick.length?state.trick[0].card.s:null;
 if(lead&&card.s!==lead&&!state.revealed){
   const choices=SUITS.filter(s=>s.key!==lead);
   state.trump=choices[Math.floor(Math.random()*choices.length)].key;
   state.revealed=true;
   addLog(`Trump revealed: ${suitInfo(state.trump).name}.`);
 }
 hand.splice(index,1);
 state.trick.push({player,card});
 render();
 if(state.trick.length===4){
   locked=true;
   setTimeout(finishTrick,260);
 }else{
   state.current=(player+1)%4;
   scheduleTurn();
 }
}
function aiChoose(player){
 const legal=legalCards(player);
 if(!legal.length)return 0;
 if(state.trick.length<3){
   // Play a low legal card early; use a ten only when a likely winner can be protected.
   const nonTens=legal.filter(c=>!isTen(c));
   const pool=nonTens.length?nonTens:legal;
   pool.sort((a,b)=>a.v-b.v);
   return state.hands[player].indexOf(pool[0]);
 }
 // On the final play, try to win if the trick contains a ten; otherwise conserve high cards.
 const currentWinner=winningPlay(state.trick);
 const hasTen=state.trick.some(x=>isTen(x.card));
 const winners=legal.filter(c=>wouldBeat(c,currentWinner.card,state.trick[0].card.s));
 if(hasTen&&winners.length){
   winners.sort((a,b)=>a.v-b.v);
   return state.hands[player].indexOf(winners[0]);
 }
 const nonTens=legal.filter(c=>!isTen(c));
 const pool=nonTens.length?nonTens:legal;
 pool.sort((a,b)=>a.v-b.v);
 return state.hands[player].indexOf(pool[0]);
}
function wouldBeat(card,best,lead){
 const trump=state.trump;
 const cTrump=trump&&card.s===trump,bTrump=trump&&best.s===trump;
 if(cTrump&&!bTrump)return true;
 if(cTrump===bTrump){
   if(card.s===best.s&&card.v>best.v)return true;
   if(card.s===lead&&best.s!==lead&&!bTrump)return true;
 }
 return false;
}
function winningPlay(trick){
 const lead=trick[0].card.s;
 let best=trick[0];
 for(const x of trick.slice(1)) if(wouldBeat(x.card,best.card,lead)) best=x;
 return best;
}
function scheduleTurn(){
 if(turnTimer)clearTimeout(turnTimer);
 if(locked||state.roundOver)return;
 if(state.current===0){render();return;}
 turnTimer=setTimeout(()=>{
   if(locked||state.roundOver)return;
   const index=aiChoose(state.current);
   playCard(state.current,index);
 },650);
}
function finishTrick(){
 const snapshot=state.trick.slice();
 const winnerPlay=winningPlay(snapshot);
 const winner=winnerPlay.player, team=teamOf(winner);
 const leadSuit=snapshot[0].card.s;
 const dehlas=snapshot.filter(x=>isTen(x.card)).map(x=>x.card);
 const isCut=Boolean(state.trump&&winnerPlay.card.s===state.trump&&winnerPlay.card.s!==leadSuit);
 const cutCards=snapshot.filter(x=>x.card.s===state.trump&&x.card.s!==leadSuit);
 state.scores[team]+=dehlas.length;
 state.captured[team].push(...snapshot.map(x=>x.card));
 state.capturedTricks[team]++;
 state.tricks++;
 state.lastCapture={team,winner,winningCard:winnerPlay.card,isCut,dehlas,cutCards,leadSuit};
 addLog(`Team ${team+1} captured the trick — ${PLAYERS[winner].name} won with ${cardLabel(winnerPlay.card)}${isCut?` and cut with trump ${cardLabel(winnerPlay.card)}`:""}${dehlas.length?`; Dehla captured: ${dehlas.map(cardLabel).join(", ")}`:"; no Dehla"}.`);
 render();
 showTrickAnnouncement(team,state.lastCapture);
 setTimeout(()=>{
   state.trick=[];
   locked=false;
   if(state.tricks>=13){
     state.roundOver=true;
     addLog(roundResult());
     render();
     showFinalResult();
     return;
   }
   state.current=winner;
   render();
   scheduleTurn();
 },1300);
}
function showTrickAnnouncement(team,info){
 const zone=$("capture"+(team+1)), panel=$("trickAnnouncement");
 zone.classList.remove("capture-highlight");void zone.offsetWidth;zone.classList.add("capture-highlight");
 $("winnerBanner").textContent=`TEAM ${team+1} CAPTURED THIS TRICK`;
 $("winnerDetail").textContent=`${PLAYERS[info.winner].name} won with ${fullCard(info.winningCard)}${info.isCut?" · Trump cut":""}`;
 $("cutValue").textContent=info.isCut?`${cardLabel(info.winningCard)} — TRUMP CUT`:"No cut this trick";
 $("cutNote").textContent=info.isCut?`Trump ${suitInfo(info.winningCard.s).name} beat the led ${suitInfo(info.leadSuit).name} suit.`:`No off-suit trump won this trick. Trump: ${state.trump?suitInfo(state.trump).name:"not revealed"}.`;
 $("dehlaValue").textContent=info.dehlas.length?info.dehlas.map(c=>`${cardLabel(c)} (10)`).join(", "):"No 10 / Dehla in this trick";
 panel.classList.remove("show");void panel.offsetWidth;panel.classList.add("show");
 // Animate the four played cards toward the winning team's pile.
 const target=zone.getBoundingClientRect();
 document.querySelectorAll(".trick-slot .seat-card").forEach(el=>{
   const from=el.getBoundingClientRect();
   const dx=target.left+target.width/2-(from.left+from.width/2);
   const dy=target.top+target.height/2-(from.top+from.height/2);
   el.animate([{transform:"translate(0,0) scale(1)",opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.18)`,opacity:0}],{duration:900,easing:"cubic-bezier(.2,.8,.25,1)",fill:"forwards"});
 });
}
function roundResult(){
 const a=state.scores[0],b=state.scores[1];
 if(a>b)return `TEAM 1 WINS ${a}–${b} · You + Riya`;
 if(b>a)return `TEAM 2 WINS ${b}–${a} · Arjun + Karan`;
 return `DRAW ${a}–${b}`;
}
function showFinalResult(){
 $("winnerBanner").textContent=roundResult();
 $("winnerDetail").textContent=`Final Dehla score: Team 1 ${state.scores[0]} — Team 2 ${state.scores[1]}`;
 $("cutValue").textContent="Round complete";
 $("cutNote").textContent="Final result";
 $("dehlaValue").textContent=`Team 1: ${state.scores[0]} Dehle · Team 2: ${state.scores[1]} Dehle`;
 const panel=$("trickAnnouncement");panel.classList.remove("show");void panel.offsetWidth;panel.classList.add("show");
 showToast(roundResult());
}
function showToast(text){const t=$("toast");t.textContent=text;t.classList.remove("show");void t.offsetWidth;t.classList.add("show");}
$("newGameBtn").addEventListener("click",newGame);
$("rulesBtn").addEventListener("click",()=>$("rulesDialog").showModal());
$("closeRules").addEventListener("click",()=>$("rulesDialog").close());
$("rulesDialog").addEventListener("click",e=>{if(e.target===$("rulesDialog"))$("rulesDialog").close();});
newGame();
})();