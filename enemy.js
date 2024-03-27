const enemies = [
 {
    num:0,
    name: 'スライム',
    hp: 2,
    pow: 500,
    exp: 1000,
    imgsrc:'./image/enemy_slime.png'
  },
  {
    num:1,
    name: 'スライム',
    hp: 40,
    pow: 5,
    exp: 25,
    imgsrc: './image/enemy_slime.png'
  },
  {
    num: 2,
    name: 'スライム',
    hp: 30,
    pow: 9,
    exp: 25,
    imgsrc: './image/enemy_slime.png'
  }
];

let enemyImages = [];
for (var i = 0; i < enemies.length; i++) {
  let _img = new Image();
  _img.src = enemies[i].imgsrc;
  enemyImages.push(_img);
}
