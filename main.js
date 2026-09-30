/*
  The moving parts, all four of them: the stage's scale, the picture, the tip that changes, and the emblems.

  Everything here is the same arithmetic the game's own loading screen does (ui/apps/charmenu/src/Loading.tsx),
  written without a framework so the page is three files and no build step.

  For screenshots, three query parameters pin what is otherwise random or moving:
    ?image=hogwarts1   which picture
    ?tip=0             which tip, held still
    ?frame=0           which frame of the flipbook, held still
  Garry's Mod appends its own parameters (gamemode, mapname, maxplayers, steamid, hostname); they are ignored.
*/

(function () {
  'use strict';

  // generic1 is deliberately absent: that one is the room Lua paints behind the character menu, not a loading picture
  var IMAGES = ['hogwarts1', 'hogwarts3', 'hogwarts5', 'hogsmeade2', 'overland2', 'sanctuary1'];

  var TIPS = [
    'Envanterini ve ekipmanını TAB menüsünden yönetebilirsin.',
    'Hanenin puanı, hane üyelerinin davranışlarıyla kazanılır ve kaybedilir.',
    'Yasak Orman öğrencilere kapalıdır. Kurallara uymayanlar ceza alır.',
    'Rol yaparken karakterinin geçmişini ve kanını göz önünde bulundur.',
    'Hogsmeade köyüne yalnızca izin verilen günlerde gidilebilir.',
    'Bir profesöre saygısızlık, hanenden puan götürür.',
    'Karakter açıklamanı Karakter sekmesinden istediğin zaman düzenleyebilirsin.',
  ];

  /** frames in the house flipbook and how fast it plays */
  var FRAMES = 36;
  var FRAME_MS = 70;

  /** how long a tip stays up */
  var TIP_MS = 6000;

  var params = {};

  (location.search || '').replace(/^\?/, '').split('&').forEach(function (pair) {
    if (!pair) return;
    var parts = pair.split('=');
    params[decodeURIComponent(parts[0])] = decodeURIComponent((parts[1] || '').replace(/\+/g, ' '));
  });

  function whole(value, fallback) {
    var number = parseInt(value, 10);
    return isNaN(number) ? fallback : number;
  }

  /* ---- the stage ------------------------------------------------------------------------------------------- */

  var stage = document.getElementById('stage');

  /*
    The band and the corner are measured on a 1920x1080 stage, so the stage is scaled to whatever window the
    game gives us - the same `min(w/1920, h/1080)` the UI kit uses (ui/packages/kit/src/assets.ts). On a wider
    screen the picture fills the extra width and the stage stays centred, which is what the game does.
  */
  function scale() {
    var k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080) || 1;
    stage.style.setProperty('--k', k.toFixed(4));
  }

  scale();
  window.addEventListener('resize', scale);

  /* ---- the picture ----------------------------------------------------------------------------------------- */

  var wanted = params.image;
  var image = IMAGES.indexOf(wanted) !== -1 ? wanted : IMAGES[Math.floor(Math.random() * IMAGES.length)];

  document.getElementById('image').style.backgroundImage = 'url("assets/loading/' + image + '.jpg")';

  /* ---- the tip --------------------------------------------------------------------------------------------- */

  var tipBox = document.getElementById('tip');
  var tip = params.tip !== undefined ? whole(params.tip, 0) % TIPS.length : Math.floor(Math.random() * TIPS.length);

  /*
    The text is written into a fresh element each time. The original gets this for free by keying the paragraph,
    and it matters: re-running a CSS animation needs the element to be new, or the fade would play once and the
    later tips would simply appear.
  */
  function showTip() {
    var next = document.createElement('p');
    next.className = tipBox.className;
    next.id = tipBox.id;
    next.textContent = TIPS[tip];

    tipBox.parentNode.replaceChild(next, tipBox);
    tipBox = next;
  }

  showTip();

  if (params.tip === undefined) {
    window.setInterval(function () {
      tip = (tip + 1) % TIPS.length;
      showTip();
    }, TIP_MS);
  }

  /* ---- the emblems ----------------------------------------------------------------------------------------- */

  /*
    The sheet is white artwork with an alpha channel, and the game shows it in gold. In the UI that is a CSS
    mask over a gold background; the loading screen's browser does not do masks, so the same thing is drawn by
    hand: the cell first, then gold poured over it with `source-in`, which keeps the gold only where the
    artwork was. Canvas is as old as browsers get, so this works wherever the page opens.
  */
  var spinner = document.getElementById('spinner');
  var ink = spinner.getContext('2d');
  var sheet = new Image();
  var frame = 0;
  var ready = false;

  function show() {
    if (!ready) return;

    var cell = sheet.width / 6;
    var size = spinner.width;

    ink.clearRect(0, 0, size, size);
    ink.globalCompositeOperation = 'source-over';
    ink.drawImage(sheet, (frame % 6) * cell, Math.floor(frame / 6) * cell, cell, cell, 0, 0, size, size);

    ink.globalCompositeOperation = 'source-in';
    ink.fillStyle = 'rgb(226, 196, 128)';
    ink.fillRect(0, 0, size, size);
  }

  sheet.onload = function () {
    ready = true;
    show();
  };

  sheet.src = 'assets/derived/loading_houses.png';

  if (params.frame !== undefined) {
    frame = whole(params.frame, 0) % FRAMES;
  } else {
    window.setInterval(function () {
      frame = (frame + 1) % FRAMES;
      show();
    }, FRAME_MS);
  }

  /* ---- the music ------------------------------------------------------------------------------------------- */

  /*
    Quiet enough to sit under the screen rather than on top of it, and it fades in over three seconds so it
    never starts with a jolt in somebody's headphones. `?mute=1` turns it off, which is what screenshots use.

    A browser may refuse to start audio before the page has been touched. Nobody touches a loading screen, so
    the refusal is caught and tried again: on the first sign of life, and once a second for a little while.
    Failing all of that, the screen is simply silent - it is a loading screen, not a music player.
  */
  var VOLUME = 0.7;
  var FADE_MS = 3000;

  var music = document.getElementById('music');

  if (music && params.mute !== '1') {
    music.volume = 0;

    var started = false;
    var faded = false;

    function fade() {
      if (faded) return;
      faded = true;

      var from = Date.now();

      var timer = window.setInterval(function () {
        var through = Math.min((Date.now() - from) / FADE_MS, 1);

        music.volume = VOLUME * through;

        if (through >= 1) window.clearInterval(timer);
      }, 50);
    }

    function start() {
      if (started) return;

      var playing = music.play();

      // older browsers answer with nothing rather than a promise
      if (!playing || !playing.then) {
        started = true;
        fade();
        return;
      }

      playing.then(function () {
        started = true;
        fade();
      }, function () {
        /* blocked for now; the listeners below will try again */
      });
    }

    start();

    var wake = function () {
      start();
    };

    document.addEventListener('click', wake);
    document.addEventListener('keydown', wake);
    document.addEventListener('mousemove', wake);

    var tries = 0;

    var again = window.setInterval(function () {
      tries = tries + 1;

      if (started || tries > 20) {
        window.clearInterval(again);
        return;
      }

      start();
    }, 1000);
  }

  /* ---- what Garry's Mod calls ------------------------------------------------------------------------------ */

  /*
    The game calls these on the page as it downloads: the server's details first, then the file counts and each
    file as it arrives. This screen shows none of it on purpose - it is the game's own loading screen, which
    counts nothing - but they are defined all the same, because a call to a function that is not there is an
    error in the game's console, and the page should leave none behind.
  */
  window.GameDetails = function () {};
  window.SetFilesTotal = function () {};
  window.SetFilesNeeded = function () {};
  window.DownloadingFile = function () {};
  window.SetStatusChanged = function () {};
})();
