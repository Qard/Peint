// Attach ready event
$(function () {



  // Start the canvas engine
  var Game = Peint.all()
  window.canvas = new Game.Canvas('#viewport')
  canvas.set({
    width: document.body.clientWidth
    , height: document.body.clientHeight
  })
  canvas.fill('rgb(150,150,255)')
  canvas.start()

  // Profiling wrappers
  var types = ['Image', 'Group', 'Animation']
    , steps = ['_preRender', '_render', '_postRender']
  _.each(types, function (type) {
    var pre = Game[type].prototype._preRender
    Game[type].prototype._preRender = function () {
      console.time('Game.'+type+' render')
      return pre.apply(this, arguments)
    }

    var post = Game[type].prototype._postRender
    Game[type].prototype._postRender = function () {
      var ret = post.apply(this, arguments)
      console.timeEnd('Game.'+type+' render')
      return ret
    }
  })



  // Make terrain and player groups
  var terrain = new Game.Group()
  var players = new Game.Group()
  canvas.add(terrain)
  canvas.add(players)

  // Delay until images are loaded, so we can
  // resize the map before adding objects
  var done = Game.util.after(2, function () {

    // Now that we know how big the map is,
    // we can set the group sizes to match
    terrain.set({
      width: map.get('width')
      , height: map.get('height')
    })
    players.set({
      width: map.get('width')
      , height: map.get('height')
    })

    // Add items after setting group sizes
    terrain.add(map)
    players.add(player)
  })



  // Load a map image
  var map = new Game.Image({
    url: './img/map.png'
  })
  map.on('image:loaded', done)

  // Load a player animation
  var player = new Game.Animation({
    url: './img/person.png'
    , top: 330
    , left: 100
    , animation: {
      rows: 8
      , cols: 9
      , duration: 40
    }
  })

  // Pause animation after loading completes
  player.on('image:loaded', function () {
    this.pause()
    done()
  })

  // Report mouse over and click events
  player.on('mouse:down', function (e) {
    console.log('clicked player', e[0])
  })
  player.on('mouse:over', function (e) {
    console.log('mouse over player', e[0])
  })



  // Create text object to report x/y position
  var text = new Game.Text({
    text: '0, 0'
    , top: 10
    , left: 10
    , font: '20px Helvetica'
    , color: 'rgb(255,255,255)'
    , shadow: '2px 2px 2px rgb(0,0,0)'
  })
  canvas.add(text)



  // Use mouse events to allow dragging of the map
  var dragging, oldPos, newPos

  // Capture position and start dragging
  canvas.on('mouse:down', function (point) {
    newPos = null
    dragging = true
    point = point[0]
    oldPos = [ point[0], point[1] ]
  })

  // Capture new position and reset x/y text
  canvas.on('mouse:move', function (point) {
    point = point[0]
    newPos = [ point[0], point[1] ]
    text.set({ text: newPos.join(', ') })
  })

  // Stop dragging
  canvas.on('mouse:up', function (e) {
    dragging = false
  })

  // Poll for drag changes
  setInterval(function () {
    if (dragging && oldPos && newPos) {
      if (oldPos[0] !== newPos[0] || oldPos[1] !== newPos[1]) {
        for (var i = 0; i < canvas._children.length; i++) {
          var child = canvas._children[i]

          // Only groups should be draggable, leave x/y text and bg rect.
          // Do some calculations to prevent dragging the map offscreen.
          if (child._children) {
            child.set({
              left: Math.max(
                canvas._el.width - child.attrs.width
                , Math.min(0, child.attrs.left - (oldPos[0] - newPos[0]))
              )
              , top: Math.max(
                canvas._el.height - child.attrs.height
                , Math.min(0, child.attrs.top - (oldPos[1] - newPos[1]))
              )
            })
          }
        }
        oldPos = newPos
      }
    }
  }, 1000 / 30)



  // Use keyboard events to let player walk around
  var nTim, eTim, sTim, wTim
  var speed = 10

  // Update player direction
  var activeDirs = { n: false, s: false, e: false, w: false }
  var directions = ['s','sw','w','nw','n','ne','e','se']
  function determineDirection () {
    var direction = ''
    activeDirs.n && (direction += 'n')
    activeDirs.s && (direction += 's')
    activeDirs.e && (direction += 'e')
    activeDirs.w && (direction += 'w')

    player.set({
      sliceY: directions.indexOf(direction) * (player.attrs.image.height / 8)
    })

    // Pause or play animation
    if (_.include(activeDirs, true)) {
      player.animating || player.play()
    } else {
      player.animating && player.pause()
    }
  }

  // Right movement
  canvas.on('keys:down:d', function () {
    eTim = setInterval(function () {
      player.set({
        left: player.get('left') + speed
      })
    }, 1000 / 30)
    activeDirs.e = true
    determineDirection()
  })
  canvas.on('keys:up:d', function () {
    clearInterval(eTim)
    activeDirs.e = false
    determineDirection()
  })

  // Left movement
  canvas.on('keys:down:a', function () {
    wTim = setInterval(function () {
      player.set({
        left: player.get('left') - speed
      })
    }, 1000 / 30)
    activeDirs.w = true
    determineDirection()
  })
  canvas.on('keys:up:a', function () {
    clearInterval(wTim)
    activeDirs.w = false
    determineDirection()
  })

  // Up movement
  canvas.on('keys:down:w', function () {
    nTim = setInterval(function () {
      player.set({
        top: player.get('top') - speed
      })
    }, 1000 / 30)
    activeDirs.n = true
    determineDirection()
  })
  canvas.on('keys:up:w', function () {
    clearInterval(nTim)
    activeDirs.n = false
    determineDirection()
  })

  // Down movement
  canvas.on('keys:down:s', function () {
    sTim = setInterval(function () {
      player.set({
        top: player.get('top') + speed
      })
    }, 1000 / 30)
    activeDirs.s = true
    determineDirection()
  })
  canvas.on('keys:up:s', function () {
    clearInterval(sTim)
    activeDirs.s = false
    determineDirection()
  })



})