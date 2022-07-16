const zoomFactor = 5
window.addEventListener('load', async function () {
  controller = new JohnG(clock = false);
  textEditor = document.querySelector('#transcriptEditor')

  peak_data = await fetchJSONFile('/input/1/peaks.json')
  subtitle_data = await fetchJSONFile('/input/1/subtitles.json')

  peaks = peak_data.data.filter(function (value) { return value >= 0; });

  controller.set(subtitle_data);
  video_player = document.getElementById("mainPlayer");


  wavesurfer = WaveSurfer.create({
    container: document.querySelector('#waveform'),
    waveColor: '#A8DBA8',
    progressColor: '#3B8686',
    backend: 'MediaElement',
    normalize: true,
    plugins: [
      WaveSurfer.timeline.create({
        container: '#waveform-timeline'
      }),
      WaveSurfer.minimap.create({
        waveColor: 'grey',
        progressColor: 'black',
        height: 30,
        showOverview: true
      }),
      WaveSurfer.regions.create({
        regions: createWavesurferRegions(subtitle_data),
        dragSelection: {
            slop: 5
        }
      }),
      WaveSurfer.cursor.create({
        showTime: true,
        opacity: 1,
        customShowTimeStyle: {
            'background-color': '#000',
            color: '#fff',
            padding: '2px',
            'font-size': '10px'
        }
      }),
    ]
});

  // Load audio from existing media element
  var mediaElt = document.querySelector('video');

  wavesurfer.load(mediaElt, peaks);
  wavesurfer.zoom(50)
  wavesurfer.on("region-in", function(e) {addItem(controller.data[e.id])})
  wavesurfer.on("region-out", function(e) {removeItem(controller.data[e.id])})
  wavesurfer.on("region-dblclick", function(region, e) {region.loop = true; wavesurfer.play(); document.getElementById('regionLoop').checked=true;})

  // Region Bindings
  // We're going to need to bind to wavesurfer's regions plugin events to
  // let it control the UI. Events that are triggered by the regions plugin:
  // region-in – When playback enters a region. Callback will receive the Region object.
  // region-out– When playback leaves a region. Callback will receive the Region object.
  // region-mouseenter - When the mouse moves over a region. Callback will receive the Region object, and a MouseEvent object.
  // region-mouseleave - When the mouse leaves a region. Callback will receive the Region object, and a MouseEvent object.
  // region-click - When the mouse clicks on a region. Callback will receive the Region object, and a MouseEvent object.
  // region-dblclick - When the mouse double-clicks on a region. Callback will receive the Region object, and a MouseEvent object.
  // region-created – When a region is created. Callback will receive the Region object.
  // region-updated – When a region is updated. Callback will receive the Region object.
  // region-update-end – When dragging or resizing is finished. Callback will receive the Region object.
  // region-removed – When a region is removed. Callback will receive the Region object.

  // The plugin also has some mehtods we should be aware of:
  // addRegion(options) – Creates a region on the waveform. Returns a Region object. See Region Options, Region Methods and Region Events below.
  //  Note: You cannot add regions until the audio has finished loading, otherwise the start: and end: properties of the new region will be set to 0, or an unexpected value.
  // clearRegions() – Removes all regions.
  // enableDragSelection(options) – Lets you create regions by selecting. areas of the waveform with mouse. options are Region objects' params (see below).
  // disableDragSelection() - Disables ability to create regions.


  // Each Region also has events that are triggered by the Region object:
  // in - When playback enters the region.
  // out - When playback leaves the region.
  // remove - Happens just before the region is removed.
  // update - When the region's options are updated.
  // Mouse events:

  // click - When the mouse clicks on the region. Callback will receive a MouseEvent.
  // dblclick - When the mouse double-clicks on the region. Callback will receive a MouseEvent.
  // over - When mouse moves over the region. Callback will receive a MouseEvent.
  // leave - When mouse leaves the region. Callback will receive a MouseEvent.

  // Each region also has some methods:
  // remove() - Remove the region object.
  // update(options) - Modify the settings of the region.
  // play() - Play the audio region from the start to end position.


  // Markers
  // We'll want to add markers to the waveform to attach other items to the
  // stream. For isntance, at time mark 00:01, we may want to attach an image.
  // Markers would be great for this use case.
  // https://wavesurfer-js.org/example/markers/index.html


  // Helper functions for common media actions
  function playIt() {
    wavesurfer.play()
  }

  function pauseIt() {
    wavesurfer.pause();
  }
  
  function zoomIn() {
    zoom(wavesurfer.params.minPxPerSec + zoomFactor);
  }

  function zoomOut() {
    zoom(wavesurfer.params.minPxPerSec - zoomFactor);
  }

  function zoom(z) {
    wavesurfer.zoom(z);
  }

  // Interface Bindings
  // Controls
  document.getElementById('playButton').addEventListener("click", playIt);
  document.getElementById('pauseButton').addEventListener("click", pauseIt);
  document.getElementById('captureButton').addEventListener("click", capture);
  document.getElementById('waveformZoomIn').addEventListener("click", zoomIn);
  document.getElementById('waveformZoomOut').addEventListener("click", zoomOut);

  // Markers select list
  controller.data.forEach((item) => {
    var opt = document.createElement('option');
    opt.value = item.id;
    opt.title = item.text;
    opt.innerHTML = secondsToHMS(parseInt(item.start).toPrecision(2));
    document.getElementById('regionsSelect').appendChild(opt);
  });

  new Cleave('#startTime', {
    time: true,
    timePattern: ['h', 'm', 's']
  });
  new Cleave('#endTime', {
    time: true,
    timePattern: ['h', 'm', 's']
  });

  // Captions Editor
  document.getElementById('captions').addEventListener("click", function() {
    textEditor.value = this.querySelector('div.htmlItem span.transcript_playback_text').innerHTML;
    textEditor.dataset.itemId = this.querySelector('div.htmlItem').id;
  });

  textEditor.addEventListener('keyup', (event) => {
    console.log(event)
    controller.update({'id': textEditor.dataset.itemId, 'content': textEditor.textContent});
    textEditor.dataset.edited = true;
    el = document.getElementById(textEditor.dataset.itemId);
    dataItem = controller.all().find((data) => data.id === textEditor.dataset.itemId);
    if (el !== null) {
      //el.innerHTML = "[" + secondsToHMS(parseInt(dataItem.start).toPrecision(2)) + 's' + "]: " + textEditor.value;
      dataItem.content = textEditor.value;
      controller.update(dataItem);
      el.innerHTML = createHTML(dataItem)
    }
  });
})

async function fetchJSONFile(url) {
  const response = await fetch(url);
  const json = await response.json();
  return json;
}

function addItems(addMediaItems) {
  // If addMediaItems is an Array, then we can loop over it
  if (Array.isArray(addMediaItems)) {
    addMediaItems.forEach((itemId) => {
      // Does a player window with the same ID already exist?
      const doesItemExist = document.getElementById(itemId)
      if (!doesItemExist) {
        // Grab the video's data item because we will need it
        let mediaItem = controller
          .all()
          .find((data) => data.id === itemId)
        document.getElementById('captions').insertAdjacentHTML('beforeend', createHTML(mediaItem));
      }
    })
  }
}

function addItem(addMediaItem) {
    // Does a player window with the same ID already exist?
    const doesItemExist = document.getElementById(addMediaItem)
    if (!doesItemExist) {
      // Grab the video's data item because we will need it
      document.getElementById('captions').insertAdjacentHTML('beforeend', createHTML(addMediaItem));
    }
}

function createHTML(mediaItem) {
  const htmlItem = {
    ItemID: mediaItem.id,
    StartTime: "[" + secondsToHMS(mediaItem.start) + 's' + "]: ",
    Content: mediaItem.content
  }

  const template = document.getElementById('html_item_template').innerHTML
  return Mustache.render(template, htmlItem)
}

function removeItems(removeMediaItems) {
  if (Array.isArray(removeMediaItems)) {
    // We have some players that are no longer live and should be destroyed.
    removeMediaItems.forEach((itemId) => {
      document.getElementById(itemId).outerHTML = "";
    })
  }
}

function removeItem(removeMediaItem) {
  // We have some players that are no longer live and should be destroyed.
  document.getElementById(removeMediaItem.id).remove();
}

// Convert Hours:Minutes:Seconds to just seconds
function hmsToSeconds (hmsString) {
  const a = hmsString.split(':')
  const seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2]
  return seconds
}

// Convert Hours:Minutes:Seconds to just seconds
function secondsToHMS (seconds) {
  return "" + String(Math.floor(seconds / 3600)).padStart(2, '0') + ":" + String(Math.floor(seconds % 3600 / 60)).padStart(2, '0') + ":" + String(Math.floor(seconds % 3600 % 60)).padStart(2, '0')  + "." + Math.floor((seconds % 1000) / 100);
}

function randomColorRgba(opacity=100) {
  var o = Math.round, r = Math.random, s = 255;
  return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + (opacity/100).toFixed(1) + ')';
}

function createWavesurferRegions(data) {
  let regions = [];
  data.forEach((item) => {
    regions.push({
      id: item.id,
      start: item.start,
      end: item.end,
      color: randomColorRgba(25)
    })
  })
  return regions;
}

function capture() {
  var canvas = document.createElement('canvas');
  canvas.width = video_player.videoWidth;
  canvas.height = video_player.videoHeight;
  canvas.getContext('2d').drawImage(video_player, 0, 0);
  document.getElementById('thumbCapture').src = canvas.toDataURL('image/jpeg');
}
