void function() {

  var dollarOne = new RD.DollarOne({
    threshold: 0.3,
    ratio1D: 0.2,
    rotationInvariance: Math.PI / 4,
    normalPointCount: 40,
    normalSize: 200,
  });

  var shapeTypeDict = {};
  var shapeSamples = {
    1: [ // ○
      [[127,130],[113,134],[100,140],[86,150],[73,161],[60,177],[49,194],[40,212],[33,230],[28,250],[27,269],[27,287],[29,305],[35,320],[43,335],[53,349],[63,362],[77,373],[93,386],[111,395],[129,399],[149,402],[168,402],[186,399],[203,395],[221,386],[237,374],[254,360],[270,339],[284,316],[292,290],[295,265],[293,240],[286,217],[275,195],[259,175],[237,157],[208,141],[177,133],[158,131],[157,131]]
    ],

    2: [ // J
      [[265,56],[265,63],[264,77],[262,95],[260,116],[258,139],[256,161],[254,183],[252,203],[251,222],[249,238],[248,254],[247,268],[245,280],[244,292],[242,303],[239,314],[235,325],[230,334],[226,343],[220,350],[213,357],[204,363],[196,367],[188,368],[178,369],[168,367],[156,362],[144,353],[134,342],[121,329],[112,316],[103,304],[97,294]]
    ],

    3: [ // M
      [[64,379],[68,369],[72,358],[78,342],[84,326],[89,309],[96,290],[103,271],[111,252],[118,231],[126,212],[132,196],[138,182],[142,170],[145,163],[149,156],[152,151],[154,149],[156,147],[158,146],[159,146],[161,148],[164,153],[168,165],[171,180],[174,199],[176,216],[179,234],[182,253],[185,270],[188,286],[190,301],[193,316],[195,330],[197,343],[198,354],[199,362],[201,367],[202,370],[202,371],[202,371],[203,371],[204,365],[208,348],[213,326],[221,302],[228,279],[235,257],[245,231],[254,207],[262,187],[271,166],[278,148],[284,136],[287,127],[289,123],[290,122],[291,122],[292,123],[294,129],[296,142],[298,163],[300,187],[303,215],[307,242],[311,268],[315,290],[319,309],[323,324],[326,331]]
    ],

    4: [ // □
      [[157,347],[155,387],[155,421],[152,466],[150,512],[145,559],[143,609],[140,656],[138,700],[135,742],[130,784],[128,821],[125,860],[120,892],[118,919],[115,939],[113,959],[113,969],[113,976],[113,981],[113,984],[115,986],[123,991],[140,991],[167,991],[202,988],[244,984],[291,979],[335,974],[384,971],[431,971],[473,974],[510,979],[542,981],[569,986],[589,988],[606,991],[621,991],[628,988],[633,988],[638,984],[641,976],[641,951],[641,919],[641,875],[646,816],[651,757],[658,702],[665,638],[670,584],[675,535],[680,493],[683,453],[683,424],[680,397],[678,377],[670,365],[660,352],[648,342],[621,330],[584,323],[542,323],[495,330],[448,340],[402,352],[357,362],[318,372],[291,377],[266,382],[254,384]]
    ],

    5: [ // S
      [[611,426],[591,404],[582,389],[567,374],[549,360],[527,342],[503,328],[473,310],[441,298],[406,291],[372,286],[337,286],[308,288],[278,293],[251,305],[229,320],[207,340],[184,365],[167,392],[157,416],[152,436],[150,461],[155,478],[162,493],[177,508],[197,527],[224,545],[258,559],[293,572],[328,584],[365,596],[399,611],[434,623],[468,641],[498,660],[525,683],[547,702],[567,730],[579,754],[586,781],[589,806],[586,828],[579,848],[569,870],[549,890],[525,912],[488,934],[451,954],[409,969],[369,981],[332,984],[298,986],[263,979],[236,971],[212,961],[189,949],[170,937],[157,924],[143,905],[135,887],[133,875]],
      [[456,360],[424,352],[406,352],[357,355],[313,365],[288,384],[271,411],[263,451],[281,493],[323,537],[387,589],[443,631],[483,668],[500,710],[485,752],[448,791],[369,831],[295,848],[229,845],[175,826],[143,808],[140,806]]
    ],

    6: [ // △
      [[429,342],[406,372],[367,421],[320,478],[271,537],[226,591],[187,641],[152,685],[120,727],[96,764],[76,796],[61,823],[51,841],[46,850],[44,858],[41,860],[41,860],[44,863],[46,863],[56,865],[73,865],[96,865],[123,863],[152,860],[184,858],[219,855],[256,853],[298,850],[340,848],[384,848],[426,845],[468,841],[508,841],[545,838],[579,836],[611,833],[641,833],[660,831],[678,831],[690,828],[700,828],[702,828],[705,828],[707,828],[707,826],[705,823],[697,816],[685,806],[670,791],[656,774],[638,752],[616,720],[591,688],[569,653],[545,616],[522,579],[500,542],[480,508],[461,471],[446,441],[436,419],[431,406],[431,404]]
    ],

    7: [ // U
      [[180,293],[175,323],[172,362],[167,414],[162,471],[157,532],[157,589],[157,641],[162,690],[167,737],[175,779],[182,816],[192,848],[204,877],[217,905],[229,927],[246,949],[263,966],[286,984],[310,998],[335,1008],[362,1016],[392,1013],[424,1008],[458,998],[493,984],[525,964],[552,944],[572,919],[596,892],[616,860],[631,826],[643,786],[651,747],[658,695],[663,643],[665,596],[670,540],[673,485],[673,441],[673,392],[675,360],[675,347]]
    ]
  };

  for (var key in shapeSamples) {

    shapeSamples[key].forEach(function(item, index) {
      var name = key + '-' + index;
      dollarOne.addGesture(name, item);
      shapeTypeDict[name] = key;
    });
  }

  console.log(shapeTypeDict);

  document.body.addEventListener('touchmove', function(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    if (e.preventDefault) {
      e.preventDefault();
    }
  });

  function pointToPoint(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  }

  function pointToAngle(origin, point) {
    return Math.atan2((point[1] - origin[1]), point[0] - origin[0]);
  }

  function ptInRect(p, rect) {
    return (p[0] >= rect[0] && p[0] <= rect[0] + rect[2]) &&
      (p[1] >= rect[1] && p[1] <= rect[1] + rect[3]);
  }

  var canvas = document.getElementById('canvas');
  var content = canvas.parentNode;
  var center = [canvas.width / 2, canvas.height / 2]; // 中心坐标
  var zoom = 1; // 缩放比
  var score = -1;
  var colorIndex = 0;
  var colors = ['#FF0000', '#FFFFFF', '#0000FF', '#FFFF00', '#FF00FF'];

  function resize() {
    canvas.style.height = window.innerHeight + 'px';
    canvas.style.width = window.innerHeight *
      (canvas.width / canvas.height) + 'px';
    content.style.width = canvas.style.width;
    zoom = canvas.height / window.innerHeight;
  }
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);

  var path = [];

  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (status === 'gameover') {
      return;
    }
    if (path.length > 200) {
      return;
    }
    path.push([
      (e.targetTouches[0].pageX - canvas.offsetLeft) * zoom,
      (e.targetTouches[0].pageY - canvas.offsetTop) * zoom
    ]);
  });

  canvas.addEventListener('touchstart', function(e) {
    lastAttackTime = 0;
    colorIndex++;
    var pos = [
      (e.targetTouches[0].pageX - canvas.offsetLeft) * zoom,
      (e.targetTouches[0].pageY - canvas.offsetTop) * zoom
    ];
    if (status === 'gameover') {
      return;
    } else if (status === 'waiting') {
      status = 'playing';
      start = new Date;
      return;
    }
    path = [pos];
  });

  var currentShape = 1;
  var lastAttackTime = 0;
  canvas.addEventListener('touchend', function(e) {
    if (status === 'gameover') {
      return;
    }
    lastAttackTime = new Date;
    if (path.length > 6) {
      var temp = JSON.parse(JSON.stringify(path).
        replace(/(\d+)\.\d+/g, '$1')); // clone & trunc
      var shapeName = dollarOne.recognize(path);
      console.log(shapeName, shapeTypeDict[shapeName]);
      if (!shapeName) {
        // TODO : 显示无效
        networks.attack("-1", temp);
        return;
      }

      networks.attack(shapeTypeDict[shapeName], temp);
    }
  });

  var context = canvas.getContext('2d');
  var status = 'playing';

  function onPolyline(item, index) {
    if (index === 0) {
      context.moveTo(item[0], item[1]);
    } else {
      context.lineTo(item[0], item[1]);
    }
  }

  function render() {
    //context.fillStyle = '#000000';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#FFFFFF';

    if (status === 'gameover') {
      return;
    }

    context.save();
    context.lineWidth = canvas.width * 0.06;
    context.strokeStyle = colors[colorIndex % colors.length];
    context.globalAlpha = 0.5;
    if (lastAttackTime) {
      var tick = new Date - lastAttackTime;
      if (tick >= 5000) {
        path = [];
      } else if (tick >= 2000) {
        context.globalAlpha = 0.5 - Math.max(0.01, (tick - 2000) / 3000 * 0.5);
      }
    }

    context.lineCap = 'round';
    context.lineJoin = 'round';

    context.beginPath();
    path.forEach(onPolyline);
    context.stroke();
    context.restore();
  }

  setInterval(function() {
    render();
  }, 100);

  networks.connect(function(action, data) {
    switch(action) {
      case 'connect':
        break;
      case 'failed':
        break;
      case 'welcome':
        switch (data.user.hero) {
          case 1:
            document.body.className = "cat";
            break;
          case 2:
            document.body.className = "dog";
            break;
        }
        break;
      case 'attack':
        break;
      case 'status-change':
        break;
    }
  });
}();
