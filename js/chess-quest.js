/* ================================================================
   CHESS QUEST — ENGINE + UI
   ================================================================ */

function getUserKey(){const u=getActiveUser();return u?`zs_chess_${u.name.toLowerCase().replace(/\s+/g,'_')}`:null}
function getUserProgress(){const k=getUserKey();if(!k)return{};try{return JSON.parse(localStorage.getItem(k))||{}}catch{return{}}}
function saveProgress(data){const k=getUserKey();if(!k)return;const p=getUserProgress();Object.assign(p,data);localStorage.setItem(k,JSON.stringify(p))}

// ── Pieces & Unicode ──
const P={K:'K',Q:'Q',R:'R',B:'B',N:'N',P:'P'};
const UNICODE={wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'};
function pieceChar(piece,color){return UNICODE[(color||'w')+piece]||''}
const PIECE_VALUES={P:1,N:3,B:3,R:5,Q:9,K:0};

// ── Board representation ──
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
function cloneBoard(b){return b.map(r=>r.map(s=>s?{...s}:null))}
function inBounds(r,c){return r>=0&&r<8&&c>=0&&c<8}

// ── Move generation ──
function getMoves(board,r,c,checkLegal=true){
  const s=board[r][c];if(!s)return[];
  const moves=[];const col=s.color;const opp=col==='w'?'b':'w';
  const add=(tr,tc,type='move')=>{if(inBounds(tr,tc)){const t=board[tr][tc];if(!t)moves.push({fr:r,fc:c,tr,tc,type});else if(t.color===opp)moves.push({fr:r,fc:c,tr,tc,type:'capture'})}};
  const slide=(dirs)=>{dirs.forEach(([dr,dc])=>{for(let i=1;i<8;i++){const tr=r+dr*i,tc=c+dc*i;if(!inBounds(tr,tc))break;const t=board[tr][tc];if(!t){moves.push({fr:r,fc:c,tr,tc,type:'move'})}else{if(t.color===opp)moves.push({fr:r,fc:c,tr,tc,type:'capture'});break}}})};
  switch(s.piece){
    case 'P':{
      const dir=col==='w'?-1:1;const start=col==='w'?6:1;
      if(inBounds(r+dir,c)&&!board[r+dir][c]){moves.push({fr:r,fc:c,tr:r+dir,tc:c,type:'move'});if(r===start&&!board[r+2*dir][c])moves.push({fr:r,fc:c,tr:r+2*dir,tc:c,type:'move'})}
      [-1,1].forEach(dc=>{const tr=r+dir,tc=c+dc;if(inBounds(tr,tc)&&board[tr][tc]&&board[tr][tc].color===opp)moves.push({fr:r,fc:c,tr,tc,type:'capture'})});
      break;
    }
    case 'N':[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>add(r+dr,c+dc));break;
    case 'B':slide([[-1,-1],[-1,1],[1,-1],[1,1]]);break;
    case 'R':slide([[-1,0],[1,0],[0,-1],[0,1]]);break;
    case 'Q':slide([[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]);break;
    case 'K':[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>add(r+dr,c+dc));break;
  }
  if(!checkLegal)return moves;
  return moves.filter(m=>{const nb=cloneBoard(board);nb[m.tr][m.tc]=nb[m.fr][m.fc];nb[m.fr][m.fc]=null;return!isInCheck(nb,col)});
}
function allMoves(board,color){
  const moves=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]&&board[r][c].color===color)moves.push(...getMoves(board,r,c));
  return moves;
}
function isInCheck(board,color){
  let kr=-1,kc=-1;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]&&board[r][c].piece==='K'&&board[r][c].color===color){kr=r;kc=c}
  if(kr<0)return true;
  const opp=color==='w'?'b':'w';
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    if(board[r][c]&&board[r][c].color===opp){
      const ms=getMoves(board,r,c,false);
      if(ms.some(m=>m.tr===kr&&m.tc===kc))return true;
    }
  }
  return false;
}
function isCheckmate(board,color){return isInCheck(board,color)&&allMoves(board,color).length===0}
function isStalemate(board,color){return!isInCheck(board,color)&&allMoves(board,color).length===0}

// ── Render board ──
function renderBoard(boardEl,board,options={}){
  boardEl.innerHTML='';
  const{onClick,highlights=[],moveDots=[],captureDots=[],selected,lastMove,checkSquare,hintSquares=[]}=options;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const sq=document.createElement('div');
    const isLight=(r+c)%2===0;
    sq.className='sq '+(isLight?'light':'dark');
    if(selected&&selected[0]===r&&selected[1]===c)sq.classList.add('selected');
    if(moveDots.some(m=>m[0]===r&&m[1]===c))sq.classList.add('move-dot');
    if(captureDots.some(m=>m[0]===r&&m[1]===c))sq.classList.add('capture-ring');
    if(checkSquare&&checkSquare[0]===r&&checkSquare[1]===c)sq.classList.add('check-sq');
    if(lastMove){if(lastMove.fr===r&&lastMove.fc===c)sq.classList.add('last-from');if(lastMove.tr===r&&lastMove.tc===c)sq.classList.add('last-to')}
    if(hintSquares.some(h=>h[0]===r&&h[1]===c))sq.classList.add('hint-sq');
    const p=board[r][c];
    if(p)sq.textContent=pieceChar(p.piece,p.color);
    if(onClick)sq.onclick=()=>onClick(r,c);
    boardEl.appendChild(sq);
  }
}

// ── Screen nav ──
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const target=document.getElementById('screen-'+id);
  if(target)target.classList.add('active');
  window.scrollTo(0,0);
}
function goMenu(){updateMenuBadges();showScreen('menu')}
function showFeedback(emoji){
  const el=document.getElementById('feedback');
  if(!el)return;
  const inner=el.querySelector('span')||el;
  inner.textContent=emoji;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),900);
}

// ── Init (safe — no crash if nav.js hasn't run yet) ──
function init(){
  const user=getActiveUser();
  if(user){
    // nav.js handles the badge, but set greeting if element exists
    const greetEl=document.getElementById('greeting');
    if(greetEl){
      greetEl.textContent = "Let's play, " + user.name + "!";
    }
  }
  updateMenuBadges();
}

function updateMenuBadges(){
  const prog=getUserProgress();
  const learned=(prog.learnedPieces||[]).length;
  const learnEl=document.getElementById('learnBadge');
  if(learnEl){
    learnEl.textContent=learned>0?`${learned}/6 pieces learned`:'Start here!';
    learnEl.className='m-badge '+(learned>0?'prog':'rec');
  }
  const solved=prog.puzzlesSolved||0;
  const puzzleEl=document.getElementById('puzzleBadge');
  if(puzzleEl) puzzleEl.textContent=solved>0?`${solved} solved`:'';
  const wins=prog.wins||0,losses=prog.losses||0,draws=prog.draws||0;
  const total=wins+losses+draws;
  const playEl=document.getElementById('playBadge');
  if(playEl) playEl.textContent=total>0?`${wins}W ${losses}L ${draws}D`:'';
}

/* ================================================================
   LEARN MODE
   ================================================================ */
const PIECE_LESSONS=[
  {piece:'P',name:'Pawn',icon:'♙',value:1,desc:'Pawns move forward one square (or two from their starting row). They capture diagonally — one square forward-left or forward-right. They\'re the foot soldiers of chess!',tip:'Pawns are the only pieces that capture differently from how they move. Try to get them to the other side to promote them!',setup:b=>{b[4][3]={piece:'P',color:'w'};b[3][4]={piece:'P',color:'b'};b[3][2]={piece:'P',color:'b'}}},
  {piece:'R',name:'Rook',icon:'♖',value:5,desc:'Rooks move in straight lines — up, down, left, or right — as many squares as they want (as long as nothing blocks them). They\'re powerful pieces!',tip:'Rooks love open files (columns with no pawns). Put them on open lines and they control the whole board!',setup:b=>{b[4][3]={piece:'R',color:'w'};b[4][7]={piece:'P',color:'b'};b[1][3]={piece:'P',color:'b'}}},
  {piece:'N',name:'Knight',icon:'♘',value:3,desc:'Knights move in an "L" shape — two squares in one direction and one square sideways (or vice versa). They\'re the only piece that can JUMP over others!',tip:'Knights are tricky! They can jump over pieces and are great in the center of the board where they control the most squares.',setup:b=>{b[4][3]={piece:'N',color:'w'};b[2][2]={piece:'P',color:'b'};b[6][6]={piece:'P',color:'w'}}},
  {piece:'B',name:'Bishop',icon:'♗',value:3,desc:'Bishops move diagonally — any number of squares in a diagonal line. Each bishop stays on the same color squares for the entire game!',tip:'Having two bishops (one on light, one on dark squares) is called the "bishop pair" and is very powerful!',setup:b=>{b[4][3]={piece:'B',color:'w'};b[1][6]={piece:'P',color:'b'};b[7][0]={piece:'P',color:'w'}}},
  {piece:'Q',name:'Queen',icon:'♕',value:9,desc:'The Queen is the most powerful piece! She moves like a Rook AND a Bishop combined — any number of squares in any straight line (horizontal, vertical, or diagonal).',tip:'The Queen is worth 9 points — almost as much as two Rooks! But be careful not to bring her out too early or she might get chased around.',setup:b=>{b[4][3]={piece:'Q',color:'w'};b[2][5]={piece:'P',color:'b'};b[4][6]={piece:'P',color:'b'}}},
  {piece:'K',name:'King',icon:'♔',value:'∞',desc:'The King can move one square in any direction. He\'s the most important piece — if your King is checkmated, you lose! But he can also capture enemy pieces.',tip:'Keep your King safe, usually behind pawns. In the endgame (when most pieces are gone), the King becomes an active fighter!',setup:b=>{b[4][3]={piece:'K',color:'w'};b[2][4]={piece:'P',color:'b'}}},
];
let currentLesson=0;

function openLearn(){
  const prog=getUserProgress();
  const learned=prog.learnedPieces||[];
  const grid=document.getElementById('pieceGrid');
  if(!grid)return;
  grid.innerHTML='';
  PIECE_LESSONS.forEach((l,i)=>{
    const card=document.createElement('div');
    card.className='piece-card'+(learned.includes(l.piece)?' completed':'');
    card.style.animationDelay=`${0.05*i}s`;
    card.onclick=()=>openLesson(i);
    card.innerHTML=`<span class="p-icon">${l.icon}</span><div class="p-name">${l.name}</div><div class="p-val">Value: ${l.value}</div>`;
    grid.appendChild(card);
  });
  showScreen('learn');
}

function openLesson(idx){
  currentLesson=idx;
  const l=PIECE_LESSONS[idx];
  const iconEl=document.getElementById('lessonIcon');
  const titleEl=document.getElementById('lessonTitle');
  const infoEl=document.getElementById('lessonInfo');
  const nextBtn=document.getElementById('lessonNextBtn');
  if(iconEl) iconEl.textContent=l.icon;
  if(titleEl) titleEl.textContent=l.name;
  if(infoEl) infoEl.innerHTML=`<h3>${l.icon} How the ${l.name} moves</h3><p>${l.desc}</p><div class="tip">💡 ${l.tip}</div>`;
  if(nextBtn) nextBtn.textContent=idx<PIECE_LESSONS.length-1?'Next Piece →':'Back to Pieces';
  const board=Array(8).fill(null).map(()=>Array(8).fill(null));
  l.setup(board);
  const el=document.getElementById('learnBoard');
  if(!el)return;
  const renderLearn=()=>{
    renderBoard(el,board,{onClick:(r,c)=>{
      const p=board[r][c];
      if(p&&p.color==='w'){
        const moves=getMoves(board,r,c,false);
        const dots=moves.filter(m=>m.type==='move').map(m=>[m.tr,m.tc]);
        const caps=moves.filter(m=>m.type==='capture').map(m=>[m.tr,m.tc]);
        renderBoard(el,board,{onClick:renderLearn,selected:[r,c],moveDots:dots,captureDots:caps});
      }
    }});
  };
  renderLearn();
  const prog=getUserProgress();
  const learned=new Set(prog.learnedPieces||[]);
  learned.add(l.piece);
  saveProgress({learnedPieces:[...learned]});
  showScreen('lesson');
}

function nextLesson(){
  if(currentLesson<PIECE_LESSONS.length-1)openLesson(currentLesson+1);
  else openLearn();
}

/* ================================================================
   PUZZLE MODE
   ================================================================ */
const PUZZLES=[
  {name:'Checkmate in 1 #1',hint:'White to move — checkmate!',tier:'intermediate',board:b=>{b[0][4]={piece:'K',color:'b'};b[7][4]={piece:'K',color:'w'};b[1][3]={piece:'Q',color:'w'};b[6][0]={piece:'R',color:'w'}},solution:{fr:1,fc:3,tr:0,tc:3},after:'The Queen delivers checkmate! The King can\'t escape.'},
  {name:'Checkmate in 1 #2',hint:'White to move — checkmate!',tier:'intermediate',board:b=>{b[0][7]={piece:'K',color:'b'};b[0][6]={piece:'P',color:'b'};b[1][7]={piece:'P',color:'b'};b[2][5]={piece:'Q',color:'w'};b[7][4]={piece:'K',color:'w'}},solution:{fr:2,fc:5,tr:1,tc:6},after:'Queen to g7 is checkmate! The pawns block the King\'s escape.'},
  {name:'Win the Queen!',hint:'White can capture Black\'s Queen for free!',tier:'beginner',board:b=>{b[0][4]={piece:'K',color:'b'};b[3][5]={piece:'Q',color:'b'};b[7][4]={piece:'K',color:'w'};b[5][3]={piece:'N',color:'w'}},solution:{fr:5,fc:3,tr:3,tc:4},after:'The Knight forks the King and Queen! (It attacks both at once.)'},
  {name:'Checkmate in 1 #3',hint:'White to move — checkmate the King!',tier:'advanced',board:b=>{b[0][4]={piece:'K',color:'b'};b[0][3]={piece:'R',color:'b'};b[0][5]={piece:'B',color:'b'};b[1][4]={piece:'P',color:'b'};b[7][4]={piece:'K',color:'w'};b[6][4]={piece:'R',color:'w'};b[5][4]={piece:'R',color:'w'}},solution:{fr:5,fc:4,tr:0,tc:4},after:'Rook takes pawn with check, and it\'s checkmate! Back-rank mate!'},
  {name:'Win Material',hint:'White can win a free piece! Find it.',tier:'beginner',board:b=>{b[0][4]={piece:'K',color:'b'};b[7][4]={piece:'K',color:'w'};b[3][3]={piece:'B',color:'b'};b[3][5]={piece:'N',color:'b'};b[4][4]={piece:'P',color:'w'};b[5][1]={piece:'B',color:'w'}},solution:{fr:5,fc:1,tr:3,tc:3},after:'Bishop takes Bishop — a free piece! It was undefended.'},
  {name:'Checkmate in 1 #4',hint:'Deliver checkmate in one move!',tier:'intermediate',board:b=>{b[0][6]={piece:'K',color:'b'};b[0][5]={piece:'R',color:'b'};b[1][6]={piece:'P',color:'b'};b[1][7]={piece:'P',color:'b'};b[7][4]={piece:'K',color:'w'};b[4][7]={piece:'Q',color:'w'}},solution:{fr:4,fc:7,tr:0,tc:7},after:'Queen to h8 is checkmate! The Rook on f8 can\'t help.'},
];
let activePuzzles=[];
let puzzleIdx=0,puzzleSolved=0,puzzleBoard=null;

function openPuzzleMenu(){
  const tier = typeof getAgeTier === 'function' ? getAgeTier() : 'intermediate';
  const tierOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
  const maxTierIdx = tierOrder.indexOf(tier);

  activePuzzles = PUZZLES.filter(p => {
    const pTierIdx = tierOrder.indexOf(p.tier || 'intermediate');
    return pTierIdx <= maxTierIdx;
  });

  puzzleIdx=0;puzzleSolved=0;loadPuzzle();showScreen('puzzle')
}

function loadPuzzle(){
  if(puzzleIdx>=activePuzzles.length){
    const fb=document.getElementById('puzzleFeedback');
    if(fb) fb.innerHTML=`<span style="color:var(--gold)">🎉 All puzzles complete! ${puzzleSolved}/${activePuzzles.length} solved</span>`;
    const nb=document.getElementById('nextPuzzleBtn');
    if(nb) nb.style.display='none';
    const prog=getUserProgress();
    saveProgress({puzzlesSolved:Math.max(prog.puzzlesSolved||0,puzzleSolved)});
    return;
  }
  const pz=activePuzzles[puzzleIdx];
  puzzleBoard=Array(8).fill(null).map(()=>Array(8).fill(null));
  pz.board(puzzleBoard);
  const labelEl=document.getElementById('puzzleLabel');
  const scoreEl=document.getElementById('puzzleScore');
  const hintEl=document.getElementById('puzzleHint');
  const fbEl=document.getElementById('puzzleFeedback');
  const nextBtn=document.getElementById('nextPuzzleBtn');
  if(labelEl) labelEl.textContent=`Puzzle ${puzzleIdx+1}/${activePuzzles.length}`;
  if(scoreEl) scoreEl.textContent=`⭐ ${puzzleSolved}`;
  if(hintEl) hintEl.textContent=pz.hint;
  if(fbEl) fbEl.textContent='';
  if(nextBtn) nextBtn.style.display='none';
  let selected=null;
  const el=document.getElementById('puzzleBoard');
  if(!el)return;
  const render=()=>{
    let moveDots=[],captureDots=[];
    if(selected){
      const moves=getMoves(puzzleBoard,selected[0],selected[1]);
      moveDots=moves.filter(m=>m.type==='move').map(m=>[m.tr,m.tc]);
      captureDots=moves.filter(m=>m.type==='capture').map(m=>[m.tr,m.tc]);
    }
    renderBoard(el,puzzleBoard,{selected,moveDots,captureDots,onClick:(r,c)=>{
      const s=puzzleBoard[r][c];
      if(selected){
        const moves=getMoves(puzzleBoard,selected[0],selected[1]);
        const move=moves.find(m=>m.tr===r&&m.tc===c);
        if(move){
          const sol=pz.solution;
          if(move.fr===sol.fr&&move.fc===sol.fc&&move.tr===sol.tr&&move.tc===sol.tc){
            puzzleBoard[r][c]=puzzleBoard[move.fr][move.fc];puzzleBoard[move.fr][move.fc]=null;
            puzzleSolved++;
            if(scoreEl) scoreEl.textContent=`⭐ ${puzzleSolved}`;
            if(fbEl) fbEl.innerHTML=`<span style="color:var(--green)">✅ Correct! ${pz.after}</span>`;
            if(nextBtn) nextBtn.style.display='';
            showFeedback('🎉');
            selected=null;
            renderBoard(el,puzzleBoard,{lastMove:move});
            return;
          }else{
            if(fbEl) fbEl.innerHTML=`<span style="color:var(--red)">❌ Not quite — try again!</span>`;
            showFeedback('🤔');
            selected=null;render();return;
          }
        }
        if(s&&s.color==='w'){selected=[r,c];render()}
        else{selected=null;render()}
      }else{
        if(s&&s.color==='w'){selected=[r,c];render()}
      }
    }});
  };
  render();
}

function nextPuzzle(){puzzleIdx++;loadPuzzle()}

/* ================================================================
   PLAY MODE — Simple AI
   ================================================================ */
let playBoard=null,playerTurn=true,gameActive=false;
let capturedByWhite=[],capturedByBlack=[],lastPlayMove=null;

function openPlay(){
  if (typeof canPlayChess === 'function' && !canPlayChess()) {
    const limit = getChessLimit();
    const msg = limit === 0 ? 'Chess is currently disabled.' : 'You have used all your Chess plays for this week! 🔒';
    alert(msg);
    return;
  }

  playBoard=newBoard();playerTurn=true;gameActive=true;
  capturedByWhite=[];capturedByBlack=[];lastPlayMove=null;
  
  if (typeof recordChessPlay === 'function') {
    recordChessPlay();
  }

  const goEl=document.getElementById('gameOverWrap');
  const cbEl=document.getElementById('capturedBlack');
  const cwEl=document.getElementById('capturedWhite');
  const stEl=document.getElementById('playStatus');
  if(goEl) goEl.innerHTML='';
  if(cbEl) cbEl.innerHTML='';
  if(cwEl) cwEl.innerHTML='';
  if(stEl){stEl.textContent='Your turn (White)';stEl.style.color='var(--cream)'}
  renderPlayBoard();
  showScreen('play');
}

function renderPlayBoard(){
  const el=document.getElementById('playBoard');
  if(!el)return;
  let selected=null;
  const render=()=>{
    let moveDots=[],captureDots=[],checkSq=null;
    if(selected){
      const moves=getMoves(playBoard,selected[0],selected[1]);
      moveDots=moves.filter(m=>m.type==='move').map(m=>[m.tr,m.tc]);
      captureDots=moves.filter(m=>m.type==='capture').map(m=>[m.tr,m.tc]);
    }
    if(isInCheck(playBoard,'w')){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(playBoard[r][c]&&playBoard[r][c].piece==='K'&&playBoard[r][c].color==='w')checkSq=[r,c]}
    if(isInCheck(playBoard,'b')){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(playBoard[r][c]&&playBoard[r][c].piece==='K'&&playBoard[r][c].color==='b')checkSq=[r,c]}
    renderBoard(el,playBoard,{selected,moveDots,captureDots,checkSquare:checkSq,lastMove:lastPlayMove,onClick:(r,c)=>{
      if(!gameActive||!playerTurn)return;
      const s=playBoard[r][c];
      if(selected){
        const moves=getMoves(playBoard,selected[0],selected[1]);
        const move=moves.find(m=>m.tr===r&&m.tc===c);
        if(move){
          makeMove(playBoard,move,'w');
          lastPlayMove=move;
          selected=null;
          playerTurn=false;
          const st=document.getElementById('playStatus');
          if(st) st.textContent='Computer thinking...';
          render();
          if(checkGameEnd('b'))return;
          setTimeout(()=>{aiMove();render()},500);
          return;
        }
        if(s&&s.color==='w'){selected=[r,c];render()}
        else{selected=null;render()}
      }else{
        if(s&&s.color==='w'){selected=[r,c];render()}
      }
    }});
  };
  render();
}

function makeMove(board,move,color){
  const captured=board[move.tr][move.tc];
  if(captured){
    if(color==='w')capturedByWhite.push(captured);
    else capturedByBlack.push(captured);
    updateCaptured();
  }
  board[move.tr][move.tc]=board[move.fr][move.fc];
  board[move.fr][move.fc]=null;
  const p=board[move.tr][move.tc];
  if(p.piece==='P'&&(move.tr===0||move.tr===7))p.piece='Q';
}

function updateCaptured(){
  const cbEl=document.getElementById('capturedBlack');
  const cwEl=document.getElementById('capturedWhite');
  if(cbEl) cbEl.innerHTML=capturedByWhite.map(p=>pieceChar(p.piece,p.color)).join('');
  if(cwEl) cwEl.innerHTML=capturedByBlack.map(p=>pieceChar(p.piece,p.color)).join('');
}

function aiMove(){
  if(!gameActive)return;
  const tier = typeof getAgeTier === 'function' ? getAgeTier() : 'intermediate';
  const moves=allMoves(playBoard,'b');
  if(moves.length===0)return;

  // Scale AI difficulty: Beginner sometimes makes random moves
  if (tier === 'beginner' && Math.random() < 0.5) {
    const best = moves[Math.floor(Math.random() * moves.length)];
    makeMove(playBoard,best,'b');
    lastPlayMove=best;
    playerTurn=true;
    const st=document.getElementById('playStatus');
    if(st) st.textContent='Your turn (White)';
    checkGameEnd('w');
    return;
  }

  const scored=moves.map(m=>{
    let score=Math.random()*0.5;
    const target=playBoard[m.tr][m.tc];
    if(target)score+=PIECE_VALUES[target.piece]*10;
    const nb=cloneBoard(playBoard);nb[m.tr][m.tc]=nb[m.fr][m.fc];nb[m.fr][m.fc]=null;
    if(isInCheck(nb,'w'))score+=5;
    if(m.tr>=3&&m.tr<=4&&m.tc>=3&&m.tc<=4)score+=1;
    if(playBoard[m.fr][m.fc].piece==='K')score-=2;

    // Advanced/Expert nuances: prioritize check
    if (tier === 'advanced' || tier === 'expert') {
      if (isInCheck(nb, 'w')) score += 5;
    }

    return{move:m,score};
  });

  scored.sort((a,b)=>b.score-a.score);

  let best;
  if (tier === 'expert') {
    best = scored[0].move; // Always pick best
  } else {
    // Intermediate/Advanced: usually pick best, sometimes pick from top 3
    const pickIdx = Math.random() < 0.8 ? 0 : Math.min(scored.length - 1, Math.floor(Math.random() * 3));
    best = scored[pickIdx].move;
  }

  makeMove(playBoard,best,'b');
  lastPlayMove=best;
  playerTurn=true;
  const st=document.getElementById('playStatus');
  if(st) st.textContent='Your turn (White)';
  checkGameEnd('w');
}

function checkGameEnd(colorToMove){
  if(isCheckmate(playBoard,colorToMove)){
    gameActive=false;
    const winner=colorToMove==='w'?'Computer':'You';
    const emoji=colorToMove==='w'?'😔':'🏆';
    const prog=getUserProgress();
    if(colorToMove==='b'){saveProgress({wins:(prog.wins||0)+1});showFeedback('🏆')}
    else{saveProgress({losses:(prog.losses||0)+1});showFeedback('😔')}
    const st=document.getElementById('playStatus');
    if(st) st.textContent='Game Over!';
    const goEl=document.getElementById('gameOverWrap');
    if(goEl) goEl.innerHTML=`<div class="game-over-box"><h2>${emoji} ${winner} win${winner==='You'?'':'s'}!</h2><p>Checkmate!</p><div class="go-btns"><button class="btn-gold" onclick="openPlay()">Play Again ♟️</button><button class="btn-outline" onclick="goMenu()">Menu</button></div></div>`;
    return true;
  }
  if(isStalemate(playBoard,colorToMove)){
    gameActive=false;
    const prog=getUserProgress();
    saveProgress({draws:(prog.draws||0)+1});
    showFeedback('🤝');
    const st=document.getElementById('playStatus');
    if(st) st.textContent='Game Over!';
    const goEl=document.getElementById('gameOverWrap');
    if(goEl) goEl.innerHTML=`<div class="game-over-box"><h2>🤝 Stalemate!</h2><p>It's a draw — no legal moves.</p><div class="go-btns"><button class="btn-gold" onclick="openPlay()">Play Again ♟️</button><button class="btn-outline" onclick="goMenu()">Menu</button></div></div>`;
    return true;
  }
  return false;
}

// ── Boot safely after DOM is ready ──
document.addEventListener('DOMContentLoaded', init);
