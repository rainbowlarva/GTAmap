let map;
let markers = [];

const center_x = 117.3;
const center_y = 172.8;
const scale_x = 0.02072;
const scale_y = 0.0205;

CUSTOM_CRS = L.extend({}, L.CRS.Simple, {
  projection: L.Projection.LonLat,
  scale: function (zoom) {
    return Math.pow(2, zoom);
  },
  zoom: function (sc) {
    return Math.log(sc) / 0.6931471805599453;
  },
  distance: function (pos1, pos2) {
    var x_difference = pos2.lng - pos1.lng;
    var y_difference = pos2.lat - pos1.lat;
    return Math.sqrt(x_difference * x_difference + y_difference * y_difference);
  },
  transformation: new L.Transformation(scale_x, center_x, -scale_y, center_y),
  infinite: true
});

var SateliteStyle = L.tileLayer('mapStyles/styleSatelite/{z}/{x}/{y}.jpg', {
    minZoom: 0,
    maxZoom: 8,
    noWrap: true,
    continuousWorld: false,
    attribution: 'Online map GTA V',
    id: 'SateliteStyle map',
  }),
  AtlasStyle = L.tileLayer('mapStyles/styleAtlas/{z}/{x}/{y}.jpg', {
    minZoom: 0,
    maxZoom: 5,
    noWrap: true,
    continuousWorld: false,
    attribution: 'Online map GTA V',
    id: 'styleAtlas map',
  }),
  GridStyle = L.tileLayer('mapStyles/styleGrid/{z}/{x}/{y}.png', {
    minZoom: 0,
    maxZoom: 5,
    noWrap: true,
    continuousWorld: false,
    attribution: 'Online map GTA V',
    id: 'styleGrid map',
  });

var ExampleGroup = L.layerGroup();
var Icons = {
  "Locations": ExampleGroup,
};

var mymap = L.map('map', {
  crs: CUSTOM_CRS,
  minZoom: 1,
  maxZoom: 5,
  Zoom: 5,
  maxNativeZoom: 5,
  preferCanvas: true,
layers: [AtlasStyle],
  center: [0, 0],
  zoom: 3,
});

ExampleGroup.addTo(mymap);

var layersControl = L.control.layers(
  { "Satelite": SateliteStyle, "Atlas": AtlasStyle, "Grid": GridStyle },
  Icons
).addTo(mymap);

function customIcon(icon) {
  return L.icon({
    iconUrl: `blips/${icon}.png`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -5]
  });
}

const coordDisplay = L.DomUtil.create('div', 'mouse-coords');
document.body.appendChild(coordDisplay);

mymap.on('mousemove', function (e) {
  coordDisplay.style.left = (e.originalEvent.pageX + 10) + 'px';
  coordDisplay.style.top = (e.originalEvent.pageY + 10) + 'px';
  coordDisplay.innerHTML = `X: ${e.latlng.lng.toFixed(2)}<br>Y: ${e.latlng.lat.toFixed(2)}`;
});

mymap.on('mouseout', function () {
  coordDisplay.style.display = 'none';
});
mymap.on('mouseover', function () {
  coordDisplay.style.display = 'block';
});

mymap.on('click', function (e) {
  const lat = e.latlng.lat.toFixed(2);
  const lng = e.latlng.lng.toFixed(2);

  const xEl = document.getElementById('xCoord');
  const yEl = document.getElementById('yCoord');

  if (xEl) xEl.textContent = lng;
  if (yEl) yEl.textContent = lat;
});

if (typeof pinData !== 'undefined') {
  pinData.forEach(pin => {
L.marker([pin.y, pin.x], {
  icon: customIcon(pin.icon)
})
.addTo(Icons["Locations"])
.bindPopup(
  pin.link
    ? `<strong>${pin.label}</strong><br><a href="${pin.link}" target="_blank">${pin.link}</a>`
    : `<strong>${pin.label}</strong>`
);
  });
}

function updateMapWithPins(pins) {
  if (!Icons["Locations"]) {
    Icons["Locations"] = L.layerGroup().addTo(mymap);
  } else {
    Icons["Locations"].clearLayers();
  }

  pins.forEach(pin => {
    if (Number.isFinite(pin.x) && Number.isFinite(pin.y)) {
      L.marker([pin.y, pin.x], {
        icon: customIcon(pin.icon)
      })
      .addTo(Icons["Locations"])
      .bindPopup(
        pin.link
          ? `<strong>${pin.label}</strong><br><a href="${pin.link}" target="_blank" rel="noopener noreferrer">${pin.link}</a>`
          : `<strong>${pin.label}</strong>`
      );
    }
  });
}

let currentPins = [];

function loadPins() {
  fetch("https://script.google.com/macros/s/AKfycbw3Pt-f9RCJ1WgPBiktQV1MHUnmbLu8ZdABZAvf7UdkHPaDVYbsETAIlRuyr96FjDIddg/exec")
    .then(response => response.text())
    .then(jsCode => {
      window.pinData = undefined;
      eval(jsCode);

      if (!Array.isArray(window.pinData)) {
        console.error("pinData is not defined or not an array.");
        return;
      }

      const newJSON = JSON.stringify(window.pinData);
      if (newJSON !== JSON.stringify(currentPins)) {
        updateMapWithPins(window.pinData);
        currentPins = window.pinData;
      }
    })
    .catch(err => console.error("Error fetching pin data:", err));
}

loadPins();
setInterval(loadPins, 10000);