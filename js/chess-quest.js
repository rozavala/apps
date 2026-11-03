/* ================================================================
   CHESS QUEST — ENGINE + UI (js/chess-quest.js)

   Saved progress lives at zs_chess_<user> (see getUserKey). Fields:
     puzzlesSolved  number   puzzles 1..N of the ladder are solved
                             (the star rule in auth.js reads this,
                             Parents Corner treats it as a position)
     wins / losses / draws   games vs the computer (wins → stars)
     learnedPieces  ['P',…]  piece lessons opened
     trainerBest, rushBest, openings   (chess-extras.js)
   Added in v4 (all optional, older saves load unchanged):
     learnedSpecial ['castle',…]   special-move lessons finished
     puzzleMarks    {"12": 3}      best 1–3 mark per ladder puzzle id
     playPrefs      {level, coach, side}
   ================================================================ */

function getUserKey() {
  return typeof getUserAppKey === 'function' ? getUserAppKey('zs_chess_') : null;
}
function getUserProgress(){const k=getUserKey();if(!k)return{};try{return JSON.parse(localStorage.getItem(k))||{}}catch{return{}}}
function saveProgress(data){
  const k=getUserKey();if(!k)return;
  const p=getUserProgress();Object.assign(p,data);
  try{localStorage.setItem(k,JSON.stringify(p))}catch(e){}
  if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
}
function _esc(s){return typeof escHtml==='function'?escHtml(s):String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function _tier(){return typeof getAgeTier==='function'?getAgeTier():'intermediate'}

/* ── CQE: compact chess engine ─────────────────────────────────
   Squares 0..63 = row*8+col (row 0 = rank 8, like the UI boards).
   Pieces 1 P, 2 N, 3 B, 4 R, 5 Q, 6 K; +8 = black. Moves are ints:
   from | to<<6 | promo<<12 | flag<<15 (1 en passant, 2 castle,
   3 double pawn push). Checked against standard perft counts. */
const CQE=(function(){
  const PAWN=1,KNIGHT=2,BISHOP=3,ROOK=4,QUEEN=5,KING=6;
  const LET=' PNBRQK';
  const NB=[],KB=[],RAYS=[];
  const DIRS=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  for(let s=0;s<64;s++){
    const r=s>>3,c=s&7;
    NB[s]=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].filter(([a,b])=>r+a>=0&&r+a<8&&c+b>=0&&c+b<8).map(([a,b])=>(r+a)*8+c+b);
    KB[s]=DIRS.filter(([a,b])=>r+a>=0&&r+a<8&&c+b>=0&&c+b<8).map(([a,b])=>(r+a)*8+c+b);
    RAYS[s]=DIRS.map(([a,b])=>{const out=[];let rr=r+a,cc=c+b;while(rr>=0&&rr<8&&cc>=0&&cc<8){out.push(rr*8+cc);rr+=a;cc+=b}return out});
  }
  const CR=new Array(64).fill(15);CR[60]=12;CR[56]=13;CR[63]=14;CR[4]=3;CR[0]=7;CR[7]=11;
  const mv=(f,t,p,fl)=>f|(t<<6)|((p||0)<<12)|((fl||0)<<15);
  const mFrom=m=>m&63,mTo=m=>(m>>6)&63,mPromo=m=>(m>>12)&7,mFlag=m=>(m>>15)&3;
  const sqName=s=>'abcdefgh'[s&7]+(8-(s>>3));
  const sqIdx=n=>(8-(+n[1]))*8+'abcdefgh'.indexOf(n[0]);

  function empty(){return{b:new Int8Array(64),turn:0,castle:0,ep:-1,half:0,full:1,kw:-1,kb:-1}}
  function findKings(p){p.kw=-1;p.kb=-1;for(let s=0;s<64;s++){if(p.b[s]===KING)p.kw=s;else if(p.b[s]===(KING|8))p.kb=s}}
  function clone(p){return{b:new Int8Array(p.b),turn:p.turn,castle:p.castle,ep:p.ep,half:p.half,full:p.full,kw:p.kw,kb:p.kb}}

  function fromFEN(fen){
    const p=empty();const parts=fen.trim().split(/\s+/);
    let s=0;for(const ch of parts[0]){
      if(ch==='/')continue;
      if(/\d/.test(ch)){s+=+ch;continue}
      const t=LET.indexOf(ch.toUpperCase());p.b[s++]=t|(ch===ch.toLowerCase()?8:0);
    }
    p.turn=parts[1]==='b'?1:0;
    const cs=parts[2]||'-';p.castle=(cs.includes('K')?1:0)|(cs.includes('Q')?2:0)|(cs.includes('k')?4:0)|(cs.includes('q')?8:0);
    p.ep=parts[3]&&parts[3]!=='-'?sqIdx(parts[3]):-1;
    p.half=+(parts[4]||0);p.full=+(parts[5]||1);
    findKings(p);return p;
  }
  function toFEN(p){
    let out='';
    for(let r=0;r<8;r++){let e=0;for(let c=0;c<8;c++){const x=p.b[r*8+c];if(!x){e++;continue}if(e){out+=e;e=0}const l=LET[x&7];out+=x&8?l.toLowerCase():l}if(e)out+=e;if(r<7)out+='/'}
    const cs=(p.castle&1?'K':'')+(p.castle&2?'Q':'')+(p.castle&4?'k':'')+(p.castle&8?'q':'');
    return out+' '+(p.turn?'b':'w')+' '+(cs||'-')+' '+(p.ep>=0?sqName(p.ep):'-')+' '+p.half+' '+p.full;
  }

  // Is square s attacked by colour `by` (0 white, 1 black)?
  function attacked(p,s,by){
    const b=p.b,cb=by?8:0,r=s>>3,c=s&7;
    // pawns: a white pawn attacks upward, so it sits one row below
    const pr=by?r-1:r+1;
    if(pr>=0&&pr<8){if(c>0&&b[pr*8+c-1]===(PAWN|cb))return true;if(c<7&&b[pr*8+c+1]===(PAWN|cb))return true}
    const nl=NB[s];for(let i=0;i<nl.length;i++)if(b[nl[i]]===(KNIGHT|cb))return true;
    const kl=KB[s];for(let i=0;i<kl.length;i++)if(b[kl[i]]===(KING|cb))return true;
    const rays=RAYS[s];
    for(let d=0;d<8;d++){const ray=rays[d];for(let i=0;i<ray.length;i++){const x=b[ray[i]];if(!x)continue;
      if((x&8)===cb){const t=x&7;if(t===QUEEN||(d<4?t===ROOK:t===BISHOP))return true}break}}
    return false;
  }
  function inCheck(p,color){const k=color?p.kb:p.kw;return k>=0&&attacked(p,k,color^1)}

  function gen(p,capsOnly){
    const out=[],b=p.b,us=p.turn,cb=us?8:0;
    for(let s=0;s<64;s++){
      const x=b[s];if(!x||(x&8)!==cb)continue;const t=x&7;
      if(t===PAWN){
        const dir=us?8:-8,r=s>>3,c=s&7,promoRow=us?6:1,startRow=us?1:6,one=s+dir;
        const push=(to,fl)=>{if(r===promoRow){for(const pr of [QUEEN,KNIGHT,ROOK,BISHOP])out.push(mv(s,to,pr,fl))}else out.push(mv(s,to,0,fl))};
        if(b[one]===0&&(!capsOnly||r===promoRow)){push(one,0);if(!capsOnly&&r===startRow&&b[one+dir]===0)out.push(mv(s,one+dir,0,3))}
        for(const dc of[-1,1]){if(c+dc<0||c+dc>7)continue;const to=one+dc;const y=b[to];
          if(y&&(y&8)!==cb)push(to,0);else if(to===p.ep&&!y)out.push(mv(s,to,0,1))}
      }else if(t===KNIGHT||t===KING){
        const l=t===KNIGHT?NB[s]:KB[s];
        for(let i=0;i<l.length;i++){const y=b[l[i]];if(y?(y&8)!==cb:!capsOnly)out.push(mv(s,l[i]))}
        if(t===KING&&!capsOnly&&p.castle){
          const them=us^1;
          if(!us&&s===60){
            if(p.castle&1&&!b[61]&&!b[62]&&b[63]===ROOK&&!attacked(p,60,them)&&!attacked(p,61,them)&&!attacked(p,62,them))out.push(mv(60,62,0,2));
            if(p.castle&2&&!b[59]&&!b[58]&&!b[57]&&b[56]===ROOK&&!attacked(p,60,them)&&!attacked(p,59,them)&&!attacked(p,58,them))out.push(mv(60,58,0,2));
          }else if(us&&s===4){
            if(p.castle&4&&!b[5]&&!b[6]&&b[7]===(ROOK|8)&&!attacked(p,4,them)&&!attacked(p,5,them)&&!attacked(p,6,them))out.push(mv(4,6,0,2));
            if(p.castle&8&&!b[3]&&!b[2]&&!b[1]&&b[0]===(ROOK|8)&&!attacked(p,4,them)&&!attacked(p,3,them)&&!attacked(p,2,them))out.push(mv(4,2,0,2));
          }
        }
      }else{
        const d0=t===BISHOP?4:0,d1=t===ROOK?4:8,rays=RAYS[s];
        for(let d=d0;d<d1;d++){const ray=rays[d];for(let i=0;i<ray.length;i++){const y=b[ray[i]];
          if(!y){if(!capsOnly)out.push(mv(s,ray[i]));continue}
          if((y&8)!==cb)out.push(mv(s,ray[i]));break}}
      }
    }
    return out;
  }

  function make(p,m){
    const b=p.b,f=m&63,t=(m>>6)&63,pr=(m>>12)&7,fl=(m>>15)&3,x=b[f],us=p.turn;
    const u={m,cap:b[t],capSq:t,castle:p.castle,ep:p.ep,half:p.half,kw:p.kw,kb:p.kb};
    if(fl===1){u.capSq=t+(us?-8:8);u.cap=b[u.capSq];b[u.capSq]=0}
    b[t]=pr?(pr|(x&8)):x;b[f]=0;
    if(fl===2){if(t===62){b[61]=b[63];b[63]=0}else if(t===58){b[59]=b[56];b[56]=0}else if(t===6){b[5]=b[7];b[7]=0}else if(t===2){b[3]=b[0];b[0]=0}}
    if((x&7)===KING){if(us)p.kb=t;else p.kw=t}
    p.castle&=CR[f]&CR[t];
    p.ep=fl===3?(f+t)>>1:-1;
    p.half=((x&7)===PAWN||u.cap)?0:p.half+1;
    if(us)p.full++;
    p.turn^=1;
    return u;
  }
  function unmake(p,u){
    const b=p.b,m=u.m,f=m&63,t=(m>>6)&63,pr=(m>>12)&7,fl=(m>>15)&3;
    p.turn^=1;if(p.turn)p.full--;
    const x=b[t];b[f]=pr?(PAWN|(x&8)):x;b[t]=0;
    if(u.cap)b[u.capSq]=u.cap;
    if(fl===2){if(t===62){b[63]=b[61];b[61]=0}else if(t===58){b[56]=b[59];b[59]=0}else if(t===6){b[7]=b[5];b[5]=0}else if(t===2){b[0]=b[3];b[3]=0}}
    p.castle=u.castle;p.ep=u.ep;p.half=u.half;p.kw=u.kw;p.kb=u.kb;
  }
  function legal(p,capsOnly){
    const us=p.turn,out=[];
    const list=gen(p,capsOnly);
    for(let i=0;i<list.length;i++){const u=make(p,list[i]);const k=us?p.kb:p.kw;if(k<0||!attacked(p,k,us^1))out.push(list[i]);unmake(p,u)}
    return out;
  }
  function status(p){
    const moves=legal(p);
    if(!moves.length)return inCheck(p,p.turn)?'checkmate':'stalemate';
    if(insufficient(p))return'insufficient';
    if(p.half>=100)return'fifty';
    return null;
  }
  function insufficient(p){
    let minors=0,bishopsSq=[],other=0;
    for(let s=0;s<64;s++){const t=p.b[s]&7;if(!t||t===KING)continue;
      if(t===KNIGHT)minors++;else if(t===BISHOP){minors++;bishopsSq.push(((s>>3)+(s&7))&1)}else other++}
    if(other)return false;
    if(minors<=1)return true;
    // only bishops, all on the same colour
    return bishopsSq.length===minors&&bishopsSq.every(c=>c===bishopsSq[0]);
  }

  function san(p,m){
    const f=m&63,t=(m>>6)&63,pr=(m>>12)&7,fl=(m>>15)&3,x=p.b[f],type=x&7;
    let s;
    if(fl===2)s=(t&7)===6?'O-O':'O-O-O';
    else{
      const cap=p.b[t]||fl===1;
      if(type===PAWN){s=(cap?'abcdefgh'[f&7]+'x':'')+sqName(t)+(pr?'='+LET[pr]:'')}
      else{
        const others=legal(p).filter(o=>o!==m&&((o>>6)&63)===t&&p.b[o&63]===x);
        let dis='';
        if(others.length){
          const sameFile=others.some(o=>((o&63)&7)===(f&7)),sameRank=others.some(o=>((o&63)>>3)===(f>>3));
          if(!sameFile)dis='abcdefgh'[f&7];else if(!sameRank)dis=String(8-(f>>3));else dis=sqName(f);
        }
        s=LET[type]+dis+(cap?'x':'')+sqName(t);
      }
    }
    const u=make(p,m);
    if(inCheck(p,p.turn))s+=legal(p).length?'+':'#';
    unmake(p,u);
    return s;
  }
  function uci(m){return sqName(m&63)+sqName((m>>6)&63)+(((m>>12)&7)?' pnbrqk'[(m>>12)&7]:'')}
  function parseUci(p,str){
    const f=sqIdx(str.slice(0,2)),t=sqIdx(str.slice(2,4)),pr=str[4]?' pnbrqk'.indexOf(str[4]):0;
    return legal(p).find(m=>(m&63)===f&&((m>>6)&63)===t&&(((m>>12)&7)===(pr||(((m>>12)&7)?QUEEN:0))))||null;
  }
  function parseSan(p,str){
    const clean=s=>s.replace(/[+#!?]/g,'').replace(/^0-0-0$/,'O-O-O').replace(/^0-0$/,'O-O');
    const want=clean(str.replace(/^\d+\.+\s*/,''));
    return legal(p).find(m=>clean(san(p,m))===want)||null;
  }

  /* ── Search ── */
  const VAL=[0,100,320,330,500,900,0];
  // Simplified piece-square tables (white's view, row 0 = rank 8)
  const PST=[[],
    [0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
    [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
    [-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
    [0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
    [-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
    [-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20]];
  const KING_END=[-50,-40,-30,-20,-20,-30,-40,-50,-30,-20,-10,0,0,-10,-20,-30,-30,-10,20,30,30,20,-10,-30,-30,-10,30,40,40,30,-10,-30,-30,-10,30,40,40,30,-10,-30,-30,-10,20,30,30,20,-10,-30,-30,-30,0,0,0,0,-30,-30,-50,-30,-30,-30,-30,-30,-30,-50];
  function material(p){let w=0,bl=0;for(let s=0;s<64;s++){const x=p.b[s];if(!x)continue;if(x&8)bl+=VAL[x&7];else w+=VAL[x&7]}return w-bl}
  function evaluate(p){
    let sc=0,heavy=0;
    for(let s=0;s<64;s++){const x=p.b[s]&7;if(x>=KNIGHT&&x<=QUEEN)heavy+=VAL[x]}
    const end=heavy<=1300;
    for(let s=0;s<64;s++){
      const x=p.b[s];if(!x)continue;const t=x&7,black=x&8;
      const ps=black?((7-(s>>3))*8+(s&7)):s;
      const v=VAL[t]+(t===KING?(end?KING_END[ps]:PST[KING][ps]):PST[t][ps]);
      sc+=black?-v:v;
    }
    return p.turn?-sc:sc;
  }
  const MATE=100000;
  function order(p,list){
    return list.map(m=>{const v=p.b[(m>>6)&63];let k=0;if(v)k=10*VAL[v&7]-VAL[p.b[m&63]&7];if((m>>12)&7)k+=800;return[k,m]}).sort((a,b)=>b[0]-a[0]).map(a=>a[1]);
  }
  function makeSearcher(opts){
    opts=opts||{};
    const deadline=opts.deadline||Infinity;let nodes=0,stopped=false;
    function q(p,alpha,beta,depth){
      nodes++;
      const stand=evaluate(p);
      if(stand>=beta)return beta;
      if(stand>alpha)alpha=stand;
      if(depth>6)return alpha;
      const list=order(p,gen(p,true));
      const us=p.turn;
      for(const m of list){
        const u=make(p,m);const k=us?p.kb:p.kw;
        if(k>=0&&attacked(p,k,us^1)){unmake(p,u);continue}
        const sc=-q(p,-beta,-alpha,depth+1);unmake(p,u);
        if(sc>=beta)return beta;if(sc>alpha)alpha=sc;
      }
      return alpha;
    }
    function ab(p,depth,alpha,beta,ply){
      if((++nodes&1023)===0&&Date.now()>deadline)stopped=true;
      if(stopped)return 0;
      if(depth<=0)return opts.noQ?evaluate(p):q(p,alpha,beta,0);
      const list=order(p,gen(p));
      const us=p.turn;let any=false;
      for(const m of list){
        const u=make(p,m);const k=us?p.kb:p.kw;
        if(k>=0&&attacked(p,k,us^1)){unmake(p,u);continue}
        any=true;
        const sc=-ab(p,depth-1,-beta,-alpha,ply+1);unmake(p,u);
        if(stopped)return 0;
        if(sc>=beta)return beta;if(sc>alpha)alpha=sc;
      }
      if(!any)return inCheck(p,us)?-MATE+ply:0;
      if(p.half>=100)return 0;
      return alpha;
    }
    // Score every root move (from the mover's view)
    function rootScores(p,depth){
      const out=[];
      for(const m of order(p,legal(p))){
        const u=make(p,m);const sc=-ab(p,depth-1,-MATE-1,MATE+1,1);unmake(p,u);
        if(stopped)break;
        out.push({m,score:sc});
      }
      return out;
    }
    return{ab,q,rootScores,get nodes(){return nodes},get stopped(){return stopped}};
  }
  // Best move: iterative deepening up to maxDepth within timeMs.
  function bestMove(p,maxDepth,timeMs,noise){
    const deadline=Date.now()+(timeMs||1500);
    let best=null;
    for(let d=1;d<=maxDepth;d++){
      const S=makeSearcher({deadline});
      const sc=S.rootScores(p,d);
      if(S.stopped&&best)break;
      if(!sc.length)break;
      if(noise)sc.forEach(o=>{if(Math.abs(o.score)<MATE-1000)o.score+=(Math.random()*2-1)*noise});
      sc.sort((a,b)=>b.score-a.score);
      best=sc[0];best.all=sc;
      if(Math.abs(best.score)>MATE-1000)break;
    }
    return best;
  }
  // Can the side to move force mate within n of its own moves?
  function mateIn(p,n){
    const us=p.turn;
    for(const m of legal(p)){
      const u=make(p,m);
      const ok=forcedAfter(p,n-1);
      unmake(p,u);
      if(ok)return m;
    }
    return 0;
  }
  // Opponent to move: is every reply mated within n more attacker moves?
  function forcedAfter(p,n){
    const replies=legal(p);
    if(!replies.length)return inCheck(p,p.turn);
    if(n<=0)return false;
    for(const r of replies){const u=make(p,r);const ok=mateIn(p,n)!==0;unmake(p,u);if(!ok)return false}
    return true;
  }

  return{PAWN,KNIGHT,BISHOP,ROOK,QUEEN,KING,LET,VAL,MATE,empty,clone,fromFEN,toFEN,findKings,attacked,inCheck,gen,legal,make,unmake,status,insufficient,san,uci,parseUci,parseSan,evaluate,material,makeSearcher,bestMove,mateIn,forcedAfter,mFrom,mTo,mPromo,mFlag,sqName,sqIdx,mv};
})();


// ── Board helpers (UI boards are 8×8 arrays of {piece,color} | null) ──
const P={K:'K',Q:'Q',R:'R',B:'B',N:'N',P:'P'};
const UNICODE={wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'};
function pieceChar(piece,color){return UNICODE[(color||'w')+piece]||''}
const PIECE_VALUES={P:1,N:3,B:3,R:5,Q:9,K:0};
const PIECE_NAMES={P:'pawn',N:'knight',B:'bishop',R:'rook',Q:'queen',K:'king'};
const _TYPE={P:1,N:2,B:3,R:4,Q:5,K:6};

function newBoard(){
  const b=Array(8).fill(null).map(()=>Array(8).fill(null));
  const back=['R','N','B','Q','K','B','N','R'];
  for(let c=0;c<8;c++){
    b[0][c]={piece:back[c],color:'b'};
    b[1][c]={piece:'P',color:'b'};
    b[6][c]={piece:'P',color:'w'};
    b[7][c]={piece:back[c],color:'w'};
  }
  return b;
}
function emptyBoard(){return Array(8).fill(null).map(()=>Array(8).fill(null))}
function cloneBoard(b){return b.map(function(r){return r.map(function(s){return s?Object.assign({},s):null;});})}
function inBounds(r,c){return r>=0&&r<8&&c>=0&&c<8}

function boardToPos(board,turn,state){
  const p=CQE.empty();
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){const s=board[r][c];if(s)p.b[r*8+c]=_TYPE[s.piece]|(s.color==='b'?8:0)}
  p.turn=(turn==='b'||turn===1)?1:0;
  if(state){p.castle=state.castle||0;p.ep=state.ep==null?-1:state.ep}
  CQE.findKings(p);
  return p;
}
function posToBoard(p){
  const b=emptyBoard();
  for(let s=0;s<64;s++){const x=p.b[s];if(x)b[s>>3][s&7]={piece:CQE.LET[x&7],color:x&8?'b':'w'}}
  return b;
}
function moveObj(p,m){
  const f=m&63,t=(m>>6)&63,fl=CQE.mFlag(m);
  return{fr:f>>3,fc:f&7,tr:t>>3,tc:t&7,type:(p.b[t]||fl===1)?'capture':'move',m:m,flag:fl,promo:CQE.mPromo(m)};
}
// Moves for the piece on (r,c). Promotions are listed once (as a queen).
function movesFromPos(p,from,checkLegal){
  const keep=p.turn;p.turn=(p.b[from]&8)?1:0;
  const own=p.turn?p.kb:p.kw;
  const list=(checkLegal&&own>=0?CQE.legal(p):CQE.gen(p)).filter(m=>(m&63)===from&&(!CQE.mPromo(m)||CQE.mPromo(m)===CQE.QUEEN));
  const out=list.map(m=>moveObj(p,m));
  p.turn=keep;
  return out;
}
function getMoves(board,r,c,checkLegal=true,state){
  const s=board[r]&&board[r][c];if(!s)return[];
  return movesFromPos(boardToPos(board,s.color,state),r*8+c,checkLegal);
}
function allMoves(board,color,state){
  const p=boardToPos(board,color,state);
  return CQE.legal(p).filter(m=>!CQE.mPromo(m)||CQE.mPromo(m)===CQE.QUEEN).map(m=>moveObj(p,m));
}
function isInCheck(board,color){const p=boardToPos(board,color);return CQE.inCheck(p,p.turn)}
function isCheckmate(board,color){const p=boardToPos(board,color);return CQE.inCheck(p,p.turn)&&!CQE.legal(p).length}
function isStalemate(board,color){const p=boardToPos(board,color);return!CQE.inCheck(p,p.turn)&&!CQE.legal(p).length}
function kingSquare(p,color){const k=color?p.kb:p.kw;return k>=0?[k>>3,k&7]:null}
function checkSquareOf(p){return CQE.inCheck(p,p.turn)?kingSquare(p,p.turn):null}
function lastMoveObj(m){if(!m)return null;const f=m&63,t=(m>>6)&63;return{fr:f>>3,fc:f&7,tr:t>>3,tc:t&7}}
function pieceWord(x){return PIECE_NAMES[CQE.LET[x&7]]||'piece'}

// ── Render board (art + animation live in js/chess-quest-art.js) ──
function renderBoard(boardEl,board,options={}){
  if(!boardEl)return;
  if(window.CQBoard){window.CQBoard.render(boardEl,board,options);return}
  boardEl.innerHTML='';
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const sq=document.createElement('button');sq.type='button';
    sq.className='sq '+((r+c)%2===0?'light':'dark');
    const p=board[r][c];if(p)sq.textContent=pieceChar(p.piece,p.color);
    if(options.onClick)sq.onclick=()=>options.onClick(r,c);
    boardEl.appendChild(sq);
  }
}
function pieceIcon(code,cls){return window.CQArt?CQArt.pieceSVG(code,cls):'<span>'+pieceChar(code[1],code[0])+'</span>'}

// ── Screen nav ──
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const target=document.getElementById('screen-'+id);
  if(target)target.classList.add('active');
  window.scrollTo(0,0);
}
function goMenu(){_stopTimers();updateMenuBadges();showScreen('menu')}
function showFeedback(emoji){
  const el=document.getElementById('feedback');
  if(!el)return;
  const inner=el.querySelector('span')||el;
  inner.textContent=emoji;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),900);
}
let _timers=[];
function _later(fn,ms){const t=setTimeout(fn,ms);_timers.push(t);return t}
function _stopTimers(){_timers.forEach(clearTimeout);_timers=[];if(typeof Lesson!=='undefined')Lesson.stop();if(window.ChessExtras&&ChessExtras.Rush.stop)ChessExtras.Rush.stop()}
function _sfx(name){try{if(typeof SFX!=='undefined'&&SFX[name])SFX[name]()}catch(e){}}

// Coach bubble: kind = '' | 'good' | 'warn' | 'bad'; actions = [{label, cls, fn}]
function setCoach(elId,html,kind,actions,name){
  const el=document.getElementById(elId);if(!el)return;
  if(!html){el.style.display='none';el.innerHTML='';return}
  el.style.display='';
  el.className='coach'+(kind?' '+kind:'');
  el.innerHTML='<div class="coach-face" aria-hidden="true">'+pieceIcon('wK')+'</div><div class="coach-text"><span class="coach-name">'+_esc(name||'Coach')+'</span>'+html+
    (actions&&actions.length?'<div class="coach-actions">'+actions.map((a,i)=>'<button type="button" class="btn '+(a.cls||'btn-outline')+'" data-i="'+i+'">'+_esc(a.label)+'</button>').join('')+'</div>':'')+'</div>';
  if(actions)el.querySelectorAll('.coach-actions button').forEach(b=>{b.onclick=()=>actions[+b.dataset.i].fn()});
}

// Promotion choice: resolves with a piece type (5 Q, 4 R, 3 B, 2 N)
function pickPromotion(color){
  return new Promise(resolve=>{
    const ov=document.createElement('div');ov.className='promo-pick';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Choose a piece for promotion');
    const opts=[[5,'Q','Queen'],[4,'R','Rook'],[3,'B','Bishop'],[2,'N','Knight']];
    ov.innerHTML='<div class="pp-card"><h3>Promote your pawn to…</h3><div class="pp-row">'+opts.map(o=>'<button type="button" data-t="'+o[0]+'" aria-label="'+o[2]+'">'+pieceIcon(color+o[1])+o[2]+'</button>').join('')+'</div></div>';
    document.body.appendChild(ov);
    ov.querySelectorAll('button').forEach(b=>{b.onclick=()=>{ov.remove();resolve(+b.dataset.t)}});
    const first=ov.querySelector('button');if(first)first.focus();
  });
}

/* ================================================================
   PUZZLE HELPERS (shared with Puzzle Rush in chess-extras.js)
   ================================================================ */
const CQPuzzle={
  setup(pz){
    if(pz.fen)return CQE.fromFEN(pz.fen);
    const b=emptyBoard();pz.board(b);return boardToPos(b,'w');
  },
  line(pz){
    if(pz.line)return pz.line.slice();
    const s=pz.solution;return[CQE.sqName(s.fr*8+s.fc)+CQE.sqName(s.tr*8+s.tc)];
  },
  // 'mate' (mate in 1), 'mate2', or 'material'
  goal(pz,pos){
    if(pz._goal)return pz._goal;
    let g=pz.goal;
    if(!g){
      const p=CQE.clone(pos||CQPuzzle.setup(pz));const m=CQE.parseUci(p,CQPuzzle.line(pz)[0]);
      g='material';
      if(m){const u=CQE.make(p,m);if(CQE.status(p)==='checkmate')g='mate';CQE.unmake(p,u)}
    }
    pz._goal=g;return g;
  },
  whiteMoves(pz,pos){const g=CQPuzzle.goal(pz,pos);return g==='mate'?1:g==='mate2'?2:Math.ceil(CQPuzzle.line(pz).length/2)},
  // Score of one move for the side to move (search to `depth` plies)
  scoreMove(pos,m,depth){
    const S=CQE.makeSearcher({deadline:Date.now()+1500});
    const u=CQE.make(pos,m);const sc=-S.ab(pos,depth-1,-CQE.MATE-1,CQE.MATE+1,1);CQE.unmake(pos,u);return sc;
  },
  // Is `m` a good move at this point? movesLeft = white moves still to play, including m.
  accepts(pz,pos,m,expected,movesLeft){
    if(expected&&m===expected)return true;
    const g=CQPuzzle.goal(pz,pos);
    const p=pos;
    if(g==='mate'||g==='mate2'){
      const u=CQE.make(p,m);
      const ok=movesLeft<=1?CQE.status(p)==='checkmate':CQE.forcedAfter(p,movesLeft-1);
      CQE.unmake(p,u);return ok;
    }
    const u0=CQE.make(p,m);const mates=CQE.status(p)==='checkmate';const matM=CQE.material(p);CQE.unmake(p,u0);
    if(mates)return true;
    let exp=expected;
    if(!exp){const b=CQE.bestMove(p,3,900);exp=b?b.m:0}
    if(!exp)return false;
    // the last move must actually collect the material (a capture), not just keep the threat
    if(movesLeft<=1){const u1=CQE.make(p,exp);const matE=CQE.material(p);CQE.unmake(p,u1);if(matM<matE-50)return false}
    return CQPuzzle.scoreMove(p,m,4)>=CQPuzzle.scoreMove(p,exp,4)-60;
  },
  // Puzzle Rush: is this a correct first move?
  firstMoveOK(pz,pos,m){
    const exp=CQE.parseUci(pos,CQPuzzle.line(pz)[0]);
    return CQPuzzle.accepts(pz,CQE.clone(pos),m,exp,CQPuzzle.whiteMoves(pz,pos));
  }
};

/* ================================================================
   COACH — plain-language explanations of moves
   ================================================================ */
const Coach={
  sq:s=>CQE.sqName(s),
  // Why a move does not work in a puzzle (pos is BEFORE the move)
  whyWrong(pz,pos,m){
    const g=CQPuzzle.goal(pz,pos);const p=CQE.clone(pos);
    const mover=pieceWord(p.b[m&63]);
    CQE.make(p,m);
    const replies=CQE.legal(p);
    if(g==='mate'||g==='mate2'){
      if(!CQE.inCheck(p,1)&&g==='mate')return{text:'That move does not give check. A checkmate always starts with a <b>check</b> — look for a move that attacks the King.'};
      if(CQE.inCheck(p,1)){
        const kingMove=replies.find(r=>(p.b[r&63]&7)===CQE.KING&&!(p.b[(r>>6)&63]));
        const cap=replies.find(r=>((r>>6)&63)===((m>>6)&63));
        if(cap)return{text:'Check! But Black can capture your '+mover+' with the '+pieceWord(p.b[cap&63])+'.',reply:cap};
        if(kingMove)return{text:'Check! But the King escapes to <b>'+Coach.sq((kingMove>>6)&63)+'</b>.',reply:kingMove};
        if(replies.length)return{text:'Check! But Black can block it with '+_esc(CQE.san(p,replies[0]))+'.',reply:replies[0]};
      }
      const best=CQE.bestMove(p,2,600);
      return{text:'Black has a defence: <b>'+_esc(best?CQE.san(p,best.m):'')+'</b>. '+CQData.THEME_TIP[g==='mate2'?'mate2':'mate'],reply:best&&best.m};
    }
    const best=CQE.bestMove(p,2,600);
    if(best){
      const t=(best.m>>6)&63,x=p.b[t];
      if(best.score>CQE.MATE-1000)return{text:'Watch out — that would let Black give checkmate!',reply:best.m};
      if(x)return{text:'Careful — Black can capture your '+pieceWord(x)+' on <b>'+Coach.sq(t)+'</b> with the '+pieceWord(p.b[best.m&63])+'.',reply:best.m};
    }
    return{text:'That move is safe, but it does not win anything. '+(CQData.THEME_TIP[pz.theme]||CQData.THEME_TIP.material),reply:best&&best.m};
  },
  // Why a move is good (used for hints in Play)
  whyGood(pos,m){
    const p=CQE.clone(pos),us=p.turn,f=m&63,t=(m>>6)&63,x=p.b[f],cap=p.b[t],fl=CQE.mFlag(m);
    const reasons=[];
    const wasAttacked=CQE.attacked(p,f,us^1)&&(x&7)!==CQE.KING;
    const defended=cap?CQE.attacked(p,t,us^1):false;
    const u=CQE.make(p,m);
    const st=CQE.status(p);
    if(st==='checkmate'){CQE.unmake(p,u);return'It is <b>checkmate</b>!'}
    if(fl===2)reasons.push('castling tucks your King into safety');
    if(CQE.mPromo(m))reasons.push('it promotes your pawn');
    if(cap)reasons.push('it captures the '+pieceWord(cap)+' on '+Coach.sq(t)+(defended?'':' for free'));
    if(fl===1)reasons.push('it captures a pawn en passant');
    if(CQE.inCheck(p,p.turn))reasons.push('it gives check');
    if(!cap&&wasAttacked&&!CQE.attacked(p,t,us^1))reasons.push('it moves your '+pieceWord(x)+' out of danger');
    CQE.unmake(p,u);
    const backRank=us?0:7;
    if(!reasons.length&&((x&7)===CQE.KNIGHT||(x&7)===CQE.BISHOP)&&(f>>3)===backRank)reasons.push('it brings a new piece into the game');
    if(!reasons.length&&(x&7)===CQE.PAWN&&[27,28,35,36].includes(t))reasons.push('it takes control of the centre');
    if(!reasons.length)reasons.push('it improves your position — the coach\'s favourite here');
    const txt=reasons.slice(0,2).join(', and ');
    return txt.charAt(0).toUpperCase()+txt.slice(1)+'.';
  },
  // What the opponent threatens after a move (pos AFTER the move, opponent to move)
  threat(p,reply){
    const t=(reply>>6)&63,x=p.b[t];
    const q=CQE.clone(p);CQE.make(q,reply);
    if(CQE.status(q)==='checkmate')return'Black could answer with <b>'+_esc(CQE.san(p,reply))+'</b> — checkmate!';
    if(x){
      const prot=CQE.attacked(p,t,p.turn^1);
      return'The '+pieceWord(p.b[reply&63])+' could capture your '+pieceWord(x)+' on <b>'+Coach.sq(t)+'</b>'+(prot?'':' — and nothing protects it')+'.';
    }
    return'The computer would have a strong reply: <b>'+_esc(CQE.san(p,reply))+'</b>.';
  }
};

/* ================================================================
   MENU
   ================================================================ */
function init(){
  if (typeof CloudSync !== 'undefined' && CloudSync.online) {
    const k = getUserKey();
    if (k) CloudSync.pull(k);
  }
  if(window.CQArt){CQArt.ensureDefs();CQArt.ensureWood()}
  const hero=document.getElementById('cqHero');
  if(hero&&window.CQArt)hero.innerHTML=CQArt.heroMarkup();
  document.querySelectorAll('[data-piece]').forEach(el=>{el.innerHTML=pieceIcon(el.getAttribute('data-piece'))});
  const user=typeof getActiveUser==='function'?getActiveUser():null;
  const greetEl=document.getElementById('greeting');
  if(user&&greetEl)greetEl.textContent="Let's play, "+user.name+"!";
  updateMenuBadges();
}

function updateMenuBadges(){
  const prog=getUserProgress();
  const learned=(prog.learnedPieces||[]).length;
  const spec=(prog.learnedSpecial||[]).length;
  const learnEl=document.getElementById('learnBadge');
  if(learnEl){
    learnEl.textContent=learned>0?`${learned}/6 pieces learned`+(spec?` · ${spec}/${CQData.SPECIALS.length} special moves`:''):'Start here!';
    learnEl.className='m-badge '+(learned>0?'prog':'rec');
  }
  const solved=Math.min(prog.puzzlesSolved||0,PUZZLES.length);
  const puzzleEl=document.getElementById('puzzleBadge');
  if(puzzleEl) puzzleEl.textContent=`${solved}/${PUZZLES.length} solved`;
  const wins=prog.wins||0,losses=prog.losses||0,draws=prog.draws||0;
  const total=wins+losses+draws;
  const playEl=document.getElementById('playBadge');
  if(playEl) playEl.textContent=total>0?`${wins}W ${losses}L ${draws}D`:'';
  const trainerEl=document.getElementById('trainerBadge');
  if(trainerEl){
    const tb=prog.trainerBest;
    trainerEl.textContent=tb&&tb>1?`Level ${tb}`:'New!';
    trainerEl.className='m-badge '+(tb&&tb>1?'prog':'rec');
  }
  const rushEl=document.getElementById('rushBadge');
  if(rushEl)rushEl.textContent=prog.rushBest&&prog.rushBest.score?`Best: ${prog.rushBest.score}`:'';
  const opEl=document.getElementById('openingsBadge');
  if(opEl){const n=Object.keys(prog.openings||{}).length;opEl.textContent=n?`${n} studied`:''}
  const st=document.getElementById('cqStats');
  if(st)st.innerHTML='<div class="cq-stat cq-card"><b>'+solved+'</b><span>puzzles</span></div><div class="cq-stat cq-card"><b>'+wins+'</b><span>wins</span></div><div class="cq-stat cq-card"><b>'+(learned+spec)+'</b><span>lessons</span></div>';
}

/* ================================================================
   LEARN MODE — animated demonstrations + "your turn"
   ================================================================ */
const PIECE_LESSONS=CQData.LESSONS;
let currentLesson=0;

function openLearn(){
  _stopTimers();
  const prog=getUserProgress();
  const learned=prog.learnedPieces||[],spec=prog.learnedSpecial||[];
  const grid=document.getElementById('pieceGrid'),sg=document.getElementById('specialGrid');
  if(!grid)return;
  grid.innerHTML=PIECE_LESSONS.map((l,i)=>'<button type="button" class="piece-card'+(learned.includes(l.piece)?' completed':'')+'" onclick="openLesson('+i+')" aria-label="'+_esc(l.name)+' lesson'+(learned.includes(l.piece)?' (done)':'')+'"><span class="p-icon">'+pieceIcon('w'+l.piece)+'</span><div class="p-name">'+_esc(l.name)+'</div><div class="p-val">Value: '+_esc(l.value)+'</div></button>').join('');
  if(sg)sg.innerHTML=CQData.SPECIALS.map(l=>'<button type="button" class="piece-card'+(spec.includes(l.id)?' completed':'')+'" onclick="openSpecial(\''+l.id+'\')" aria-label="'+_esc(l.name)+' lesson'+(spec.includes(l.id)?' (done)':'')+'"><span class="p-icon">'+pieceIcon(l.icon)+'</span><div class="p-name">'+_esc(l.name)+'</div><div class="p-val">Special rule</div></button>').join('');
  showScreen('learn');
}

const Lesson={
  L:null,timer:null,
  stop(){if(this.timer)clearTimeout(this.timer);this.timer=null},
  open(lesson,kind,idx){
    this.stop();
    this.L={lesson,kind,idx,pos:CQE.fromFEN(lesson.fen),step:0,mode:'demo',selected:null,last:null,moves:0,done:false,busy:false};
    const t=document.getElementById('lessonTitle');if(t)t.textContent=lesson.name;
    const ic=document.getElementById('lessonIcon');if(ic)ic.innerHTML=pieceIcon(kind==='piece'?'w'+lesson.piece:lesson.icon);
    const info=document.getElementById('lessonInfo');
    if(info)info.innerHTML='<h3>'+(kind==='piece'?'How the '+_esc(lesson.name)+' moves':_esc(lesson.name))+'</h3><p>'+_esc(lesson.desc)+'</p><div class="tip">💡 '+_esc(lesson.tip)+'</div>';
    const nb=document.getElementById('lessonNextBtn');
    if(nb){
      const list=kind==='piece'?PIECE_LESSONS:CQData.SPECIALS;
      const i=kind==='piece'?idx:CQData.SPECIALS.indexOf(lesson);
      nb.textContent=i<list.length-1?'Next lesson →':(kind==='piece'?'Special moves →':'All lessons');
    }
    showScreen('lesson');
    const el=document.getElementById('learnBoard');if(el){el._cqPrev=null}
    this.render({animate:false});
    this.caption('Watch the demonstration…','');
    this.timer=setTimeout(()=>this.next(),700);
  },
  caption(txt,cls,stepNo){
    const c=document.getElementById('demoCap');if(!c)return;
    c.className='demo-cap'+(cls?' '+cls:'');
    c.innerHTML=(stepNo?'<span class="step">'+stepNo+'.</span>':'')+_esc(txt);
  },
  render(o){
    const L=this.L;const el=document.getElementById('learnBoard');if(!el||!L)return;
    o=o||{};
    const opts=Object.assign({lastMove:lastMoveObj(L.last),checkSquare:L.pos.kb>=0&&CQE.inCheck(L.pos,1)?kingSquare(L.pos,1):(L.pos.kw>=0&&CQE.inCheck(L.pos,0)?kingSquare(L.pos,0):null)},o);
    if(L.mode==='try')opts.onClick=(r,c)=>this.click(r,c);
    renderBoard(el,posToBoard(L.pos),opts);
  },
  dots(from){
    const L=this.L;const ms=movesFromPos(L.pos,from,true);
    return{selected:[from>>3,from&7],moveDots:ms.filter(m=>m.type==='move').map(m=>[m.tr,m.tc]),captureDots:ms.filter(m=>m.type==='capture').map(m=>[m.tr,m.tc]),list:ms};
  },
  play(uci){
    const L=this.L;const f=CQE.sqIdx(uci.slice(0,2));
    L.pos.turn=(L.pos.b[f]&8)?1:0;
    const t=CQE.sqIdx(uci.slice(2,4)),pr=uci[4]?' pnbrqk'.indexOf(uci[4]):0;
    const own=L.pos.turn?L.pos.kb:L.pos.kw;
    const m=(own>=0?CQE.legal(L.pos):CQE.gen(L.pos)).find(x=>(x&63)===f&&((x>>6)&63)===t&&(!pr||CQE.mPromo(x)===pr));
    if(!m)return;
    CQE.make(L.pos,m);L.last=m;
  },
  next(){
    const L=this.L;if(!L||L.mode!=='demo')return;
    const st=L.lesson.demo[L.step];
    if(!st){this.startTry();return}
    if(st.fen){L.pos=CQE.fromFEN(st.fen);L.last=null;this.render({animate:false})}
    if(st.show){this.render(this.dots(CQE.sqIdx(st.show)))}
    if(st.move){this.play(st.move);this.render()}
    this.caption(st.cap,'',L.step+1);
    L.step++;
    this.timer=setTimeout(()=>this.next(),st.move?2200:2600);
  },
  replay(){if(!this.L)return;const l=this.L.lesson;this.open(l,this.L.kind,this.L.idx)},
  startTry(){
    const L=this.L;if(!L)return;
    this.stop();
    L.mode='try';L.pos=CQE.fromFEN(L.lesson.try.fen);L.last=null;L.selected=null;L.moves=0;L.done=false;
    const el=document.getElementById('learnBoard');
    this.render({animate:false});
    this.caption(L.lesson.try.cap,'try');
  },
  async click(r,c){
    const L=this.L;if(!L||L.busy)return;
    const s=r*8+c,x=L.pos.b[s];
    L.pos.turn=0;
    if(L.selected!=null){
      const d=this.dots(L.selected);
      const mv=d.list.find(m=>m.tr===r&&m.tc===c);
      if(mv){
        let m=mv.m;
        if(mv.promo){L.busy=true;const t=await pickPromotion('w');L.busy=false;m=CQE.legal(L.pos).concat(CQE.gen(L.pos)).find(z=>(z&63)===(m&63)&&((z>>6)&63)===((m>>6)&63)&&CQE.mPromo(z)===t)||m}
        CQE.make(L.pos,m);L.last=m;L.selected=null;L.moves++;
        this.render();
        this.checkGoal(m);
        return;
      }
    }
    if(x&&!(x&8)){L.selected=s;this.render(this.dots(s));_sfx('click')}
    else{L.selected=null;this.render()}
  },
  checkGoal(m){
    const L=this.L,g=L.lesson.try.goal;
    let ok=false;
    if(g==='free')ok=L.moves>=3;
    else if(g==='castle')ok=CQE.mFlag(m)===2;
    else if(g==='ep')ok=CQE.mFlag(m)===1;
    else if(g==='promo')ok=CQE.mPromo(m)>0;
    else if(g==='mate'){L.pos.turn=1;ok=CQE.status(L.pos)==='checkmate';L.pos.turn=0}
    if(!ok){
      if(g==='free')this.caption(['Nice move!','Good — keep going!','Great, one more!'][Math.min(2,L.moves-1)],'try');
      else if(g==='mate')this.caption('Not checkmate yet — tap ↺ to try again.','try');
      else if(g==='ep'&&L.moves>=1)this.caption('That was not the en passant capture. Tap ↺ and try again.','try');
      else if(g==='castle'&&L.moves>=1)this.caption('Not castling yet. Tap ↺ — then move the King two squares.','try');
      return;
    }
    if(L.done)return;
    L.done=true;
    this.caption(g==='free'?'You\'ve got it! Try the next lesson when you\'re ready.':'You did it! ⭐','done');
    _sfx('cheer');showFeedback('⭐');
    if(L.kind==='special'){
      const prog=getUserProgress();const set=new Set(prog.learnedSpecial||[]);set.add(L.lesson.id);
      saveProgress({learnedSpecial:Array.from(set)});
      if(typeof ActivityLog!=='undefined')ActivityLog.log('Chess Quest','♟️','Learned '+L.lesson.name);
    }
  },
  resetTry(){if(this.L)this.startTry()}
};

function openLesson(idx){
  currentLesson=idx;
  const l=PIECE_LESSONS[idx];
  const prog=getUserProgress();
  const learned=new Set(prog.learnedPieces||[]);
  learned.add(l.piece);
  saveProgress({learnedPieces:Array.from(learned)});
  Lesson.open(l,'piece',idx);
}
function openSpecial(id){
  const l=CQData.SPECIALS.find(s=>s.id===id);if(l)Lesson.open(l,'special',CQData.SPECIALS.indexOf(l));
}
function nextLesson(){
  const L=Lesson.L;
  if(!L)return openLearn();
  if(L.kind==='piece'){if(L.idx<PIECE_LESSONS.length-1)openLesson(L.idx+1);else openSpecial(CQData.SPECIALS[0].id)}
  else{const i=CQData.SPECIALS.indexOf(L.lesson);if(i<CQData.SPECIALS.length-1)openSpecial(CQData.SPECIALS[i+1].id);else openLearn()}
}

/* ================================================================
   PUZZLE MODE — a ladder; puzzle N unlocks after puzzle N-1
   ================================================================ */
const PUZZLES=[
  {name:'Checkmate in 1 #1',hint:'White to move — checkmate!',tier:'intermediate',ch:'starter',theme:'mate',fen:'4k3/R7/8/8/8/8/8/4K2Q w - - 0 1',line:['h1h8'],after:'Qh8 is checkmate! The Rook on a7 guards the whole 7th rank, so the King cannot step forward, and the Queen controls the back rank.'},
  {name:'Checkmate in 1 #2',hint:'White to move — checkmate!',tier:'intermediate',ch:'starter',theme:'mate',fen:'7k/5p1p/8/5N2/8/6Q1/8/4K3 w - - 0 1',line:['g3g7'],after:'Queen to g7 is checkmate! The Knight on f5 protects her, so the King cannot capture, and the pawns block the King\'s escape.'},
  {name:'Win the Queen!',hint:'White can capture Black\'s Queen for free!',tier:'beginner',ch:'starter',theme:'material',fen:'4k3/8/8/4q3/8/3N4/8/6K1 w - - 0 1',line:['d3e5'],after:'Nxe5 wins the Queen! Knights jump in an L-shape — always check what your knights can capture.'},
  {name:'Checkmate in 1 #3',hint:'White to move — checkmate the King!',tier:'advanced',ch:'starter',theme:'mate',fen:'3rkn2/4p3/8/8/8/4R3/4R3/4K3 w - - 0 1',line:['e3e7'],after:'Rook takes pawn with check, and it\'s checkmate! The second Rook protects it, and Black\'s own pieces on d8 and f8 box the King in.'},
  {name:'Win Material',hint:'White can win a free piece! Find it.',tier:'beginner',board:b=>{b[0][4]={piece:'K',color:'b'};b[7][4]={piece:'K',color:'w'};b[3][3]={piece:'B',color:'b'};b[3][5]={piece:'N',color:'b'};b[4][4]={piece:'P',color:'w'};b[5][1]={piece:'B',color:'w'}},solution:{fr:5,fc:1,tr:3,tc:3},after:'Bishop takes Bishop — a free piece! It was undefended.',ch:'starter',theme:'material'},
  {name:'Checkmate in 1 #4',hint:'Deliver checkmate in one move!',tier:'intermediate',ch:'starter',theme:'mate',fen:'5rk1/5ppp/8/6N1/7Q/8/8/4K3 w - - 0 1',line:['h4h7'],after:'Qxh7 is checkmate! The Knight on g5 protects the Queen, and the Rook on f8 blocks the King\'s escape.'},
  {name:'Royal Fork',hint:'White to move — one knight move wins the Queen!',tier:'intermediate',board:b=>{b[0][4]={piece:'K',color:'b'};b[1][3]={piece:'Q',color:'b'};b[3][3]={piece:'N',color:'w'};b[7][6]={piece:'K',color:'w'}},solution:{fr:3,fc:3,tr:2,tc:5},line:['d5f6','e8f8','f6d7'],after:'Nf6+ is a royal fork! The knight checks the King on e8 and attacks the Queen on d7 at the same time. The King must move, then Nxd7 wins the Queen.',ch:'starter',theme:'fork'},
  {name:'Knight Fork: Win the Rook',hint:'A knight jump forks two big pieces.',tier:'intermediate',board:b=>{b[0][0]={piece:'K',color:'b'};b[0][4]={piece:'R',color:'b'};b[3][1]={piece:'N',color:'w'};b[7][6]={piece:'K',color:'w'}},solution:{fr:3,fc:1,tr:1,tc:2},line:['b5c7','a8b7','c7e8'],after:'Nc7+ forks the King on a8 and the Rook on e8. After the King moves out of check, Nxe8 grabs the Rook for free.',ch:'starter',theme:'fork'},
  {name:'Skewer: Win the Rook',hint:'Check the King so the piece behind it falls.',tier:'advanced',ch:'starter',theme:'skewer',fen:'2k4r/6p1/8/8/8/8/8/Q5K1 w - - 0 1',line:['a1a8','c8c7','a8h8'],after:'Qa8+ is a skewer: the Queen checks the King along the 8th rank, and the Rook on h8 is lined up right behind it. The King steps aside and Qxh8 wins the Rook.'},
  {name:'Back-Rank Mate',hint:'The King is trapped behind its own pawns.',tier:'intermediate',board:b=>{b[0][6]={piece:'K',color:'b'};b[1][5]={piece:'P',color:'b'};b[1][6]={piece:'P',color:'b'};b[1][7]={piece:'P',color:'b'};b[7][0]={piece:'R',color:'w'};b[7][6]={piece:'K',color:'w'}},solution:{fr:7,fc:0,tr:0,tc:0},after:'Ra8 is checkmate! The pawns on f7, g7 and h7 block the King\'s escape, so the Rook on the back rank ends the game. This is the classic back-rank mate.',ch:'starter',theme:'mate'},
  {name:'Discovered Attack',hint:'Move the bishop and uncover a hidden attacker.',tier:'advanced',ch:'starter',theme:'discovered',fen:'k7/8/8/8/8/B7/5q2/R6K w - - 0 1',line:['a3c5','a8b7','c5f2'],after:'Bc5+ is a discovered attack! Moving the bishop uncovers the Rook on a1, which checks the King on a8, and the bishop on c5 now attacks the Queen on f2. Black must answer the check, then Bxf2 wins the Queen.'},
  {name:'Queen Mate in 1',hint:'Bring the Queen next to the King — with support.',tier:'intermediate',board:b=>{b[0][7]={piece:'K',color:'b'};b[1][0]={piece:'Q',color:'w'};b[2][6]={piece:'K',color:'w'}},solution:{fr:1,fc:0,tr:1,tc:6},after:'Qg7 is checkmate! The Queen is protected by the King on g6, so the Black King cannot capture it, and every escape square is covered.',ch:'starter',theme:'mate'},
  {name:'Rook Mate in 1',hint:'Use the King and Rook together to trap the corner.',tier:'advanced',board:b=>{b[0][0]={piece:'K',color:'b'};b[2][0]={piece:'K',color:'w'};b[1][7]={piece:'R',color:'w'}},solution:{fr:1,fc:7,tr:0,tc:7},after:'Rh8 is checkmate! The Rook checks along the 8th rank while the White King on a6 guards a7 and b7. The Black King has no legal square — the basic King-and-Rook mate.',ch:'starter',theme:'mate'},
  {name:'Pin and Win the Queen',hint:'A pinned piece cannot run away.',tier:'advanced',board:b=>{b[0][4]={piece:'K',color:'b'};b[3][4]={piece:'Q',color:'b'};b[4][3]={piece:'P',color:'w'};b[7][4]={piece:'R',color:'w'};b[7][6]={piece:'K',color:'w'}},solution:{fr:4,fc:3,tr:3,tc:4},after:'dxe5 wins the Queen! The Queen on e5 is pinned to the King on e8 by the Rook on e1, so it cannot move off the e-file. The pawn simply captures it — a Queen for a pawn.',ch:'starter',theme:'pin'},
  {name:'Endgame: Queen Mate',hint:'Drive the lone King into the corner.',tier:'advanced',board:b=>{b[0][0]={piece:'K',color:'b'};b[2][1]={piece:'K',color:'w'};b[1][7]={piece:'Q',color:'w'}},solution:{fr:1,fc:7,tr:1,tc:0},after:'Qa7 is checkmate! The Queen, defended by the King on b6, traps the lone King in the corner with no escape. This is the standard King-and-Queen checkmate.',ch:'starter',theme:'mate'},
  {name:'Endgame: Rook Mate',hint:'Box the King on the edge with your Rook.',tier:'expert',board:b=>{b[7][7]={piece:'K',color:'b'};b[5][7]={piece:'K',color:'w'};b[6][0]={piece:'R',color:'w'}},solution:{fr:6,fc:0,tr:7,tc:0},after:'Ra1 is checkmate! The Rook checks along the 1st rank while the White King on h3 covers g2 and h2. The lone King is mated on the edge — the King-and-Rook endgame mate.',ch:'starter',theme:'mate'},
  {name:'Endgame: Two-Rook Ladder Mate',hint:'Two rooks build a ladder to the edge.',tier:'expert',board:b=>{b[0][0]={piece:'K',color:'b'};b[1][6]={piece:'R',color:'w'};b[7][7]={piece:'R',color:'w'};b[6][4]={piece:'K',color:'w'}},solution:{fr:7,fc:7,tr:0,tc:7},after:'Rh8 is checkmate! One rook guards the 7th rank so the King cannot step off the back rank, and the second rook delivers mate along the 8th. This is the two-rook "ladder" or "staircase" mate.',ch:'starter',theme:'mate'},
  {name:'Back-Rank Lift',hint:'The rook is already on the seventh. One step finishes it.',tier:'intermediate',board:b=>{b[0][7]={piece:'K',color:'b'};b[1][5]={piece:'P',color:'b'};b[1][6]={piece:'P',color:'b'};b[1][7]={piece:'P',color:'b'};b[1][0]={piece:'R',color:'w'};b[7][4]={piece:'K',color:'w'}},solution:{fr:1,fc:0,tr:0,tc:0},after:'Ra8 is checkmate! The King on h8 is stuck behind the pawns on f7, g7 and h7, and the Rook on a8 covers g8.',ch:'starter',theme:'mate'},
  {name:'Queen Takes the Rook',hint:'The rook on d5 is undefended. Take it.',tier:'beginner',board:b=>{b[0][0]={piece:'K',color:'b'};b[3][3]={piece:'R',color:'b'};b[6][3]={piece:'Q',color:'w'};b[7][7]={piece:'K',color:'w'}},solution:{fr:6,fc:3,tr:3,tc:3},after:'Qxd5 wins the Rook! The Queen slides up the open d-file and the Rook has no defender.',ch:'starter',theme:'material'},
  // ── Added in v4: new puzzles go at the END only, so a saved
  //    puzzlesSolved count keeps pointing at the same puzzles. ──
  // Mate-in-1 Academy
  {name:'Queen and King Team Up',hint:'Your King protects the Queen. Put her right next to the black King!',tier:'beginner',ch:'mate1',theme:'mate',fen:'4k3/Q7/4K3/8/8/8/8/8 w - - 0 1',line:['a7e7'],after:'Qe7 is checkmate! The Queen stands next to the King, but your King on e6 protects her, so she cannot be captured.'},
  {name:'Promote with Mate',hint:'Your pawn is one step from the last row.',tier:'beginner',ch:'mate1',theme:'mate',fen:'7k/1P4pp/8/8/8/8/8/K7 w - - 0 1',line:['b7b8q'],after:'b8=Q is checkmate! The pawn becomes a Queen and checks along the back rank, where Black\'s own pawns trap the King.'},
  {name:'Bishop Backs the Queen',hint:'The bishop on b2 aims at g7.',tier:'intermediate',ch:'mate1',theme:'mate',fen:'5rk1/5ppp/8/8/6Q1/8/1B6/K7 w - - 0 1',line:['g4g7'],after:'Qxg7 is checkmate! The bishop on b2 protects the Queen along the long diagonal.'},
  {name:'Pawn Backs the Queen',hint:'Your f6 pawn guards an important square.',tier:'intermediate',ch:'mate1',theme:'mate',fen:'6k1/5p1p/5PpQ/8/8/8/8/K7 w - - 0 1',line:['h6g7'],after:'Qg7 is checkmate! The pawn on f6 protects the Queen, and the King has nowhere to go.'},
  {name:'Arabian Mate',hint:'Rook and knight work together in the corner.',tier:'intermediate',ch:'mate1',theme:'mate',fen:'7k/1R6/5N2/8/8/8/8/K7 w - - 0 1',line:['b7h7'],after:'Rh7 is checkmate — the "Arabian mate"! The knight on f6 protects the rook and covers g8, and the rook guards g7. It is one of the oldest known checkmate patterns.'},
  {name:'Epaulette Mate',hint:'The black rooks stand on both sides of their King.',tier:'advanced',ch:'mate1',theme:'mate',fen:'3rkr2/8/8/8/8/7Q/8/K7 w - - 0 1',line:['h3e6'],after:'Qe6 is checkmate — the "epaulette mate"! The rooks on d8 and f8 sit like shoulder decorations (epaulettes) and block their own King.'},
  {name:'Anastasia\'s Mate',hint:'The knight on e7 already guards g8 and g6.',tier:'advanced',ch:'mate1',theme:'mate',fen:'8/4N1pk/8/8/8/3R4/8/K7 w - - 0 1',line:['d3h3'],after:'Rh3 is checkmate — "Anastasia\'s mate"! The knight takes away g8 and g6, the pawn on g7 is in the way, and the rook checks along the h-file.'},
  {name:'Smothered Mate',hint:'The black King is surrounded by its own pieces. Which piece can jump?',tier:'advanced',ch:'mate1',theme:'mate',fen:'6rk/6pp/8/6N1/8/8/8/K7 w - - 0 1',line:['g5f7'],after:'Nf7 is a smothered mate! The King is trapped by its own rook and pawns, and only a knight can give check without being blocked.'},
  // Forks
  {name:'Queen Fork',hint:'Give a check that also attacks the bishop on h4.',tier:'beginner',ch:'fork',theme:'fork',fen:'4k3/4pppp/8/8/7b/8/5PPP/3Q2K1 w - - 0 1',line:['d1a4','e8d8','a4h4'],after:'Qa4+ is a fork! The Queen checks the King and attacks the bishop on h4 at the same time. After the King moves, Qxh4 wins the bishop.'},
  {name:'Bishop Fork',hint:'A bishop check can hit two targets.',tier:'intermediate',ch:'fork',theme:'fork',fen:'6k1/6pp/8/8/8/8/r4PPP/5BK1 w - - 0 1',line:['f1c4','g8f8','c4a2'],after:'Bc4+ forks the King on g8 and the rook on a2. When the King steps away, Bxa2 wins the rook.'},
  {name:'Knight Fork on f7',hint:'Find the knight jump that checks the King.',tier:'intermediate',ch:'fork',theme:'fork',fen:'3q3k/6pp/8/4N3/8/8/5PPP/6K1 w - - 0 1',line:['e5f7','h8g8','f7d8'],after:'Nf7+ forks the King on h8 and the Queen on d8! After the King moves, Nxd8 wins the Queen.'},
  {name:'Check and Grab',hint:'A Queen check on the long diagonal…',tier:'intermediate',ch:'fork',theme:'fork',fen:'1r5k/7p/6p1/8/8/8/5PPP/4Q1K1 w - - 0 1',line:['e1e5','h8g8','e5b8'],after:'Qe5+ checks the King and attacks the rook on b8. Once Black deals with the check, Qxb8 wins the rook.'},
  {name:'Pawn Fork',hint:'Even a pawn can fork!',tier:'advanced',ch:'fork',theme:'fork',fen:'6k1/5ppp/2n1b3/8/2PP4/8/5PPP/6K1 w - - 0 1',line:['d4d5','e6d7','d5c6'],after:'d5 forks the knight on c6 and the bishop on e6. Black can save only one of them, so White wins a piece for a pawn.'},
  // Pins
  {name:'Pin the Queen',hint:'Line up your rook with the Queen and the King behind her.',tier:'intermediate',ch:'pin',theme:'pin',fen:'4k3/3p1p2/8/8/4q3/8/5K2/R7 w - - 0 1',line:['a1e1','e4e1','f2e1'],after:'Re1 pins the Queen to the King! She cannot leave the e-file, so the best Black can do is trade her for the rook: Qxe1+ Kxe1. A Queen (9) for a Rook (5) is a great deal.'},
  {name:'Bishop Pins the Queen',hint:'Your b3 pawn can support a bishop on c4.',tier:'intermediate',ch:'pin',theme:'pin',fen:'6k1/6pp/4q3/8/8/1P6/5PPP/5BK1 w - - 0 1',line:['f1c4','g8f7','c4e6'],after:'Bc4 pins the Queen to the King on g8. She cannot step off the diagonal, and if she takes the bishop, the b3 pawn recaptures. White wins the Queen for a bishop.'},
  {name:'Attack the Pinned Knight',hint:'The knight on c6 cannot move — attack it with something small.',tier:'advanced',ch:'pin',theme:'pin',fen:'r3k3/pp2pppp/2n5/1B6/3P4/8/5PPP/6K1 w - - 0 1',line:['d4d5','a7a6','d5c6'],after:'d5! The knight is pinned to the King by the bishop on b5, so it cannot run away. White wins it for a pawn.'},
  {name:'The Pinned Pawn Cannot Help',hint:'Is the f7 pawn really guarding g6?',tier:'advanced',ch:'pin',theme:'pin',fen:'6k1/5pp1/6n1/8/2B5/3Q4/5PPP/6K1 w - - 0 1',line:['d3g6'],after:'Qxg6! The f7 pawn is pinned to the King by the bishop on c4, so it cannot recapture. A free knight!'},
  {name:'Stuck Rook',hint:'The rook on e6 is pinned. Attack it with a pawn.',tier:'expert',ch:'pin',theme:'pin',fen:'6k1/3p2pp/4r3/8/2B2P2/8/6PP/6K1 w - - 0 1',line:['f4f5','g8f7','f5e6'],after:'f5! The rook on e6 is pinned to the King by the bishop and cannot get away from the pawn. White wins the rook for a pawn.'},
  // Skewers
  {name:'Rook Skewer',hint:'Check the King along the 4th rank.',tier:'intermediate',ch:'skewer',theme:'skewer',fen:'8/8/8/8/3k3r/8/8/R5K1 w - - 0 1',line:['a1a4','d4d5','a4h4'],after:'Ra4+ is a skewer! The King must leave the 4th rank, and then Rxh4 captures the rook that was hiding behind it.'},
  {name:'Bishop Skewer',hint:'Check the King on the diagonal — something valuable is behind it.',tier:'intermediate',ch:'skewer',theme:'skewer',fen:'4r3/8/2k5/8/8/8/8/3B2K1 w - - 0 1',line:['d1a4','c6c5','a4e8'],after:'Ba4+ skewers the King on c6 and the rook on e8. The King must step off the diagonal, and Bxe8 wins the rook.'},
  {name:'Skewer the Queen',hint:'Check the King along the d-file.',tier:'advanced',ch:'skewer',theme:'skewer',fen:'R7/8/8/3k4/8/7K/8/3q4 w - - 0 1',line:['a8d8','d5e5','d8d1'],after:'Rd8+ skewers the King and the Queen on the d-file. When the King moves aside, Rxd1 wins the Queen.'},
  {name:'Long Diagonal Skewer',hint:'A Queen check from the corner…',tier:'advanced',ch:'skewer',theme:'skewer',fen:'8/8/8/4k3/8/6KQ/8/r7 w - - 0 1',line:['h3h8','e5e6','h8a1'],after:'Qh8+ checks the King along the long diagonal, and the rook on a1 is right behind it. After the King steps away, Qxa1 wins the rook.'},
  {name:'Queen in Front, Rook Behind',hint:'Attack the Queen with a protected bishop. Who is standing behind her?',tier:'expert',ch:'skewer',theme:'skewer',fen:'kr6/8/7B/4q3/8/4P3/5PPP/5R1K w - - 0 1',line:['h6f4','e5e6','f4b8'],minGain:150,after:'Bf4 attacks the Queen, and the rook on b8 stands behind her on the same diagonal. The bishop is protected by the e3 pawn, so the Queen must move away, and Bxb8 wins a rook (5) for a bishop (3).'},
  // Discovered attacks
  {name:'Discovered Check',hint:'Move the knight off the e-file and see what the rook does.',tier:'intermediate',ch:'discovered',theme:'discovered',fen:'4k3/q4ppp/8/4N3/8/8/6PP/4R2K w - - 0 1',line:['e5c6','e8d7','c6a7'],after:'Nc6+ is a discovered check! The knight jumps away, the rook on e1 now checks the King, and the knight attacks the Queen on a7. Black must answer the check, then Nxa7 wins the Queen.'},
  {name:'Knight Uncovers the Queen',hint:'Your Queen on d1 is hiding behind the knight.',tier:'advanced',ch:'discovered',theme:'discovered',fen:'3q4/5pkp/6p1/8/3N4/8/5PPP/3Q2K1 w - - 0 1',line:['d4f5','g7f6','d1d8'],after:'Nf5+ checks the King and uncovers your Queen\'s attack on d8. Black must deal with the check, then Qxd8 wins the Queen. (Ne6+ works too!)'},
  {name:'Capture with Check',hint:'Your rook on h1 is lined up with the King, behind your bishop.',tier:'advanced',ch:'discovered',theme:'discovered',fen:'3rq2k/pp6/8/7B/8/8/8/K6R w - - 0 1',line:['h5e8'],after:'Bxe8+! The bishop takes the Queen and uncovers check from the rook on h1. Black must answer the check first, so there is no time to recapture.'},
  {name:'Pawn Opens the Diagonal',hint:'Your bishop on a1 is blocked by your own pawn.',tier:'advanced',ch:'discovered',theme:'discovered',fen:'1k5r/8/4n3/8/3P4/8/5PPP/B5K1 w - - 0 1',line:['d4d5','h8h6','d5e6'],after:'d5! The pawn attacks the knight on e6 and also opens the long diagonal, so the bishop on a1 attacks the rook on h8. Black cannot save both.'},
  {name:'Double Check Mate',hint:'Your knight and rook can both give check at once.',tier:'expert',ch:'discovered',theme:'mate',fen:'3qkb2/3p1p2/8/8/4N3/8/8/4R1K1 w - - 0 1',line:['e4d6'],after:'Nd6 is a double check — the knight and the rook both attack the King. Against a double check the King must move, and here it has no square: checkmate! (Nf6 works too.)'},
  // Mate in 2
  {name:'Rook Roller',hint:'One rook seals off a row, the other gives mate.',tier:'intermediate',ch:'mate2',theme:'mate2',goal:'mate2',fen:'4k3/8/8/8/8/8/1R6/R3K3 w - - 0 1',line:['b2b7','e8d8','a1a8'],after:'Rb7 traps the King on the back rank, then Ra8 is checkmate. The two rooks take turns, like a lawnmower!'},
  {name:'Back-Rank Sacrifice',hint:'Sometimes you give up your Queen to win the game.',tier:'advanced',ch:'mate2',theme:'mate2',goal:'mate2',fen:'2r3k1/5ppp/8/8/8/8/3Q1PPP/3R2K1 w - - 0 1',line:['d2d8','c8d8','d1d8'],after:'Qd8+! Black must take with the rook, and then Rxd8 is checkmate on the back rank.'},
  {name:'Damiano\'s Mate',hint:'Your g6 pawn guards both h7 and f7.',tier:'advanced',ch:'mate2',theme:'mate2',goal:'mate2',fen:'6k1/pp6/6P1/8/8/8/8/K6Q w - - 0 1',line:['h1h7','g8f8','h7f7'],after:'Qh7+ Kf8, then Qf7 is checkmate. The g6 pawn protects the Queen on both squares. The pattern is named after Pedro Damiano, who published it in his chess book of 1512.'},
  {name:'Smothered Mate in Two',hint:'Give a Queen check the King cannot take.',tier:'advanced',ch:'mate2',theme:'mate2',goal:'mate2',fen:'4r2k/6pp/7N/8/2Q5/8/8/6K1 w - - 0 1',line:['c4g8','e8g8','h6f7'],after:'Qg8+! The King cannot take the Queen because the knight guards g8, so Rxg8 is forced, and Nf7 is a smothered mate.'},
  {name:'Anastasia in Two',hint:'Sacrifice the Queen to drag the King out.',tier:'expert',ch:'mate2',theme:'mate2',goal:'mate2',fen:'5r1k/4N1pp/8/7Q/8/3R4/8/6K1 w - - 0 1',line:['h5h7','h8h7','d3h3'],after:'Qxh7+! Kxh7 is forced, then Rh3 is checkmate — Anastasia\'s mate. The knight on e7 covers g8 and g6.'},
  {name:'The Quiet Queen',hint:'No check needed: one quiet move threatens a mate Black cannot stop.',tier:'expert',ch:'mate2',theme:'mate2',goal:'mate2',fen:'5rk1/5p1p/5Bp1/8/8/8/3Q4/6K1 w - - 0 1',line:['d2h6','f8e8','h6g7'],after:'Qh6! Black has no way to stop Qg7, which is checkmate: the bishop on f6 protects the Queen on g7.'}
];
let PZ=null;

function puzzleSolvedCount(){return Math.min(PUZZLES.length,Math.max(0,getUserProgress().puzzlesSolved||0))}

function openPuzzleMenu(){
  _stopTimers();PZ=null;
  const prog=getUserProgress();
  const solved=puzzleSolvedCount(),marks=prog.puzzleMarks||{};
  const top=document.getElementById('ladderTop');
  if(top)top.innerHTML='<div class="lt-row"><b>'+solved+' / '+PUZZLES.length+'</b><span>'+(solved>=PUZZLES.length?'Ladder complete! 🏆':'Next: puzzle '+(solved+1))+'</span></div><div class="track"><i style="width:'+Math.round(100*solved/PUZZLES.length)+'%"></i></div>';
  const wrap=document.getElementById('ladderChapters');
  if(!wrap)return;
  const groups=[];
  PUZZLES.forEach((pz,i)=>{const ch=pz.ch||'starter';if(!groups.length||groups[groups.length-1].ch!==ch)groups.push({ch,items:[]});groups[groups.length-1].items.push(i)});
  wrap.innerHTML=groups.map(g=>{
    const info=CQData.CHAPTERS[g.ch]||{title:g.ch,icon:'wP',desc:''};
    const done=g.items.filter(i=>i<solved).length;
    return '<section class="chapter"><h3><span style="width:28px;height:28px;display:inline-block">'+pieceIcon(info.icon)+'</span>'+_esc(info.title)+' <span class="pill" style="--pill:'+(done===g.items.length?'#047857':'#7a4a26')+'">'+done+'/'+g.items.length+'</span></h3><p>'+_esc(info.desc)+'</p><div class="tiles">'+
      g.items.map(i=>{
        const pz=PUZZLES[i];const st=i<solved?'done':i===solved?'current':'locked';
        const tag=CQData.THEME_TAG[pz.theme]||'';
        const mk=marks[i+1]||0;
        return '<button type="button" class="tile '+st+'" onclick="openPuzzle('+i+')" aria-label="Puzzle '+(i+1)+': '+_esc(pz.name)+(st==='done'?' (solved)':st==='locked'?' (locked)':'')+'">'+
          (st==='done'&&mk?'<span class="stars">'+'★'.repeat(mk)+'</span>':'')+(i+1)+'<small>'+(st==='locked'?'🔒 ':'')+_esc(tag)+'</small></button>';
      }).join('')+'</div></section>';
  }).join('');
  showScreen('puzzle-menu');
}

function openPuzzle(i){
  const solved=puzzleSolvedCount();
  if(i>solved){
    if(typeof ZsDialog!=='undefined')ZsDialog.alert({title:'Locked 🔒',message:'Solve puzzle '+(solved+1)+' first — the ladder opens one step at a time.'});
    return;
  }
  _stopTimers();
  const pz=PUZZLES[i];
  const pos=CQPuzzle.setup(pz);
  PZ={i,pz,start:CQE.toFEN(pos),pos,line:CQPuzzle.line(pz),ply:0,onLine:true,wdone:0,need:CQPuzzle.whiteMoves(pz,pos),
      wrong:0,hint:0,busy:false,selected:null,last:null,arrows:null,hintSq:null,solved:false,flipped:false,replay:i<solved};
  const el=document.getElementById('puzzleBoard');if(el)el._cqPrev=null;
  const lab=document.getElementById('puzzleLabel');
  if(lab)lab.innerHTML='Puzzle '+(i+1)+' <span class="cq-sub">'+_esc(pz.name)+'</span>';
  const tag=document.getElementById('puzzleTag');
  if(tag){const info=CQData.CHAPTERS[pz.ch]||{};tag.textContent=info.title||'';}
  const goal=document.getElementById('puzzleGoal');
  if(goal){const g=CQPuzzle.goal(pz,pos);goal.innerHTML='<span class="turn-dot" aria-hidden="true"></span>White to move — '+(g==='mate'?'checkmate in 1!':g==='mate2'?'checkmate in 2 moves!':({fork:'win material with a fork!',pin:'use a pin to win material!',skewer:'win material with a skewer!',discovered:'win material with a discovered attack!'}[pz.theme]||'win material!'))}
  setCoach('puzzleCoach',_esc(pz.hint),'',null,'Hint');
  document.getElementById('nextPuzzleBtn').style.display='none';
  updatePuzzleTools();
  renderPuzzle({animate:false});
  showScreen('puzzle');
}
function updatePuzzleTools(){
  const h=document.getElementById('pzHintBtn');if(h)h.disabled=!PZ||PZ.solved||PZ.hint>=2;
}
function expectedMove(){
  if(!PZ)return 0;
  if(PZ.onLine&&PZ.line[PZ.ply]){const m=CQE.parseUci(PZ.pos,PZ.line[PZ.ply]);if(m)return m}
  const g=CQPuzzle.goal(PZ.pz,PZ.pos);
  if(g==='mate'||g==='mate2')return CQE.mateIn(PZ.pos,PZ.need-PZ.wdone)||0;
  const b=CQE.bestMove(PZ.pos,3,900);return b?b.m:0;
}
function renderPuzzle(o){
  if(!PZ)return;
  const el=document.getElementById('puzzleBoard');if(!el)return;
  o=o||{};
  let dots={};
  if(PZ.selected!=null){
    const ms=movesFromPos(PZ.pos,PZ.selected,true);
    dots={selected:[PZ.selected>>3,PZ.selected&7],moveDots:ms.filter(m=>m.type==='move').map(m=>[m.tr,m.tc]),captureDots:ms.filter(m=>m.type==='capture').map(m=>[m.tr,m.tc])};
  }
  renderBoard(el,posToBoard(PZ.pos),Object.assign({
    lastMove:lastMoveObj(PZ.last),checkSquare:checkSquareOf(PZ.pos),flipped:PZ.flipped,
    arrows:PZ.arrows,hintSquares:PZ.hintSq?[PZ.hintSq]:[],
    onClick:PZ.solved?null:puzzleClick
  },dots,o));
}
function puzzleHint(){
  if(!PZ||PZ.solved||PZ.busy)return;
  PZ.hint=Math.min(2,PZ.hint+1);
  showPuzzleHint();
}
function showPuzzleHint(){
  const m=expectedMove();if(!m)return;
  const f=m&63,t=(m>>6)&63;
  const tip=CQData.THEME_TIP[PZ.pz.theme==='mate2'?'mate2':PZ.pz.theme]||'';
  if(PZ.hint===1){PZ.hintSq=[f>>3,f&7];PZ.arrows=null;setCoach('puzzleCoach','Try moving your <b>'+pieceWord(PZ.pos.b[f])+'</b> on '+CQE.sqName(f)+'. '+_esc(tip),'warn',null,'Hint')}
  else if(PZ.hint>=2){PZ.hintSq=null;PZ.arrows=[{from:[f>>3,f&7],to:[t>>3,t&7]}];setCoach('puzzleCoach','Follow the arrow: <b>'+_esc(CQE.san(PZ.pos,m))+'</b>. '+_esc(tip),'warn',null,'Hint')}
  updatePuzzleTools();renderPuzzle();
}
function flipPuzzle(){if(!PZ)return;PZ.flipped=!PZ.flipped;const el=document.getElementById('puzzleBoard');if(el)el._cqPrev=null;renderPuzzle({animate:false})}
function resetPuzzle(){if(PZ)openPuzzle(PZ.i)}

async function puzzleClick(r,c){
  if(!PZ||PZ.busy||PZ.solved)return;
  const s=r*8+c,x=PZ.pos.b[s];
  if(PZ.selected!=null){
    const mv=movesFromPos(PZ.pos,PZ.selected,true).find(m=>m.tr===r&&m.tc===c);
    if(mv){
      let m=mv.m;
      if(mv.promo){PZ.busy=true;const t=await pickPromotion('w');PZ.busy=false;m=CQE.legal(PZ.pos).find(z=>(z&63)===(m&63)&&((z>>6)&63)===((m>>6)&63)&&CQE.mPromo(z)===t)||m}
      PZ.selected=null;
      tryPuzzleMove(m);
      return;
    }
  }
  if(x&&!(x&8)){PZ.selected=s;renderPuzzle();_sfx('click')}
  else{PZ.selected=null;renderPuzzle()}
}

function tryPuzzleMove(m){
  const expected=expectedMove();
  const left=PZ.need-PZ.wdone;
  PZ.busy=true;
  const ok=CQPuzzle.accepts(PZ.pz,PZ.pos,m,expected,left);
  if(!ok)return puzzleWrong(m);
  if(m!==expected)PZ.onLine=false;
  CQE.make(PZ.pos,m);PZ.last=m;PZ.ply++;PZ.wdone++;PZ.arrows=null;PZ.hintSq=null;
  renderPuzzle();
  const done=PZ.wdone>=PZ.need||CQE.status(PZ.pos)==='checkmate'||!CQE.legal(PZ.pos).length;
  if(done)return _later(()=>puzzleSolvedNow(m!==expected&&left===1),450);
  setCoach('puzzleCoach','Good move! Now watch Black\'s reply…','good',null,'Coach');
  _sfx('click');
  _later(()=>{
    let reply=0;
    if(PZ.onLine&&PZ.line[PZ.ply])reply=CQE.parseUci(PZ.pos,PZ.line[PZ.ply])||0;
    if(!reply){PZ.onLine=false;const b=CQE.bestMove(PZ.pos,3,900);reply=b?b.m:0}
    if(!reply)return puzzleSolvedNow(false);
    const sanR=CQE.san(PZ.pos,reply);
    CQE.make(PZ.pos,reply);PZ.last=reply;PZ.ply++;
    renderPuzzle();
    PZ.busy=false;
    const g=CQPuzzle.goal(PZ.pz,PZ.pos);
    setCoach('puzzleCoach','Black played <b>'+_esc(sanR)+'</b>. '+(g==='mate2'?'Now finish it — checkmate!':'Now finish the job!'),'',null,'Coach');
  },650);
}

function puzzleWrong(m){
  PZ.wrong++;
  const why=Coach.whyWrong(PZ.pz,PZ.pos,m);
  const before=CQE.toFEN(PZ.pos),keepLast=PZ.last;
  setCoach('puzzleCoach','Not quite. '+why.text,'bad',null,'Coach');
  _sfx('wrong');
  CQE.make(PZ.pos,m);PZ.last=m;renderPuzzle();
  const el=document.getElementById('puzzleBoard');
  _later(()=>{
    if(why.reply&&CQE.legal(PZ.pos).includes(why.reply)){CQE.make(PZ.pos,why.reply);PZ.last=why.reply;renderPuzzle()}
  },700);
  _later(()=>{
    PZ.pos=CQE.fromFEN(before);PZ.last=keepLast;
    const t=_tier();
    const young=t==='beginner'||t==='intermediate';
    if(young&&PZ.wrong>=1&&PZ.hint<1)PZ.hint=1;
    if(young&&PZ.wrong>=2)PZ.hint=2;
    if(!young&&PZ.wrong>=3&&PZ.hint<1)PZ.hint=1;
    renderPuzzle();
    PZ.busy=false;
    if(PZ.hint>0)_later(showPuzzleHint,300);
    else{const c=document.getElementById('puzzleCoach');const tx=c&&c.querySelector('.coach-text');if(tx)tx.insertAdjacentHTML('beforeend','<br><small>Try again! Tap 💡 Hint if you want help.</small>')}
  },2000);
}

function puzzleSolvedNow(alt){
  if(!PZ)return;
  PZ.solved=true;PZ.busy=false;
  const prog=getUserProgress();
  const id=PZ.i+1;
  const mark=PZ.wrong===0&&PZ.hint===0?3:(PZ.wrong+PZ.hint<=1?2:1);
  const marks=Object.assign({},prog.puzzleMarks||{});
  marks[id]=Math.max(marks[id]||0,mark);
  const upd={puzzleMarks:marks};
  const solvedBefore=Math.max(0,prog.puzzlesSolved||0);
  if(PZ.i===solvedBefore)upd.puzzlesSolved=solvedBefore+1;   // next rung of the ladder
  saveProgress(upd);
  if(typeof ActivityLog!=='undefined')ActivityLog.log('Chess Quest','♟️','Solved a chess puzzle');
  setCoach('puzzleCoach','<b>'+'★'.repeat(mark)+'☆'.repeat(3-mark)+'</b> '+(alt?'Great — that works too! ':'')+_esc(PZ.pz.after),'good',null,'Solved!');
  showFeedback('🎉');_sfx('correct');
  renderPuzzle({onClick:null});
  updatePuzzleTools();
  const nb=document.getElementById('nextPuzzleBtn');
  if(nb){nb.style.display='';nb.textContent=PZ.i+1<PUZZLES.length?'Next puzzle →':'Back to ladder'}
}
function nextPuzzle(){
  const go=()=>{if(PZ&&PZ.i+1<PUZZLES.length&&PZ.i+1<=puzzleSolvedCount())openPuzzle(PZ.i+1);else openPuzzleMenu()};
  if (typeof LearningCheck !== 'undefined') LearningCheck.maybePrompt('chess', go);
  else go();
}

/* ================================================================
   PLAY MODE — friendly computer opponent with 5 clear levels
   ================================================================ */
let G=null;

function openPlay(){
  if (typeof canPlayChess === 'function' && !canPlayChess()) {
    const limit = getChessLimit();
    ZsDialog.alert(limit === 0
      ? { title: 'Chess is off', message: 'Chess is currently disabled.' }
      : { title: 'No plays left 🔒', message: 'You have used all your Chess plays for this week!' });
    return;
  }
  _stopTimers();G=null;
  const prog=getUserProgress(),prefs=prog.playPrefs||{};
  const rec=CQData.LEVEL_FOR_TIER[_tier()]||2;
  const t=_tier();
  const coachDefault=t==='beginner'||t==='intermediate'||t==='advanced';
  const lv=document.getElementById('levelGrid');
  if(lv)lv.innerHTML=CQData.LEVELS.map(l=>'<button type="button" class="level-card'+(l.id===rec?' rec':'')+'" onclick="startGame('+l.id+')"><span class="lv-icon">'+pieceIcon(l.icon)+'</span><span><span class="lv-name">Level '+l.id+' · '+_esc(l.name)+'</span><span class="lv-desc" style="display:block">'+_esc(l.desc)+'</span><span class="lv-meta"><span class="lv-dots" aria-label="Strength '+l.stars+' of 5">'+[1,2,3,4,5].map(n=>'<i class="'+(n<=l.stars?'on':'')+'"></i>').join('')+'</span>'+(l.id===rec?'<span class="pill" style="--pill:#047857">Recommended for you</span>':'')+(prefs.level===l.id&&l.id!==rec?'<span class="pill">Last played</span>':'')+'</span></span></button>').join('');
  const cb=document.getElementById('coachToggle');if(cb)cb.checked=prefs.coach!=null?!!prefs.coach:coachDefault;
  const sb=document.getElementById('sideToggle');if(sb)sb.checked=prefs.side==='b';
  showScreen('play-setup');
}

function startGame(level){
  if (typeof canPlayChess === 'function' && !canPlayChess()) return openPlay();
  if (typeof recordChessPlay === 'function') recordChessPlay();
  const coach=!!(document.getElementById('coachToggle')||{}).checked;
  const side=(document.getElementById('sideToggle')||{}).checked?'b':'w';
  saveProgress({playPrefs:{level,coach,side}});
  G={pos:CQE.fromFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),level,coach,user:side==='b'?1:0,
     hist:[],reps:{},over:false,selected:null,last:null,arrows:null,busy:false,flipped:side==='b',thinking:false};
  G.reps[_repKey(G.pos)]=1;
  const el=document.getElementById('playBoard');if(el)el._cqPrev=null;
  const lvl=CQData.LEVELS.find(l=>l.id===level)||CQData.LEVELS[0];
  const on=document.getElementById('oppName');if(on)on.innerHTML=_esc(lvl.name)+'<small>Computer · Level '+level+'</small>';
  const of=document.getElementById('oppFace');if(of){of.innerHTML=pieceIcon((G.user?'w':'b')+lvl.icon[1]);of.className='pb-face'+(G.user?' light':'')}
  const yn=document.getElementById('youName');const u=typeof getActiveUser==='function'?getActiveUser():null;
  if(yn)yn.innerHTML=_esc(u?u.name:'You')+'<small>'+(G.user?'Black':'White')+'</small>';
  const yf=document.getElementById('youFace');if(yf){yf.innerHTML=pieceIcon((G.user?'b':'w')+'K');yf.className='pb-face'+(G.user?'':' light')}
  const go=document.getElementById('gameOverWrap');if(go)go.innerHTML='';
  setCoach('playCoach',G.coach?'I\'m your coach! I\'ll warn you if a move leaves a piece in danger. Tap <b>💡 Hint</b> any time.':'', '',null,'Coach');
  showScreen('play');
  renderPlay({animate:false});
  if(G.pos.turn!==G.user)_later(aiTurn,500);
}
function _repKey(p){return CQE.toFEN(p).split(' ').slice(0,4).join(' ')}

function renderPlay(o){
  if(!G)return;
  const el=document.getElementById('playBoard');if(!el)return;
  o=o||{};
  let dots={};
  if(G.selected!=null){
    const ms=movesFromPos(G.pos,G.selected,true);
    dots={selected:[G.selected>>3,G.selected&7],moveDots:ms.filter(m=>m.type==='move').map(m=>[m.tr,m.tc]),captureDots:ms.filter(m=>m.type==='capture').map(m=>[m.tr,m.tc])};
  }
  renderBoard(el,posToBoard(G.pos),Object.assign({lastMove:lastMoveObj(G.last),checkSquare:checkSquareOf(G.pos),flipped:G.flipped,arrows:G.arrows,onClick:playClick},dots,o));
  updatePlayInfo();
}
function updatePlayInfo(){
  if(!G)return;
  // captured pieces: compare with the starting set
  const start={1:8,2:2,3:2,4:2,5:1};
  const cnt=[{},{}];
  for(let s=0;s<64;s++){const x=G.pos.b[s];if(!x||(x&7)===6)continue;const c=x&8?1:0;cnt[c][x&7]=(cnt[c][x&7]||0)+1}
  const lost=c=>{let out=[];[5,4,3,2,1].forEach(t=>{const n=Math.max(0,start[t]-(cnt[c][t]||0));for(let i=0;i<n;i++)out.push((c?'b':'w')+CQE.LET[t])});return out};
  const mat=CQE.material(G.pos);   // + = White ahead
  const youAdv=Math.round((G.user?-mat:mat)/100);
  const capYou=document.getElementById('capYou'),capOpp=document.getElementById('capOpp');
  const oppColor=G.user^1;
  if(capYou)capYou.innerHTML=lost(oppColor).map(c=>pieceIcon(c)).join('')+(youAdv>0?'<span class="adv">+'+youAdv+'</span>':'');
  if(capOpp)capOpp.innerHTML=lost(G.user).map(c=>pieceIcon(c)).join('')+(youAdv<0?'<span class="adv">+'+(-youAdv)+'</span>':'');
  const yb=document.getElementById('youBar'),ob=document.getElementById('oppBar');
  const yourTurn=!G.over&&G.pos.turn===G.user;
  if(yb){yb.classList.toggle('active',yourTurn)}
  if(ob){ob.classList.toggle('active',!G.over&&!yourTurn);ob.classList.toggle('thinking',!!G.thinking)}
  const ot=document.getElementById('oppTurn');if(ot)ot.textContent=G.thinking?'Thinking…':'Its move';
  // flip which bar sits on top so it matches the board orientation
  const wrap=document.getElementById('playBoardWrap');
  if(yb&&ob&&wrap){const userAtBottom=(G.user===0)!==G.flipped;
    if(userAtBottom){wrap.parentNode.insertBefore(ob,wrap);wrap.parentNode.insertBefore(yb,wrap.nextSibling);ob.classList.remove('bottom');yb.classList.add('bottom')}
    else{wrap.parentNode.insertBefore(yb,wrap);wrap.parentNode.insertBefore(ob,wrap.nextSibling);yb.classList.remove('bottom');ob.classList.add('bottom')}}
  const tb=document.getElementById('takebackBtn');if(tb)tb.disabled=G.busy||!G.hist.some(h=>h.by===G.user);
  const hb=document.getElementById('playHintBtn');if(hb)hb.disabled=G.over||!yourTurn||G.busy;
}
function setStatus(t){const st=document.getElementById('playStatus');if(st)st.textContent=t}

async function playClick(r,c){
  if(!G||G.over||G.busy||G.pos.turn!==G.user)return;
  const s=r*8+c,x=G.pos.b[s];
  if(G.selected!=null){
    const mv=movesFromPos(G.pos,G.selected,true).find(m=>m.tr===r&&m.tc===c);
    if(mv){
      let m=mv.m;
      if(mv.promo){G.busy=true;const t=await pickPromotion(G.user?'b':'w');G.busy=false;m=CQE.legal(G.pos).find(z=>(z&63)===(m&63)&&((z>>6)&63)===((m>>6)&63)&&CQE.mPromo(z)===t)||m}
      G.selected=null;
      userMove(m);
      return;
    }
  }
  if(x&&((x&8)?1:0)===G.user){G.selected=s;renderPlay()}
  else{G.selected=null;renderPlay()}
}

function doMove(m,by){
  const san=CQE.san(G.pos,m);
  const before=CQE.toFEN(G.pos);
  CQE.make(G.pos,m);
  G.hist.push({m,by,san,before,last:G.last});
  G.last=m;G.arrows=null;
  const k=_repKey(G.pos);G.reps[k]=(G.reps[k]||0)+1;
  return san;
}
function undoLast(){
  const h=G.hist.pop();if(!h)return;
  const k=_repKey(G.pos);if(G.reps[k])G.reps[k]--;
  G.pos=CQE.fromFEN(h.before);G.last=h.last;
}

function userMove(m){
  const pre=CQE.clone(G.pos);
  const san=doMove(m,G.user);
  setStatus('You played '+san);
  renderPlay();
  if(checkPlayEnd())return;
  if(G.coach){
    G.busy=true;
    setCoach('playCoach','<i>Coach is looking at your move…</i>','',null,'Coach');
    _later(()=>{
      const review=reviewMove(pre,m);
      G.busy=false;
      if(review&&review.blunder){
        setCoach('playCoach','Careful! '+review.text+' Do you want to take that move back?','warn',[
          {label:'↩ Take it back',cls:'btn-green',fn:()=>{undoLast();setCoach('playCoach','Good thinking! Look for a safer move.','good',null,'Coach');setStatus('Your move');renderPlay()}},
          {label:'Keep my move',cls:'btn-outline',fn:()=>{setCoach('playCoach','OK — let\'s see what happens!','',null,'Coach');_later(aiTurn,250)}}
        ],'Coach');
        renderPlay();
        return;
      }
      setCoach('playCoach',review&&review.praise?review.praise:'','good',null,'Coach');
      _later(aiTurn,150);
    },60);
    return;
  }
  _later(aiTurn,380);
}

// Did the child's move throw something away?
function reviewMove(pre,m){
  try{
    const S=CQE.makeSearcher({deadline:Date.now()+700});
    const sc=S.rootScores(pre,2);
    if(!sc.length)return null;
    sc.sort((a,b)=>b.score-a.score);
    const mine=sc.find(o=>o.m===m);if(!mine)return null;
    const best=sc[0];
    const post=CQE.clone(pre);CQE.make(post,m);
    if(best.score-mine.score>=200&&mine.score<300){
      const r=CQE.bestMove(post,2,500);
      return{blunder:true,text:r?Coach.threat(post,r.m):'That move loses material.'};
    }
    const cap=pre.b[(m>>6)&63];
    if(cap&&!CQE.attacked(pre,(m>>6)&63,pre.turn^1))return{praise:'Nice! You won a '+pieceWord(cap)+' for free.'};
    if(CQE.mFlag(m)===2)return{praise:'Good — castling keeps your King safe.'};
    return null;
  }catch(e){return null}
}

function aiChoose(pos,level){
  const L=CQE.legal(pos);if(!L.length)return 0;
  const greedy=(noise)=>{
    let best=null,bs=-1e9;
    for(const m of L){
      let s=Math.random()*noise;
      const t=pos.b[(m>>6)&63];if(t)s+=CQE.VAL[t&7]/10;
      if(CQE.mPromo(m))s+=80;
      const u=CQE.make(pos,m);if(CQE.inCheck(pos,pos.turn))s+=3;CQE.unmake(pos,u);
      const to=(m>>6)&63;if([27,28,35,36].includes(to))s+=1;
      if((pos.b[m&63]&7)===CQE.KING&&CQE.mFlag(m)!==2)s-=2;
      if(s>bs){bs=s;best=m}
    }
    return best;
  };
  if(level<=1)return Math.random()<0.65?L[Math.floor(Math.random()*L.length)]:greedy(6);
  if(level===2)return Math.random()<0.12?L[Math.floor(Math.random()*L.length)]:greedy(5);
  const cfg={3:[2,900,35],4:[3,1200,12],5:[4,1600,0]}[level]||[2,900,30];
  const b=CQE.bestMove(pos,cfg[0],cfg[1],cfg[2]);
  return b?b.m:L[0];
}
function aiTurn(){
  if(!G||G.over||G.pos.turn===G.user)return;
  G.thinking=true;setStatus('Computer is thinking…');updatePlayInfo();
  _later(()=>{
    if(!G||G.over)return;
    const m=aiChoose(CQE.clone(G.pos),G.level);
    G.thinking=false;
    if(!m)return checkPlayEnd();
    const san=doMove(m,G.user^1);
    renderPlay();
    if(checkPlayEnd())return;
    setStatus('Computer played '+san+(CQE.inCheck(G.pos,G.pos.turn)?' — you are in check!':' — your move'));
  },60);
}

function playHint(){
  if(!G||G.over||G.busy||G.pos.turn!==G.user)return;
  setCoach('playCoach','<i>Thinking about a good move…</i>','',null,'Coach');
  _later(()=>{
    const b=CQE.bestMove(CQE.clone(G.pos),3,900);if(!b)return;
    const m=b.m,f=m&63,t=(m>>6)&63;
    G.arrows=[{from:[f>>3,f&7],to:[t>>3,t&7],color:'rgba(4,120,87,0.85)'}];
    setCoach('playCoach','Try <b>'+_esc(CQE.san(G.pos,m))+'</b>. '+Coach.whyGood(G.pos,m),'good',null,'Coach');
    renderPlay();
  },40);
}
function takeBack(){
  if(!G||G.busy||G.thinking)return;
  _stopTimers();
  while(G.hist.length&&G.hist[G.hist.length-1].by!==G.user)undoLast();
  if(G.hist.length)undoLast();
  G.over=false;G.selected=null;
  const go=document.getElementById('gameOverWrap');if(go)go.innerHTML='';
  setStatus('Move taken back — your move');setCoach('playCoach',G.coach?'Let\'s try that again.':'','',null,'Coach');
  renderPlay();
}
function flipPlay(){if(!G)return;G.flipped=!G.flipped;const el=document.getElementById('playBoard');if(el)el._cqPrev=null;renderPlay({animate:false})}

function checkPlayEnd(){
  let st=CQE.status(G.pos);
  if(!st&&G.reps[_repKey(G.pos)]>=3)st='threefold';
  if(!st)return false;
  G.over=true;G.busy=false;
  const prog=getUserProgress();
  let title,msg,emoji;
  if(st==='checkmate'){
    const userWon=G.pos.turn!==G.user;
    if(userWon){
      saveProgress({wins:(prog.wins||0)+1});emoji='🏆';title='You win!';msg='Checkmate! Great game.';
      if(typeof ActivityLog!=='undefined')ActivityLog.log('Chess Quest','♟️','Won a game against computer');
      _sfx('cheer');
    }else{saveProgress({losses:(prog.losses||0)+1});emoji='😔';title='Computer wins';msg='Checkmate. Every game teaches you something — try again!'}
  }else{
    saveProgress({draws:(prog.draws||0)+1});emoji='🤝';title='Draw!';
    msg={stalemate:'Stalemate — the side to move has no legal move but is not in check.',insufficient:'Not enough pieces are left for anyone to checkmate.',fifty:'Fifty moves without a capture or a pawn move.',threefold:'The same position appeared three times.'}[st];
  }
  showFeedback(emoji);
  setStatus('Game over');
  setCoach('playCoach','','',null);
  renderPlay();
  const show=()=>{const goEl=document.getElementById('gameOverWrap');if(goEl)goEl.innerHTML='<div class="game-over-box cq-card"><h2>'+emoji+' '+_esc(title)+'</h2><p>'+_esc(msg)+'</p><div class="go-btns"><button type="button" class="btn btn-gold" onclick="openPlay()">Play again ♟️</button><button type="button" class="btn btn-outline" onclick="goMenu()">Menu</button></div></div>'};
  if (typeof LearningCheck !== 'undefined') LearningCheck.maybePrompt('chess', show); else show();
  return true;
}

// ── Boot safely after DOM is ready ──
if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('DOMContentLoaded', init);
