//1~'手',11~'棒',21~'杖',31~'鞭',41~'爪',51~'槌',61~'剣',71~'盾',101~装備以外
//鍵の入手時、game.scene.refresh()を行う。doorTileを開けられるかどうかを更新するため。

const item = [
  {
    number: 1,
    name: '手:野球グローブ',
    footnum: 1,
    pow: 3,
    powup: 0.2,
    info: '攻撃力:3\n攻撃力アップ:20%\n触手ではキャッチは難しそう'
  },
  {
    number: 11,
    name: '棒:木の棒',
    footnum: 2,
    pow: 3,
    guarddown: 0.1,
    info: '攻撃力:3\n敵の防御力ダウン:10%\n枝です'
  },
  {
    number: 101,
    name: 'ドアの鍵',
    info: '茶色いドアを開けられる'
  }
  ];
  
  //takarabakoNameのメモ
  //あ,い
