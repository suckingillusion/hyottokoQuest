const displayWidth = 480; // canvasの幅と高さ
const displayHeight = 480;
 
let started = false; // ゲームは開始されたか？
let cleared = false; // ゲームをクリアしたか？
 
let message = ''; // 城で会話しているときなどに表示されるメッセージ
let canMessageNext = false;  //決定ボタンを押して次のメッセージに移れる状態かどうか
let messageOnBattle = ''; // 戦闘中に表示されるメッセージ
 
let showCommandButtons = false; // 戦闘コマンドを表示させるかどうか？
let blackout = [0,null,'up',0];  //ブラックアウトの透明度,次のシーン,透明度を上げるか下げるか,暗転の時間(ms)
 const SCENE_BLACK_OUT = -1; // シーンとシーンの切り替わりの背景が黒一色の状態
 const SCENE_MY_CASTLE = 1; // 自分の城
 const SCENE_FIELD = 2; // フィールド上
 const SCENE_ENEMY_CASTLE = 3; // 魔王の城
 const SCENE_ZAKO_BATTLE = 4; // ザコ敵との戦闘シーン
 const SCENE_BOSS_BATTLE = 5;


let appearanceRate = 0.01; // ザコ敵出現率

// 描画処理用のイメージ
const blockSize = 32;

// 画像
let playerImage = new Image(blockSize, blockSize);
playerImage.src = './image/player.png';
let wallImage = new Image(blockSize, blockSize);
wallImage.src = './image/wall.png';
let flatImage = new Image(blockSize, blockSize);
flatImage.src = './image/flat.png';
let mountainImage = new Image(blockSize, blockSize);
mountainImage.src = './image/mountain.png';
let boxImage = new Image(blockSize, blockSize);
boxImage.src = './image/box.png';
let boxemptyImage = new Image(blockSize, blockSize);
boxemptyImage.src = './image/box_empty.png';
let unkoImage = new Image(blockSize, blockSize);
unkoImage.src = './image/unko.png';
let docterImage = new Image(blockSize, blockSize);
docterImage.src = './image/docter.png';
let mekatanaImage = new Image(blockSize, blockSize);
mekatanaImage.src = './image/mekatana.png';
let monitorImage = new Image(blockSize, blockSize);
monitorImage.src = './image/monitor.png';
let slimeImage = new Image(blockSize, blockSize);
slimeImage.src = './image/slime.png';



let can = document.getElementById('canvas');
can.width = displayWidth;
can.height = displayHeight;

/* @type {CanvasRenderingContext2D | null | undefined} */
let ctx = can.getContext('2d');



const playerName = 'ひょっおほ先生';
const magicName = '攻撃魔法';

const initPlayerMaxHP = 30;
let playerMaxHP = initPlayerMaxHP;
let playerHP = playerMaxHP;

const initPlayerMaxMP = 30;
let playerMaxMP = initPlayerMaxMP;
let playerMP = playerMaxMP;

let playerEXP = 0;

class Player {
  constructor() {
    this.name = playerName;
    this.maxhp = playerMaxHP;
    this.hp = playerHP;
    this.maxmp = playerMaxMP;
    this.mp = playerMP;
    this.exp = 0;
    this.maxexp = 100;
    this.items = [];
    this.soubi = [0,0,0,0,0,0,0,0];
    this.foot = 1;
    this.takaraflag = [0,0];
    this.kaisyuuki = [0,0,0,0,0,0,0,0,0,0,0,0,0];
    this.needflag = 0; //ゲーム進行に必要な避けれないフラグ　加算していく

  }
}
let player = new Player();


// ボタン
let $up = document.getElementById('up');
let $down = document.getElementById('down');
let $left = document.getElementById('left');
let $right = document.getElementById('right');
 
let $fight = document.getElementById('fight');
let $magic1 = document.getElementById('magic1');
let $magic2 = document.getElementById('magic2');

let $titlebutton = document.getElementById('titlebutton');
let $hukkatuinput = document.getElementById('hukkatuinput');

let $menubutton = document.getElementById('menubutton');
let $abutton = document.getElementById('abutton');
let $bbutton = document.getElementById('bbutton');
 

 
// プレイヤーの移動速度
let speed = 4;
 
// 移動用のボタンが押され続けているかどうかのフラグ
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;


let isMenuOpen = false;  //メニューを開いているか
let menuSelected = [0,0,0]; //選択中の対象。
let lastField = [] ; //メニューから再開後に戻るためのもの

let isbattlenow = false;

function randomNum(a, b) { //a以上b以下の乱数を返す a,bは整数
  return a + Math.floor(Math.random() * (b - a + 1));
}

class Game{
  //現在のfield(=BaseMapを継承したクラス。game.sceneに入れる)や、バトルを担う
  constructor(){
    this.scene = title;  //BaseMapインスタンスを入れる
    this.dontmovetime = 0;
    
    this.battle = null;  //Battleインスタンスを入れる
    
    
  }
  add(map){
    this.scene = map;
  }
  battleAdd(enemyobj,option = null){
    isMenuOpen = false;
    menuClose();
    messageNext.syokika();
    ShowMenuButtons(false);
    isbattlenow = true;
    this.battle = new Battle(enemyobj,option);
  }
  battleEnd(option = null){
    ShowMenuButtons(true);
    isbattlenow = false;
    this.battle = null;
    if(option != null){
      this.dontmove();
      this.scene.battleEndEvent(option);
    }
  }
  battleLose(option = null){
    this.battleEnd();
    if(option == null){
      homeField = new HomeField(homemap);
      homeField.refresh();
      homeField.PlayerX = 8*blockSize;
      homeField.PlayerY = 16*blockSize;
      blackoutFunc(homeField,3000);
      setTimeout(()=>{
        let _face = new Image();
        _face.src = './image/face_docter.png';
        messageNext.face = _face;
        messageAdd(['自動回収機で引き戻しました。','くれぐれも無理なさらないように…'])
      },3000);
    }
  }
  Draw(){
    
    this.scene.Draw();
    if(this.dontmovetime > 0)ShowMoveButtons(false); //this.dontmovetimeが0になると表示されるのは、BaceMap.Draw()での処理
    
    if(this.battle != null){
      if(this.battle.finish == true){
        //バトルが終了していたら
        ShowMenuButtons(true);
        isbattlenow = false;
        this.battle = null;
      }
    }
    if(isbattlenow == true)this.battle.Draw();
  }
  Move(direct){
    if(this.dontmovetime > 0)return;
    if(isbattlenow == false){
      this.scene.Move(direct)
    }else{
      this.battle.Move(direct);
    }
  }
  
  dontmove(time = 1000){
    this.dontmovetime = 1;
    setTimeout(()=>{
      this.dontmovetime = 0
    },time);
  }
  aclick(){
    if(isbattlenow == false){
      this.scene.aclick();
    }else{
      this.battle.aclick();
    }
  }
  bclick(){
    if (isbattlenow == false) {
      this.scene.bclick();
    } else {
      this.battle.bclick();
    }
  }
}

class Battle{
  constructor(_enemyobj,_option = null){
    this.enemy = Object.assign({}, JSON.parse(JSON.stringify(_enemyobj)));
    this.option = _option;
    this.player = Object.assign({}, JSON.parse(JSON.stringify(player)));
    this.playersoubiobjs = [];
    for(let n=0;n<8;n++){
      let soubinum = this.player.soubi[n];
      let soubiobj = {
        number:0,
        pow:1
      }
      if(soubinum !=0)soubiobj = itemreturn(soubinum);
      this.playersoubiobjs.push(soubiobj);
    }
    
    this.playerPowUp = 1; //攻撃力アップ倍率
    this.enemyGuardDown = 1; //防御力ダウン倍率
    
    this.selectedcard = [0,0,0,0,0,0,0,0];  //選択されたら1になる
    this.card = [randomNum(1,8),randomNum(1,8),randomNum(1,8),randomNum(1,8),randomNum(1,8),randomNum(1,8),randomNum(1,8),randomNum(1,8)];
    this.selected = 11; //1~8はカード
    this.canSelectMove = true; //連続でmoveしないように
    
    this.message = new MessageOnBattle();
    //eventsとeventtimesを設定
    let battleMessageEventSet = () =>{
      this.message.events['e:敵画像を消す'] = () => {
        this.isenemyimgdissaper = true;
      };
      this.message.eventtimes['e:敵画像を消す'] = 100;
      this.message.events['e:経験値獲得'] = () => {
        player.exp += this.enemy.exp;
      };
      this.message.eventtimes['e:経験値獲得'] = 100;
      this.message.events['e:戦闘終了'] = () => {
        setTimeout(() => {
          game.battleEnd(this.option);
        }, 1000);
      };
      this.message.eventtimes['e:戦闘終了'] = 5000;
      this.message.events['e:次のターンへ'] = () => {
        this.player.hp -= Math.round(this.enemy.pow / _playerGuardUp);
        this.selectedcard = [0, 0, 0, 0, 0, 0, 0, 0];
        this.turn++;
      };
      this.message.eventtimes['e:次のターンへ'] = 1000;
      this.message.events['e:プレイヤーのHPを0に'] = () => {
          this.player.hp = 0;
      };
      this.message.eventtimes['e:プレイヤーのHPを0に'] = 100;
      this.message.events['e:敗北'] = () => {
        game.battleLose(this.option);
      };
      this.message.eventtimes['e:敗北'] = 5000;
    };
    battleMessageEventSet();
    
    this.turn = 1;
    this.isenemyimgdissaper = false;
    this.finish = false;
    
    let firstmesse = [this.enemy.name + 'が現れた!'];
    if(this.option == 'チュートリアル'){
      firstmesse.push('『ひょっおほ先生、\nモンスターです!』',
        '『その8本の足で\nやっつけちゃってください!』',
        '『棒を装備しているのは\n2番目の足ですよね。』',
        '『他の番号は\n「こうかん」しちゃいましょう!』');
    }
    this.message.messageInterval = 1000;
    this.message.add(firstmesse);
    this.message.read();
  }
  Draw(){
    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.rect(20,50,can.width - 40,230);
    ctx.rect(220,290,can.width - 240,120);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
   
    ctx.beginPath();
    ctx.fillStyle = '#000';
    ctx.rect(10, 10, 130, 65);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = "18px ＭＳ ゴシック";
    ctx.fillText(`HP ${this.player.hp} / ${player.maxhp}`, 14, 20 + 10);
    ctx.fillText(`MP ${this.player.mp} / ${player.maxmp}`, 14, 38 + 10);
    ctx.fillText(`EXP ${player.exp} / ${player.maxexp}`, 14, 56 + 10);
    ctx.closePath();
   
    if(this.isenemyimgdissaper == false){
      let img = new Image();
      img.src = this.enemy.imgsrc;
      ctx.beginPath();
      ctx.drawImage(img,0,0,1200,1600,(can.width - 3*50)/2,50,3 * 60,4 * 50);
      ctx.closePath();
    }
    
    
    for(let nu=1;nu<=8;nu++){
      let _y = 280 - 50;
      if(this.selectedcard[nu -1] != 0){
        //選択されていたら浮かす
        _y -= 15;
      }
      let _x = 20 + 13 + (40 + 13)*(nu -1);
      ctx.beginPath();
      ctx.fillStyle = '#657';
      ctx.rect(_x, _y, 40, 50);
      ctx.fill();
      if(this.selected == nu){
        //選択中のカードは枠が描かれる
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.fillStyle = 'white';
      ctx.font = "25px ＭＳ ゴシック";
      ctx.fillText(this.card[nu-1],_x + 12,_y + 34);
      ctx.closePath();
    }
    
    if(this.message.message == ''){
      ctx.beginPath();
      ctx.fillStyle = 'white';
      ctx.font = "16px ＭＳ ゴシック";
      ctx.fillText('こうかん',220 +40,290 +30);
      ctx.fillText('たたかう',220 +40,290 +30*2);
      if(this.option != 'チュートリア' && this.option != 'ボス'){
        ctx.fillText('にげる',220 +40,290 +30*3);
      }
      ctx.fillText('とくぎ',220 + 40 + 110,290 +30);
      
      //印の描画
      let _x = 220 + 10;
      if(this.selected >= 14)_x += 110;
      let _y = 290 + 30 + 30 *( (this.selected - 11)%3 );
      if(this.selected < 11)_y = 290 + 30; //カード選択中なら'こうかん'にカーソルをおいておく
      ctx.fillText('＞',_x,_y);
      
      ctx.closePath();
    }else{
      ctx.beginPath();
      ctx.font = "14px ＭＳ ゴシック";
      ctx.fillStyle = 'white';
      let texts = this.message.message.split('\n');
      ctx.fillText(texts[0], 220 +20,290 +30);
      if (texts.length > 1) {
        ctx.fillText(texts[1], 220 +20,290 +30*2);
        if (texts.length > 2) {
          ctx.fillText(texts[2], 220 + 20, 290 + 30 * 3);
        }
      }
      if (this.message.canMessageNext == true) {
        ctx.fillText('▼', 220 +40 + 160,290 +30*3 + 14);
      }
    }
    
  }
  Move(direct){
    if(this.message.message == '' && this.canSelectMove == true){
      this.canSelectMove = false;
      setTimeout(()=>{this.canSelectMove = true},150);
      if(this.selected >= 11){
        if(direct == 'right'){
          if(this.selected <= 13)this.selected += 3;
        }
        if(direct == 'left'){
          if(this.selected >= 14)this.selected -= 3;
        }
        if(direct == 'up'){
          if(this.selected != 11 && this.selected != 14)this.selected -= 1;
        }
        if(direct == 'down'){
          if(this.selected != 13 && this.selected != 16)this.selected += 1;
        }
      }else if(this.selected >=1 && this.selected < 11){
        if(direct == 'right'){
          this.selected++;
          if(this.selected == 9)this.selected = 1;
        }
        if(direct == 'left'){
          this.selected--;
          if(this.selected == 0)this.selected = 8;
        }
        if(direct == 'up'){
          this.selectedcard[this.selected -1] = 1;
        }
        if(direct == 'down'){
          this.selectedcard[this.selected -1] = 0;
        }
      }
    }
  }
  aclick(){
    if(this.message.message == '' && this.canSelectMove == true){
      if(this.selected == 11){
        this.selected = 1;
      }else if(this.selected >=1 && this.selected < 11){
        this.selectedcard[this.selected -1] = -this.selectedcard[this.selected -1] +1; //0なら1に、1なら0に
      }else if(this.selected == 12){
        //「たたかう」の処理
        
        this.selected = 11;
        //選択したカードをランダムに変える
        for(let n=0;n<8;n++){
          if(this.selectedcard[n] != 0){
            //this.selectedcard[n] = 0;
            this.card[n] = randomNum(1,8);
          }
        }
        //ダメージの算出
        this.playerPowUp = 1;
        this.enemyGuardDown = 1;
        let _playerGuardUp = 1;
        let _tumerenzoku = 1;
        let _tutirenzoku = 1;
        let _dames = [];
        let _messages = [];
        let damehosei = (num) =>{
          return  num * this.playerPowUp / this.enemyGuardDown;
        }
        for(let n=0;n<8;n++){
          let _asi = this.card[n];
          let _dame ;
          if(this.playersoubiobjs[_asi -1].number == 0){
            //装備してない場合
            _dame = damehosei(1);
          }else if(_asi == 1){
            //手の場合
            this.playerPowUp += this.playersoubiobjs[0].powup;
            _dame = damehosei(this.playersoubiobjs[0].pow);
          }else if(_asi == 2){
            //棒の場合
            this.enemyGuardDown -= this.playersoubiobjs[1].guarddown;
            if(this.enemyGuardDown <= 0.5)this.enemyGuardDown = 0.5;
            _dame = damehosei(this.playersoubiobjs[1].pow);
          }
          //階段になっていたら、3つ目以降から攻撃倍率アップ
          let bairitu = 1;
          if(n >= 2){
            if(this.card[n] == this.card[n - 1] -1 && this.card[n] == this.card[n - 2] -2){
              bairitu += 0.1;
              if(n>= 3 && this.card[n] == this.card[n - 3] -3){
                bairitu += 0.2;
                if (n >= 4 && this.card[n] == this.card[n - 4] - 4) {
                  bairitu += 0.3;
                  if (n >= 5 && this.card[n] == this.card[n - 5] - 5) {
                    bairitu += 0.4;
                    if (n >= 6 && this.card[n] == this.card[n - 6] - 6) {
                      bairitu += 0.5;
                      if (n >= 7 && this.card[n] == this.card[n - 7] - 7) {
                        bairitu += 0.6;
                      }
                    }
                  }
                }
              }
            }
            if (this.card[n] == this.card[n - 1] + 1 && this.card[n] == this.card[n - 2] + 2) {
              bairitu += 0.1;
              if (n >= 3 && this.card[n] == this.card[n - 3] + 3) {
                bairitu += 0.2;
                if (n >= 4 && this.card[n] == this.card[n - 4] + 4) {
                  bairitu += 0.3;
                  if (n >= 5 && this.card[n] == this.card[n - 5] + 5) {
                    bairitu += 0.4;
                    if (n >= 6 && this.card[n] == this.card[n - 6] + 6) {
                      bairitu += 0.5;
                      if (n >= 7 && this.card[n] == this.card[n - 7] + 7) {
                        bairitu += 0.6;
                      }
                    }
                  }
                }
              }
            }
            _dame *= bairitu;
          }//階段倍率終わり
          _dame = Math.round(_dame);
          _dames.push(_dame);
          let _messe = 'ひょっおほ先生の攻撃!\n';
          if(bairitu != 1)_messe += '流れるような攻撃!\n';
          _messe += _dame + 'のダメージ!';
          _messages.push(_messe);
        }//for終わり _damesと_messagesに8つ入った
        //敵のhpを減らす
        this.enemy.hp -= _dames[0] + _dames[1] + _dames[2] + _dames[3] + _dames[4] + _dames[5] + _dames[6] + _dames[7] ;
        if(this.enemy.hp <=0){
          this.enemy.hp = 0;
          /*
          this.message.event = () => {
            this.isenemyimgdissaper = true;
            this.message.event = ()=>{
              player.exp += this.enemy.exp;
              this.message.event = ()=>{
                setTimeout(()=>{
                  game.battleEnd(this.option);
                },1000);
              }
            }
          }
          */
          
          _messages.push('event');
          _messages.push('e:敵画像を消す');
          _messages.push(this.enemy.name + 'をやっつけた!');
          _messages.push('event');
          _messages.push('e:経験値獲得');
          
          let pexp = player.exp + this.enemy.exp;
          let pmexp = player.maxexp;
          while(pexp >= pmexp){
            pexp -= pmexp;
            pmexp += 20;
            _messages.push('最大HPが増えた!');
            _messages.push('lvup');
          }
           
           _messages.push('event')
           _messages.push('e:戦闘終了');
        }else {
          //敵の攻撃
          
          _messages.push(this.enemy.name + 'の攻撃!\n' + Math.round(this.enemy.pow / _playerGuardUp) + 'ダメージくらった!');
          let _theEvename = 'e:次のターンへ';
          /*
          this.message.event = ()=>{
            this.player.hp -= Math.round(this.enemy.pow / _playerGuardUp);
            this.selectedcard = [0,0,0,0,0,0,0,0];
            this.turn++;
          };
          */
          if(this.player.hp <=Math.round(this.enemy.pow / _playerGuardUp)){
            /*
            this.message.event = () => {
              this.player.hp = 0;
              this.message.event = ()=>{
                game.battleLose(this.option);
              }
            }
            */
            _theEvename = 'e:敗北';
            _messages.push('event');
            _messages.push('e:プレイヤーのHPを0に');
            _messages.push('ひょっおほ先生は\nやられた!')
            
            
          }
          _messages.push('event');
          _messages.push(_theEvename);
          if (this.option == 'チュートリアル' && this.turn == 1) {
            _messages.push('『1,2,3みたいに\n順番になるように攻撃すると\n勢いがつきますね!』')
          }
        }
        //console.log(_messages);
        this.message.add(_messages);
        this.message.messageInterval = 500;
        this.message.read();
        
        //selected == 12　「たたかう」の処理　終わり
      }
    }else if(this.message.message != '' && this.message.canMessageNext == true){
      this.message.read();
    }
  }
  bclick(){
    if(this.message.message == ''){
      if(this.selected >=1 && this.selected < 11){
        this.selected = 11;
      }
    }
  }
}


class MessageNext{
  constructor(){
    this.txts = [''];
    this.face = null; //Image
    this.eventtime = 1000;
    
    this.events = {}; //eventname:functionを都度入れていく。会話が終わると中身を空に。
    this.eventtimes = {}; //eventname:timeを都度入れていく。会話が終わると中身を空に。
  }
  
  add(txtsArray){
    this.txts = [].concat(txtsArray);
    this.txts.push('');
    
  }
  
  read(){
    if(this.txts[0] == '' || this.txts[0] == null || this.txts[0] == undefined){
      this.syokika();
    }else if(this.txts[0] == 'event'){
      this.eventstart();
    }else{
      canMessageNext = false;
      message = this.txts[0];
      this.txts.splice(0,1);
      setTimeout(function(){
        canMessageNext = true;
      },1000);
    }
  }
  
  eventstart(){
    let _eventname = this.txts[1];
    this.events[_eventname]();
    this.txts.splice(0, 2);
    setTimeout(()=> {
      this.read();
    }, this.eventtimes[_eventname]);
  }
  
  //    event(){}  //オーバーライドする
  
  syokika(){
    message = '';
    this.txts = [''];
    this.face = null; //Image
    this.eventtime = 1000;
    canMessageNext = false;
    this.events = {};
    this.eventtimes = {};
  }
  Draw(){
    ctx.beginPath();
    ctx.fillStyle = '#000';
    ctx.rect(120, 340, 320, 80);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = "14px ＭＳ ゴシック";
    ctx.fillStyle = 'white';
    let texts = message.split('\n');
    ctx.fillText(texts[0], 140, 370);
    if (texts.length > 1) {
      ctx.fillText(texts[1], 140, 390);
    }
    if (canMessageNext == true) {
      ctx.fillText('▼', 415, 410);
    }
    //face画像の描画
    if (message != '' && messageNext.face != null) {
      ctx.drawImage(messageNext.face, 0, 0, 320, 320, 35, 339, 82, 82);
    }
    ctx.closePath();
  }
}
let messageNext = new MessageNext();


class MessageOnBattle {
  constructor() {
    this.message = '';
    this.txts = [''];
    this.face = null; //Imageオブジェクト
    this.eventtime = 10;
    this.canMessageNext = false;
    this.messageInterval = 500;
    
    this.events = {};
    this.eventtimes = {};
  }

  add(txtsArray) {
    this.txts = [].concat(txtsArray);
    this.txts.push('');

  }

  read() {
    if (this.txts[0] == '' || this.txts[0] == null || this.txts[0] == undefined) {
      this.syokika();
    } else if (this.txts[0] == 'event') {
      this.eventstart();
    }else if(this.txts[0] == 'lvup'){
      this.lvup();
      this.txts.splice(0, 1);
      this.read();
    } else {
      this.canMessageNext = false;
      this.message = this.txts[0];
      this.txts.splice(0, 1);
      setTimeout(()=> {
        this.canMessageNext = true;
      }, this.messageInterval);
    }
  }
  
  lvup(){
    player.exp -= player.maxexp;
    player.maxexp += 20;
    player.maxhp += 10;
    player.hp = player.maxhp;
  }

  eventstart() {
    let _eventname = this.txts[1];
    this.events[_eventname]();
    this.txts.splice(0, 2);
    setTimeout(() => {
      this.read();
    }, this.eventtimes[_eventname]);
  }

  // event() {} //オーバーライドする

  syokika() {
    this.message = '';
    this.txts = [''];
    this.face = null; //Image
    this.eventtime = 1000;
    this.canMessageNext = false;
    
  }
  Draw() {
    if(this.message == '' || this.message == 'event')return;
    ctx.beginPath();
    ctx.fillStyle = '#000';
    ctx.rect(120, 340, 320, 80);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "14px ＭＳ ゴシック";
    ctx.fillStyle = 'white';
    let texts = message.split('\n');
    ctx.fillText(texts[0], 140, 370);
    if (texts.length > 1) {
      ctx.fillText(texts[1], 140, 390);
    }
    if (canMessageNext == true) {
      ctx.fillText('▼', 415, 410);
    }
    //face画像の描画
    if (message != '' && messageNext.face != null) {
      ctx.drawImage(messageNext.face, 0, 0, 320, 320, 35, 339, 82, 82);
    }
    ctx.closePath();
  }
  
  aclick(){
    if(this.message != '' && this.message != 'event'){
      if(this.canMessageNext == true){
        this.read();
      }
    }
  }
  bclick(){}
}
 
 
 class Title{
   constructor(){
     ShowBattleButtons(false);
     ShowMoveButtons(false);
     
   }
   Draw(){
     ctx.beginPath();
     //ctx.globalAlpha = 1;
     ctx.fillStyle = 'black';
     ctx.fillRect(0, 0, displayWidth, displayHeight);
     
     ctx.fillStyle = '#fff';
     ctx.font = "40px ＭＳ ゴシック";
     ctx.fillText(`Hyottoko Quest`, 100, 90);
     
     ctx.font = "12px ＭＳ ゴシック";
     ctx.fillText(`©同人サークル　sucking illusion`, 280, 460);
     ctx.closePath();
   }
 }
 
 class BaseMap {
   constructor(mapText) {
     this.PlayerX = 0;
     this.PlayerY = 0;
     this.PlayerXmove = 0;
     this.PlayerYmove = 0;
 
     this.ArrMap = [];
 
     let arr = mapText.split('\n');
     for (let i = 0; i < arr.length; i++) {
       const arr2 = [...arr[i]];
       this.ArrMap.push(arr2);
     }
 
     this.RowMax = this.ArrMap.length;
     this.ColMax = this.ArrMap[0].length;
     
     this.takara = [];  //配列内に[row,col,itemnumber]を入れる
     this.talking = false;
   }
   
   getTakara(takaraarrnum){
         if(this.takara.length == 0)return;
         
         StopPlayer();
         if (this.talking || player.items.includes(this.takara[takaraarrnum][2]) == true)
           return;
     
         //console.log('talk');
         this.talking = true;
     
         if (player.foot <= 1) {
           messageAdd(['動かせる足が足りず、開けれない']);
           setTimeout(() => { this.talking = false }, 1000);
         } else {
           messageAdd(['『' +itemreturn(this.takara[takaraarrnum][2]).name +  '』を手に入れた']);
           setTimeout(() => { this.talking = false }, 1000);
           //player.takaraflag[0] = 1;
           this.ArrMap[this.takara[takaraarrnum][0]][this.takara[takaraarrnum][1]] = '空';
           player.items.push(this.takara[takaraarrnum][2]);
           
     
         }
   }
   
   Move(direct) {
     if(this.PlayerXmove !=0 || this.PlayerYmove != 0){
       return;
     }
     if (direct == 'left' && this.CanMove('left'))
       this.PlayerXmove -= blockSize;
     if (direct == 'right' && this.CanMove('right'))
       this.PlayerXmove += blockSize;
     if (direct == 'up' && this.CanMove('up'))
       this.PlayerYmove -= blockSize;
     if (direct == 'down' && this.CanMove('down'))
       this.PlayerYmove += blockSize;
   }
   
   CanMove(direct) {
     if (direct == 'up') {
       let playerRow = Math.floor((this.PlayerY - 4) / blockSize);
   
       let char1 = this.ArrMap[playerRow][Math.floor(this.PlayerX / blockSize)];
       let char2 = this.ArrMap[playerRow][Math.ceil(this.PlayerX / blockSize)];
       if (char1 != '、' && char1 != '段' && char1 != '床')
         return false;
       if (char2 != '、' && char2 != '段' && char2 != '床')
         return false;
   
       return true;
     }
     if (direct == 'down') {
       let playerRow = Math.ceil((this.PlayerY + 4) / blockSize);
   
       let char1 = this.ArrMap[playerRow][Math.floor(this.PlayerX / blockSize)];
       let char2 = this.ArrMap[playerRow][Math.ceil(this.PlayerX / blockSize)];
   
       if (char1 != '、' && char1 != '段' && char1 != '床')
         return false;
       if (char2 != '、' && char2 != '段' && char2 != '床')
         return false;
   
       return true;
     }
     if (direct == 'left') {
       let playerCol = Math.floor((this.PlayerX - 4) / blockSize);
   
       let char1 = this.ArrMap[Math.floor(this.PlayerY / blockSize)][playerCol];
       let char2 = this.ArrMap[Math.ceil(this.PlayerY / blockSize)][playerCol];
      // console.log(char2);
       if (char1 != '、' && char1 != '段' && char1 != '床' && char1 != '橋')
         return false;
       if (char2 != '、' && char2 != '段' && char2 != '床' && char2 != '橋')
         return false;
   
       return true;
     }
     if (direct == 'right') {
       let playerCol = Math.ceil((this.PlayerX + 4) / blockSize);
   
       let char1 = this.ArrMap[Math.floor(this.PlayerY / blockSize)][playerCol];
       let char2 = this.ArrMap[Math.ceil(this.PlayerY / blockSize)][playerCol];
   
       if (char1 != '、' && char1 != '段' && char1 != '床' && char1 != '橋')
         return false;
       if (char2 != '、' && char2 != '段' && char2 != '床' && char2 != '橋')
         return false;
   
       return true;
     }
   }
   
   MoveEvent(l = 0,r = 0,u = 0,d = 0){
     this.PlayerXmove -= blockSize * l;
     this.PlayerXmove += blockSize * r;
     this.PlayerYmove -= blockSize * u;
     this.PlayerYmove += blockSize * d;
   }
   
   Draw() {
     if (ctx == null)
       return;
   
     ctx.beginPath();
     ctx.globalAlpha = 1;
     ctx.fillStyle = 'black';
     ctx.fillRect(0, 0, can.width, can.height);
   
     if(this.PlayerXmove > 0){
       this.PlayerXmove -= speed;
       if(this.PlayerXmove < speed)this.PlayerXmove = 0;
       this.PlayerX += speed;
     }
     if (this.PlayerXmove < 0) {
       this.PlayerXmove += speed;
       if (this.PlayerXmove > - speed) this.PlayerXmove = 0;
       this.PlayerX -= speed;
     }
     if (this.PlayerYmove > 0) {
       this.PlayerYmove -= speed;
       if (this.PlayerYmove < speed) this.PlayerYmove = 0;
       this.PlayerY += speed;
     }
     if (this.PlayerYmove < 0) {
       this.PlayerYmove += speed;
       if (this.PlayerYmove > -speed) this.PlayerYmove = 0;
       this.PlayerY -= speed;
     }
   
   
     let shiftX = (displayWidth - blockSize) / 2 - this.PlayerX;
     let shiftY = (displayHeight - blockSize) / 2 - this.PlayerY;
   
     ctx.fillStyle = '#00f';
   
     for (let row = 0; row < this.RowMax; row++) {
       for (let col = 0; col < this.ColMax; col++) {
         if (this.ArrMap[row][col] == '黒') {
           ctx.fillStyle = 'black';
           ctx.fillRect(col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         }
         if (this.ArrMap[row][col] == '壁') {
           ctx.fillStyle = '#000';
           ctx.fillRect(col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         }
         if (this.ArrMap[row][col] == '棚') {
           ctx.drawImage(mekatanaImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         }
         if (this.ArrMap[row][col] == '、' || this.ArrMap[row][col] == '○')
           ctx.drawImage(flatImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         if (this.ArrMap[row][col] == '段')
           ctx.drawImage(stairsImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         if (this.ArrMap[row][col] == '壁')
           ctx.drawImage(wallImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         if (this.ArrMap[row][col] == '王') {
           ctx.drawImage(floorImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
           ctx.drawImage(kingImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         }
         if (this.ArrMap[row][col] == '敵') {
           ctx.drawImage(floorImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
           ctx.drawImage(devilImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         }
         if (this.ArrMap[row][col] == '床')
           ctx.drawImage(floorImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         if (this.ArrMap[row][col] == 'Ｍ' || this.ArrMap[row][col] == '・' || this.ArrMap[row][col] == '箱' ||this.ArrMap[row][col] == '空'||this.ArrMap[row][col] == '糞' ||this.ArrMap[row][col] == '医'||this.ArrMap[row][col] == '画' || this.ArrMap[row][col] == '粘') {
           if (this.ArrMap[row - 1][col] == '～')
             ctx.fillRect(col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
           else
             ctx.drawImage(flatImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         }
         if (this.ArrMap[row][col] == '～')
           ctx.fillRect(col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         if (this.ArrMap[row][col] == '橋')
           ctx.fillRect(col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
       }
     }
   
     for (let row = 0; row < this.RowMax; row++) {
       for (let col = 0; col < this.ColMax; col++) {
         if (this.ArrMap[row][col] == 'Ｍ')
           ctx.drawImage(mountainImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize , blockSize );
         if (this.ArrMap[row][col] == '箱')
          ctx.drawImage(boxImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         if (this.ArrMap[row][col] == '空')
          ctx.drawImage(boxemptyImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         if (this.ArrMap[row][col] == '糞')
           ctx.drawImage(unkoImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         if (this.ArrMap[row][col] == '医')
           ctx.drawImage(docterImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         if (this.ArrMap[row][col] == '画')
           ctx.drawImage(monitorImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         if (this.ArrMap[row][col] == '粘')
           ctx.drawImage(slimeImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
         if (this.ArrMap[row][col] == '城') {
           ctx.drawImage(flatImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
           ctx.drawImage(castle1Image, col * blockSize + shiftX, row * blockSize + shiftY, blockSize * 3, blockSize * 3);
         }
         if (this.ArrMap[row][col] == '魔') {
           ctx.drawImage(flatImage, col * blockSize + shiftX, row * blockSize + shiftY, blockSize, blockSize);
           ctx.drawImage(castle2Image, col * blockSize + shiftX, row * blockSize + shiftY, blockSize * 3, blockSize * 3);
         }
         if (this.ArrMap[row][col] == '橋')
           ctx.drawImage(bridgeImage, col * blockSize + shiftX, row * blockSize + shiftY + 8, blockSize, blockSize);
       }
     }
   
     ctx.drawImage(playerImage, (displayWidth - blockSize) / 2, (displayHeight - blockSize) / 2);
     ctx.closePath();
   
     if (message != '' && isbattlenow == false) {
       messageNext.Draw();
       /*上記処理に変更
       ctx.beginPath();
       ctx.fillStyle = '#000';
       ctx.rect(120, 340, 320, 80);
       ctx.fill();
       ctx.strokeStyle = 'white';
       ctx.lineWidth = 2;
       ctx.stroke(); 
       
       ctx.font = "14px ＭＳ ゴシック";
       ctx.fillStyle = 'white';
       let texts = message.split('\n');
       ctx.fillText(texts[0], 140, 370);
       if (texts.length > 1){
         ctx.fillText(texts[1], 140, 390);
       }
       if(canMessageNext == true){
         ctx.fillText('▼',415,410);
       }
       //face画像の描画
       if (message != '' && messageNext.face != null) {
         ctx.drawImage(messageNext.face,0,0,320,320,35,339,82,82 );
       }
       ctx.closePath();
       */
     }
     
   
     ShowMoveButtons(message == '' && !cleared && started && game.dontmovetime == 0);
     ShowBattleButtons(false);
     //DrawHPMP();
   }
   
   takaraImageRefresh() {
     //アイテムを持っていたら空箱の画像にする
     for (let x = 0; x < this.takara.length; x++) {
       if (player.items.includes(this.takara[x][2])) this.ArrMap[this.takara[x][0]][this.takara[x][1]] = '空';
     }
   }
   
   refresh(){
     this.takaraImageRefresh();
     
   }
   
   aclick(){} //オーバーライドする
   
   bclick(){}
 }
 
 

 
 
 
 function ShowMoveButtons(visible) {
   let display = visible ? 'block' : 'none';
 
   if ($up != null)
     $up.style.display = display;
   if ($down != null)
     $down.style.display = display;
   if ($left != null)
     $left.style.display = display;
   if ($right != null)
     $right.style.display = display;
 }
 
 function ShowBattleButtons(visible) {
   let display = visible ? 'block' : 'none';
 
   if ($fight != null)
     $fight.style.display = display;
   if ($magic1 != null)
     $magic1.style.display = display;
   if ($magic2 != null)
     $magic2.style.display = display;
 }
 
 function ShowTitleButtons(visible) {
   let display = visible ? 'block' : 'none';
 
   if ($titlebutton != null)
     $titlebutton.style.display = display;
   if ($hukkatuinput != null)
     $hukkatuinput.style.display = display;
   
 }
 
 function ShowMenuButtons(visible) {
   let display = visible ? 'block' : 'none';
 
   if ($menubutton != null)
     $menubutton.style.display = display;
 }
 
 function DrawHPMP() {
   if (ctx == null)
     return;
   ctx.beginPath();
   ctx.fillStyle = '#000';
   ctx.rect(10, 10, 130, 65);
   ctx.fill();
   ctx.strokeStyle = 'white';
   ctx.lineWidth = 2;
   ctx.stroke();
 
   ctx.fillStyle = '#fff';
   ctx.font = "18px ＭＳ ゴシック";
   ctx.fillText(`HP ${player.hp} / ${player.maxhp}`, 14, 20+10);
   ctx.fillText(`MP ${player.mp} / ${player.maxmp}`, 14, 38+10);
   ctx.fillText(`EXP ${player.exp} / 100`, 14, 56+10);
   ctx.closePath();
 }
 
 function StopPlayer() {
   moveLeft = false;
   moveRight = false;
   moveUp = false;
   moveDown = false;
 }
 
 
 class MapField extends BaseMap {
   constructor(mapText) {
     super(mapText);
     this.talking = false;
     this.Init();
     this.takara = [[10,7,1]]; //配列内に[row,col,itemnumber]を入れる
     
     //if(player.items.includes(1) == true)this.ArrMap[10][7] = '空;'
     this.takaraImageRefresh();
       
   }
   
   Init() {
     this.PlayerX = 4 * blockSize;
     this.PlayerY = 2 * blockSize;
   }
   
   
   
   Move(direct){
      // ゲーム開始前とメッセージが表示されているときとブラックアウト中は移動処理をおこなわない
      if (!started || message != '' || blackout[0] > 0)
        return;
      if(direct =='down' &&  this.PlayerX == blockSize*7 && this.PlayerY == blockSize*9){
        this.getTakara(0);
        return;
      }
      if (direct == 'down' && this.PlayerX == blockSize * 4 && this.PlayerY == blockSize * 11) {
        homeField.refresh();
        homeField.Init();
        blackoutFunc(homeField);
        return;
      }
      
      //デバッグ用
      if(direct == 'left' && this.PlayerX == blockSize*1 && this.PlayerY == blockSize*1){
        let _img = new Image();
        let _src = './image/enemy_slime.png';
        let _enemy = {
          name: 'スライム',
          hp: 2,
          pow: 500,
          exp:1000,
          imgsrc: _src
        };
        
        game.battleAdd(_enemy);
      }
      
      
      super.Move(direct);
     
   }
   
   talk(){
     StopPlayer();
     if (this.talking || player.items.includes(1) == true)
       return;
     
     //console.log('talk');
     this.talking = true;
     
     if(player.foot <= 1){
       messageAdd(['動かせる足が足りず、開けれない']);
       setTimeout(()=>{this.talking = false},1000);
     }else{
       messageAdd(['『手:野球グローブ』を手に入れた']);
       setTimeout(()=>{this.talking = false},1000);
       player.takaraflag[0] = 1;
       this.ArrMap[10][7] = '空';
       player.items.push(1);
       
     }
     /*let talkSpeed = 2000;
     message = `${playerName}さまの健闘をお祈りします。`;
     setTimeout(() => {
       message = `${playerName}の体力が全回復した。`;
       playerHP = playerMaxHP;
       playerMP = playerMaxMP;
     }, talkSpeed);
     setTimeout(() => {
       message = '';
       this.talking = false;
     }, talkSpeed * 2); */
     
   }
 }
 
 class HomeField extends BaseMap{
   constructor(maptext){
     super(maptext);
     this.Init();
     this.talking = false;
     this.takara = [[17,1,11]];
     
     this.takaraImageRefresh();
   }
   Init() {
     this.PlayerX = 7 * blockSize;
     this.PlayerY = 1 * blockSize;
   }
   Move(direct) {
       // ゲーム開始前とメッセージが表示されているときとブラックアウト中は移動処理をおこなわない
       if (!started || message != '' || blackout[0] > 0)
         return;
       if (direct == 'up' && this.PlayerX == blockSize * 7 && this.PlayerY == blockSize * 1) {
         mapField.PlayerX = 4 * blockSize;
         mapField.PlayerY = 11 * blockSize;
         mapField.refresh();
         blackoutFunc(mapField);
         return;
       }
       if (direct == 'left' && this.PlayerX == blockSize * 2 && this.PlayerY == blockSize * 17) {
         this.getTakara(0);
         return;
       }
       if (direct == 'up' && this.PlayerX == blockSize * 8 && this.PlayerY == blockSize * 14) {
         if (player.needflag == 1) {
           let _face = new Image();
           _face.src = './image/face_docter.png';
           messageNext.face = _face;
           messageAdd(['触るのがいやなら、\nなんか棒でも装備してもらって…']);
         }else{
           let _face = new Image();
           _face.src = './image/face_docter.png';
           messageNext.face = _face;
           messageAdd(['ねもい…']);
         }
       }
       if (direct == 'down' && this.PlayerX == blockSize * 3 && this.PlayerY == blockSize * 11) {
         if( player.needflag == 0){
           let _face = new Image();
           _face.src = './image/face_docter.png';
           messageNext.face = _face;
           messageNext.eventtime = 1000;
           /*messageNext.event = ()=>{
             game.scene.MoveEvent(0,5,0,3);
             setTimeout(()=>{
               messageNext.eventtime = 2000;
             },100);
             messageNext.event = ()=>{
               blackoutFunc(null,2000);
             };
           }; */
           messageNext.events['a'] = ()=>{
             game.scene.MoveEvent(0,5,0,3);
           };
           messageNext.eventtimes['b'] = 1000;
           messageNext.events['b'] = ()=>{
             blackoutFunc(null,2000);
           };
           messageNext.eventtimes['b'] = 2000;
         
           messageAdd([
            'おお、来ましたね',
            'event',
            'a',
            '地震でしょうか…',
            'どうやら我々は、閉じ込められて\nしまったようです',
            'とは言っても先生は\n遠隔操作のロボットですけどね…',
            '脱出の手助けを、\nどうかお願いしたいのですが…',
            'その前に先生の修理をしましょうか',
            'event',
            'b',
            'いやはや…',
            '備品が足りず、足3本しか直せませんでした',
            'さて…',
            'アレ、どかしてくれませんか?',
            'ほら、あっちにあったアレですよ',
            '触るのがいやなら、\nなんか棒でも装備してもらって…',
            'ていうかなぜあんなものが道端に…']);
           player.needflag++;
           player.foot = 3;
           return;
         }
       }
       if (direct == 'right' && this.PlayerX == blockSize * 8 && this.PlayerY == blockSize * 5) {
         if (player.needflag == 1 && player.soubi[1] != 0) {
           
           messageNext.eventtime = 1000;
           setTimeout(()=>{
             this.ArrMap[5][9] = '粘';
           },600);
           /*messageNext.event = () => {
             blackoutFunc(null,1000);
             setTimeout(() => {
               messageNext.eventtime = 200;
             }, 100);
             messageNext.event = () => {
               let  _imgsrc = './image/enemy_slime.png';
               let _enemy = {
                 name: 'スライム',
                 hp:40,
                 pow:5,
                 exp:10,
                 imgsrc:_imgsrc
               };
               game.battleAdd(_enemy,'チュートリアル');
             };
           };
           */
           messageNext.events['a'] = ()=>{
             blackoutFunc(null,1000);
           };
           messageNext.eventtimes['a'] = 1000;
           messageNext.events['b'] = () => {
             let _imgsrc = './image/enemy_slime.png';
             let _enemy = {
               name: 'スライム',
               hp: 40,
               pow: 5,
               exp: 10,
               imgsrc: _imgsrc
             };
             game.battleAdd(_enemy, 'チュートリアル');
           };
           messageNext.eventtimes['b'] = 200;
       
           messageAdd([
                   'event',
                   'a',
                   'なんと、スライムが化けていた!!',
                   'event',
                   'b']);
           player.needflag++;
           return;
         }
       }
       super.Move(direct);
   }
   refresh(){
     super.refresh();
     if(player.needflag >= 2){
       this.ArrMap[5][9] = '、';
       
     }
   }
   battleEndEvent(option){
     if(option == 'チュートリアル'){
       player.needflag++; //3になる
       player.kaisyuuki[0] = 1;
       this.ArrMap[5][9] = '、';
       
       blackoutFunc(null,0,8,14);
       console.log('flag:' + player.needflag);
       messageAdd([
         '『おそらく今のモンスターは\n研究室から脱走したのでしょう』',
         '『研究室に通信してみます…』',
         '『……』',
         '『ダメです、繋がりません…』',
         '『ひょっおほ先生、\nモンスターを倒しつつ』',
         '『研究室に向かってください。』',
         '『先生には自己修復機能が\nありますので』',
         '『戦闘を終えると回復します。』',
         '『それと、自動回収機を渡しておきます。』',
         '『もしやられても\nここに連れ戻しますので』',
         '『ご安心を。』',
         '『では、お願いします。』'
       ]);
     }
   }
 }
 
 
 
 let mapField = new MapField(map1Text);
 let homeField = new HomeField(homemap);
 
 let title = new Title();
 let game = new Game();
 
 
 
 
 function Draw() {
   if (ctx == null)
     return;
 
   ctx.beginPath();
   ctx.clearRect(0, 0, can.width, can.height);
   ctx.closePath();
   if (game.scene == SCENE_BLACK_OUT) {
     ctx.beginPath();
     ctx.fillStyle = 'black';
     ctx.fillRect(0, 0, can.width, can.height);
     ctx.closePath();
     ShowMoveButtons(false);
     ShowBattleButtons(false);
   }else{
     
    game.Draw();
    
    //メニューの描画
    if(isMenuOpen == true && message == '' && isbattlenow == false){
      
      ctx.beginPath();
      ctx.fillStyle = 'black';
      ctx.rect(230, 300, 230, 120 );
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = "16px ＭＳ ゴシック";
      ctx.fillText('もちもの', 260, 330);
      ctx.fillText('そうび', 260, 330 + 30);
      ctx.fillText('とくぎ', 260, 330 + 30*2);
      ctx.fillText('ステータス', 260 + 100, 330);
      let _x = 1;
      if(menuSelected[0] >= 4)_x=2;
      let _y = menuSelected[0] % 3;
      if(_y == 0)_y = 3;
      ctx.fillText('＞', 245 + 100*( _x - 1), 330 + 30*(_y - 1));
      ctx.closePath();
      
      DrawHPMP();
    }
   }
   
   //blackoutの処理
   if(blackout[0] > 0 || blackout[2] == 'down'){
     ctx.beginPath();
     ctx.fillStyle = 'black';
     ctx.globalAlpha = blackout[0];
     //if(blackout[0] *100 % 2 == 0)console.log(ctx);
     ctx.fillRect(0, 0, can.width, can.height);
     ctx.globalAlpha = 1;
     ctx.closePath();
     //ShowMoveButtons(false);
     ShowBattleButtons(false);
     if(blackout[0] >= 1 && blackout[1] != null){
       game.add(blackout[1]);
       blackout[1] = null;
     }
     let frame = 8;
     frame = frame /2 /100 ;
     if(blackout[2] == 'up'){
       blackout[0] += frame;
       if(blackout[0] >= 1){
         blackout[0] = 1;
         game.dontmove(blackout[3] + 500);
         setTimeout(function(){
           blackout[2] = 'down';
         },blackout[3]);
         
       }
     }else if(blackout[2] == 'down'){
       blackout[0] -= frame;
       if (blackout[0] <= 0) {
         blackout[0] = 0;
         blackout[1] = null;
         blackout[2] = 'up';
         //if(message == '')ShowMoveButtons(true);
       }
     }
   }
 }
 
 
 
 
 
 $left?.addEventListener('touchstart', () => {
   moveLeft = true;
 });
 $left?.addEventListener('touchend', () => {
   moveLeft = false;
 });
 $left?.addEventListener('mousedown', () => {
   moveLeft = true;
 });
 $left?.addEventListener('mouseup', () => {
   moveLeft = false;
 });
 
 $right?.addEventListener('touchstart', () => {
   moveRight = true;
 });
 $right?.addEventListener('touchend', () => {
   moveRight = false;
 });
 $right?.addEventListener('mousedown', () => {
   moveRight = true;
 });
 $right?.addEventListener('mouseup', () => {
   moveRight = false;
 });
 
 $up?.addEventListener('touchstart', () => {
   moveUp = true;
 });
 $up?.addEventListener('touchend', () => {
   moveUp = false;
 });
 $up?.addEventListener('mousedown', () => {
   moveUp = true;
 });
 $up?.addEventListener('mouseup', () => {
   moveUp = false;
 });
 
 $down?.addEventListener('touchstart', () => {
   moveDown = true;
 });
 $down?.addEventListener('touchend', () => {
   moveDown = false;
 });
 $down?.addEventListener('mousedown', () => {
   moveDown = true;
 });
 $down?.addEventListener('mouseup', () => {
   moveDown = false;
 });
 
 let $main = document.getElementById('main');
 $main?.addEventListener('mouseup', () => {
   moveLeft = false;
   moveRight = false;
   moveUp = false;
   moveDown = false;
 });
 
 // PCのキー操作にも対応させる
 document.onkeydown = function(e) {
   if (e.keyCode == 37)
     Move('left');
   if (e.keyCode == 38)
     Move('up');
   if (e.keyCode == 39)
     Move('right');
   if (e.keyCode == 40)
     Move('down');
 }
 
 
 let mainloop = () => {
   if (moveLeft)
     Move('left');
   if (moveRight)
     Move('right');
   if (moveUp)
     Move('up');
   if (moveDown)
     Move('down');
 
   Draw();
   
   requestAnimationFrame(mainloop);
 }
 
 let canmenumove = true;
 function menuwait(){
   canmenumove = false;
   setTimeout(
     function(){
       canmenumove = true;
     },100
   );
 }
 
 function Move(direct) {
   if (cleared) // ゲームクリア時は移動処理はおこなわない
     return;
   if(isMenuOpen == true && canmenumove == true && isbattlenow == false){
     if(menuSelected[1] == 0){
       //1段目
       let num = menuSelected[0];
       if(direct == 'left'){
         menuwait();
         if(num >= 4)menuSelected[0] -= 3;
       }else if(direct == 'right'){
         menuwait();
         if(num >= 0 && num <= 3)menuSelected[0] += 3;
       }else if(direct == 'up'){
         menuwait();
         if(num % 3 != 1)menuSelected[0] -= 1;
       }else if(direct == 'down'){
         menuwait();
         if(num % 3 != 0)menuSelected[0] += 1;
       }
     }
   }else if(isMenuOpen == false){
     game.Move(direct);
   }
 }
 
 
 function Start() {
   InitPlayerPosition();
   cleared = false;
   started = true;
   
   mainloop();
 }
 

 
 function InitPlayerPosition() {
   mapField.Init();
 }
 
 function titleOnclick(){
   //ふっかつのじゅもんを読み込む処理
   
   
   
   ShowTitleButtons(false);
   $abutton.style.display = 'block';
   $bbutton.style.display = 'block';
   $menubutton.style.display = 'block';
   messageNext.eventtime = 5000 / 5;
   messageNext.event = ()=>{
     game.dontmove(5000 / 5);
   }
   if(player.needflag == 0){
     //はじめから
     //messageAdd(['event','ピピピ…','『ひょっおほ先生、聞こえますか』','『ログイン状態は確認できるのですが』','『メッセージ送信機能が\n壊れているようですね…』','『動けるようでしたら至急、\n 管制室まで来てください』']); 
     mapField.refresh();
     blackoutFunc(mapField,2000 / 2);
   }else{
     //つづきから
     
   }
   
   
   
 }
 
 function blackoutFunc(nextField = null,antenjikan = 0,playerxzahyou = null,playeryzahyou = null){
   blackout[0] = 0.01;
   blackout[1] = nextField;
   if(playerxzahyou != null){
     if(nextField == null){
       game.scene.PlayerX = playerxzahyou * blockSize;
     }else{
       blackout[1].PlayerX = playerxzahyou * blockSize;
     }
   }
   if(playeryzahyou != null){
     if (nextField == null) {
       game.scene.PlayerY = playeryzahyou * blockSize;
     } else {
       blackout[1].PlayerY = playeryzahyou * blockSize;
     }
   }
   blackout[2] = 'up';
   blackout[3] = antenjikan;
 }

function messageAdd(_messagesarray){
  messageNext.add(_messagesarray);
  messageNext.read();
  /*
  canMessageNext = false;
  setTimeout(function() {
    canMessageNext = true;
  }, 1000);
  */
}

class Motimonomenu{
  constructor(_player){
    this.items = [];
    //_player.itemsを逆順にする
    for(let k =player.items.length - 1;k>=0;k--){
      this.items.push(_player.items[k]);
    }
    this.selected = 0; //-1は'入手順',-2は'種類順'を選択中
    this.page = 1;  //現在のページ
    this.onePageCanItemNum = 7 *2; //1ページに表示できるアイテム数
    
    this.sort = '入手順';
    
    this.sortArray = [].concat(this.items);
    
    this.maxpage = Math.ceil(this.sortArray.length / this.onePageCanItemNum);
    
    this.canmove = true;  //連続で動かされないように
    
  }
  Draw(){
    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,can.width,can.height);
    ctx.fillStyle = 'white';
    ctx.font = "16px ＭＳ ゴシック";
    ctx.fillText('もちもの', 30, 30);
    if(this.sort != '入手順'){
      ctx.fillStyle = 'gray';
    }
    ctx.fillText('入手順', 30 + 270 , 30);
    ctx.fillStyle = 'white';
    if (this.sort != '種類順') {
      ctx.fillStyle = 'gray';
    }
    ctx.fillText('種類順', 30 + 270 + 100, 30);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.rect(15,10,95,30);
    ctx.stroke();
    ctx.rect(15,50,445,240);
    ctx.stroke();
    ctx.rect(can.width / 2 - 10,290,230,120);
    ctx.stroke();
    
    //アイテムの表示
    for(let n=0;n<this.onePageCanItemNum;n++){
      if(n + 1 + this.onePageCanItemNum * (this.page - 1) > this.sortArray.length )continue;
      let _n = n + this.onePageCanItemNum * (this.page - 1);
      let _x = 50 ;
      if(n >= this.onePageCanItemNum / 2)_x += 210;
      let _y = 75 + 30 * (n % (this.onePageCanItemNum / 2 ));
      let _name = itemreturn(this.sortArray[_n]).name;
      
      ctx.fillStyle = 'white';
      ctx.fillText(_name, _x , _y, 185);
    }
    
    //ページ数の表示
    let pagesuuwidth = ctx.measureText(this.page + '/' + this.maxpage).width;
    ctx.fillText(this.page + '/' + this.maxpage ,(can.width - pagesuuwidth) / 2 ,280);
    
    //選択中の印の表示
    let selectedx = 50 - 20;
    if(this.selected >= this.onePageCanItemNum / 2)selectedx += 210;
    let selectedy = 75 + 30 * (this.selected % (this.onePageCanItemNum / 2 ));
    if(this.selected < 0){
      //ソートを選択中の場合
      selectedx = 30+270-20 + (- this.selected -1)*100;
      selectedy = 30;
    }
    ctx.fillText('＞',selectedx,selectedy);
    
    //説明文を表示。\nで改行させ、文字数によっても自動で改行させる。
    if(this.selected + 1 + this.onePageCanItemNum * (this.page - 1) > this.sortArray.length ){
      //無を選択中ならなにもしない
    }else if(this.selected >= 0){
       
      let _info = itemreturn(this.sortArray[this.selected + this.onePageCanItemNum * (this.page - 1)]).info;
      // _info = 'ああ\nああああああああああああああああああああああ';
      let oneLineMojisuu = 13;
      _info = _info.split('\n');
      let yetLines = 0;
      for(let t=0;t<_info.length;t++){
        let _txt = _info[t];
        let howmanylines = Math.ceil(_txt.length / oneLineMojisuu);
        for (let li = 0; li < howmanylines; li++) {
          let _texts = _txt.substr(li * oneLineMojisuu, oneLineMojisuu);
          ctx.fillText(_texts, can.width/2, 320 + 25 * (yetLines));
          yetLines++;
        }
      }
    }
    
    

  }
  Move(direct){
    if(this.canmove == false)return;
    
    this.canmove = false;
    setTimeout(()=>{this.canmove = true},200);
    
    if(direct == 'right'){
      if(this.selected >= 0){
        this.selected += this.onePageCanItemNum/2;
        if(this.selected +1 > this.onePageCanItemNum){
          this.page++;
          this.selected -= this.onePageCanItemNum;
          if(this.page > this.maxpage)this.page = 1;
        }
      }else
      if (this.selected < 0) {
        this.selected = -3 - this.selected;
      }
    }
    if (direct == 'left') {
      if (this.selected >= 0) {
        this.selected -= this.onePageCanItemNum / 2;
        if (this.selected < 0) {
          this.page--;
          this.selected += this.onePageCanItemNum ;
          if (this.page < 1) this.page = this.maxpage;
        }
      }else
      if(this.selected <0){
        this.selected = -3 - this.selected;
      }
    }
    if(direct == 'up'){
      if(this.selected >= 0 && this.selected % (this.onePageCanItemNum /2) > 0){
        this.selected--;
      }else
      if(this.selected == 0 || this.selected == this.onePageCanItemNum/2){
        this.selected = -1;
      }else
      if (this.selected < 0) {
        this.selected = this.onePageCanItemNum  -1;
      }
    }
    if(direct == 'down'){
      if(this.selected >= 0 && this.selected % (this.onePageCanItemNum /2) < 6){
        this.selected++;
      }else
      if ( this.selected == this.onePageCanItemNum - 1) {
        this.selected = -1;
      }else
      if(this.selected == this.onePageCanItemNum /2 - 1){
        this.selected = 0;
      }else
      if(this.selected < 0){
        this.selected = this.onePageCanItemNum /2;
      }
    }
    console.log('選択中:' + this.selected);
    
  }
  aclick(){
    //ソートの処理
    if(this.sort =='入手順' && this.selected == -2){
      this.sort = '種類順';
      let _arr = this.sortArray;
      for(let m=0;m<this.items.length;m++){
        for(let n=0;n<this.items.length -1;n++){
          if(_arr[n] > _arr[n + 1]){
            let karioki = _arr[n + 1];
            _arr[n + 1] = _arr[n];
            _arr[n] = karioki;
          }
        }
      }
    }else if(this.sort == '種類順' && this.selected == -1){
      this.sort = '入手順';
      this.sortArray = [].concat(this.items);
    }
    
  }
  bclick(){
    game.add(lastField[0]);
    lastField = [];
  }
}

class Soubimenu{
  constructor(_player){
    this.items = [];
    //_player.itemsを逆順にする
    for(let k =_player.items.length - 1;k>=0;k--){
      if(_player.items[k] / 100 < 1 ){  //100以上は装備品じゃない
        this.items.push(_player.items[k]);
      }
    }
    this.selected = -1; //負の数は足を選択中
    this.foot = 0; //どの足の装備を選択中か
    this.page = 1;  //現在の装備品ページ
    this.onePageCanItemNum = 8; //1ページに表示できるアイテム数
    
    this.sortArray = [];
    this.sort();
    
    this.maxpage = Math.ceil(this.sortArray.length / this.onePageCanItemNum);
    
    this.canmove = true;  //連続で動かされないように
    
  }
  Draw(){
    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,can.width,can.height);
    ctx.fillStyle = 'white';
    ctx.font = "16px ＭＳ ゴシック";
    ctx.fillText('そうび', 30, 30);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.rect(15,10,95,30);
    ctx.stroke();
    //ctx.rect(15,50,445,240);
    ctx.rect(15,50,205,240);
    ctx.stroke();
    ctx.rect(can.width / 2 - 10,50,230,240 );
    ctx.rect(can.width / 2 - 10,290 ,230,120 );
    ctx.stroke();
    
    //装備中のアイテムの表示
    for(let n=0;n<8;n++){
      let _n = n ;
      let _x = 50;
      let _y = 75 + 30 * n ;
      let _name ;
      if(player.soubi[_n] != 0){
        _name = itemreturn(player.soubi[_n]).name;
      }else{
        if(n+1 <= player.foot){
        let _namearr = ['手','棒','杖','鞭','爪','槌','剣','盾'];
        _name = _namearr[n] + ':(装備なし)';
        }else{
          _name = '(装備不可)'
        }
      }
      
      ctx.fillStyle = 'white';
      ctx.fillText(_name, _x, _y, 185);
    }
    
    //アイテムの表示
    this.sort();
    for(let n=0;n<this.onePageCanItemNum;n++){
      if(n + 1  > this.sortArray.length )continue;
      if(n + 1 > player.foot)continue;
      let _n = n ;
      let _x = 50 +210;
      let _y = 75 + 30 *n;
      let _name = itemreturn(this.sortArray[_n]).name;
      
      ctx.fillStyle = 'white';
      ctx.fillText(_name, _x , _y, 185);
    }
    
    //選択中の印の表示
    let selectedx = 50 +210 - 20;
    let selectedy = 75 + 30 * (this.selected );
    if(this.selected < 0){
      //footを選択中の場合
      selectedx = 50-20;
      selectedy = 75 + 30* (-this.selected -1);
    }
    ctx.fillText('＞',selectedx,selectedy);
    
    //説明文を表示。\nで改行させ、文字数によっても自動で改行させる。
    if(this.selected + 1  > this.sortArray.length && this.selected >= 0 ){
      //無を選択中ならなにもしない
    }else {
      
      let _info = '';
      if(this.selected >= 0){
        _info = itemreturn(this.sortArray[this.selected ]).info;
      }else if(this.selected < 0 && player.soubi[- this.selected -1] != 0 && -this.selected <= player.foot){
        _info = itemreturn(player.soubi[- this.selected -1]).info;
      }
      // _info = 'ああ\nああああああああああああああああああああああ';
      let oneLineMojisuu = 13;
      _info = _info.split('\n');
      let yetLines = 0;
      for(let t=0;t<_info.length;t++){
        let _txt = _info[t];
        let howmanylines = Math.ceil(_txt.length / oneLineMojisuu);
        for (let li = 0; li < howmanylines; li++) {
          let _texts = _txt.substr(li * oneLineMojisuu, oneLineMojisuu);
          ctx.fillText(_texts, can.width/2, 320 + 25 * (yetLines));
          yetLines++;
        }
      }
    }
    
    

  }
  Move(direct){
    if(this.canmove == false)return;
    
    this.canmove = false;
    setTimeout(()=>{this.canmove = true},200);
    
    if(direct == 'right'){
      if(this.selected >= 0){
        //なにもしない
      }else
      if (this.selected < 0) {
        this.selected = 0;
      }
    }
    if (direct == 'left') {
      if (this.selected >= 0) {
        this.selected = -this.foot -1;
      }else
      if(this.selected <0){
        //なにもしない
      }
    }
    if(direct == 'up'){
      if(this.selected >= 0 && this.selected  > 0){
        this.selected--;
      }else
      if(this.selected == 0 ){
        this.selected = 7;
      }else
      if (this.selected < 0) {
        this.selected += 1;
        if(this.selected == 0)this.selected = -8;
        this.foot = -this.selected -1;
        
      }
    }
    if(direct == 'down'){
      if(this.selected >= 0 && this.selected < this.onePageCanItemNum -1){
        this.selected++;
      }else
      if ( this.selected == this.onePageCanItemNum - 1) {
        this.selected = 0;
      }else
      if(this.selected < 0){
        this.selected -= 1;
        if(this.selected == -9)this.selected = -1;
        this.foot = -this.selected -1;
      }
    }
    console.log('選択中:' + this.selected);
    
  }
  sort(){
    this.sortArray = [];
    for(let x=0;x<this.items.length;x++){
      if(Math.floor(this.items[x] / 10) == this.foot){
        //itemの十の位がfootに対応。現在選択中のfootの装備のみ抽出
        this.sortArray.push(this.items[x]);
      }
    }
    //番号順にする
    for (let m = 0; m < this.sortArray.length; m++) {
      for (let n = 0; n < this.sortArray.length - 1; n++) {
        if (this.sortArray[n] > this.sortArray[n + 1]) {
          let karioki = this.sortArray[n + 1];
          this.sortArray[n + 1] = this.sortArray[n];
          this.sortArray[n] = karioki;
        }
      }
    }
  }
  aclick(){
    //アイテムを装備する
    if(this.selected >=0 && this.selected + 1  <= this.sortArray.length ){
      player.soubi[this.foot] = this.sortArray[this.selected];
    }else if(this.selected < 0){
      this.selected = 0;
    }
  }
  bclick(){
    if(this.selected >=0){
      this.selected = -this.foot -1;
    }else{
      game.add(lastField[0]);
      lastField = [];
    }
  }
}


function itemreturn(number){
  //番号からアイテムインスタンスを返す
  for (let p = 0; p < item.length; p++) {
    if (item[p].number == number) {
      let obj = Object.assign({}, JSON.parse(JSON.stringify(item[p])));
      return obj;
    }
  }
  return false;
}

function aOnclick(){
  if(isbattlenow == true){
    game.aclick();
  }else
  if(message != ''){
    //メッセージが表示されている場合
    if(canMessageNext == true){
      canMessageNext = false;
      messageNext.read();
    }
  }else if(menuSelected[0] != 0){
    //メニューを開いている場合
    if(menuSelected[0]== 1){
      //もちもの
      menuSelected = [0,0,0];
      isMenuOpen = false;
      lastField.push(game.scene);
      let motimonomenu = new Motimonomenu(player);
      game.add(motimonomenu);
      
    }else if(menuSelected[0] == 2){
      //そうび
      menuSelected = [0, 0, 0];
      isMenuOpen = false;
      lastField.push(game.scene);
      let soubimenu = new Soubimenu(player);
      game.add(soubimenu);
      
    }
    
  }else if(message == ''){
    game.aclick();
  }
}

function bOnclick(){
  if(isbattlenow == true ){
    game.bclick();
  }else
  if(isMenuOpen == true && menuSelected[1] == 0){
    menuClose();
    return;
  }else
  if(message == ''){
    game.bclick();
  }
}
 
 function menuOnclick(){
   if(isMenuOpen == false){
     if(message != ''){
       return;
     }
     menuSelected[0] = 1;
     isMenuOpen = true;
     $abutton.style.display = 'block';
     $bbutton.style.display = 'block';
    
   }else{
     menuClose();
     
   }
 }
 
 function menuClose(){
   isMenuOpen = false;
   menuSelected = [0, 0, 0];
 }
 
 
 Start();
