var fs = require('fs');

var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();

var numberOfTripsADayX = []
var numberOfTripsADayY = [[]]
var vehiclesNumber = []

var vehiclesAverage = {
  totalVehicles: 0,
  average: 0
}

var tripsWithoutDropOffId = {
  fhv: 0,
  yellow: 0,
  green: 0
}

var minutesPerTrip = {
  fhv: 0,
  yellow: 0,
  green: 0,
  fhvTotal: 0,
  yellowTotal: 0,
  greenTotal: 0,
  fhvSum: 0,
  yellowSum: 0,
  greenSum: 0,
}

var tripsFromMadison = {
  fhv: 0,
  yellow: 0,
  green: 0
}

var tripsFromWoodside = {
  fhv: 0,
  yellow: 0,
  green: 0
}

var tripsQueue = []

var recordsNumber = 0

var tripsPerMonth = {}

client.on('connectFailed', function(error) {
  console.log('Connect Error: ' + error.toString());
});
 
client.on('connect', function(connection) {
  console.log('WebSocket Client Connected');
  connection.on('error', function(error) {
    console.log("Connection Error: " + error.toString());
  });
  connection.on('close', function() {
    console.log('echo-protocol Connection Closed');
  });
  connection.on('message', function(message) {
    const tripJson = JSON.parse(message.utf8Data)
    // console.log(tripJson)
    recordsNumber++
    tripsQueue.push(tripJson)
    if(tripsQueue.length === 1) updateStatisticsFromQueue()
    // updateStatistics(tripJson)
  });
});
 
client.connect('ws://localhost:9000/ws', null, 'http://localhost:9000/');

function updateStatisticsFromQueue() {
  while(tripsQueue.length !== 0) {
    const currentTrip = tripsQueue[0]
    updateStatistics(currentTrip)
    tripsQueue.shift()
  }
}

function updateStatistics(tripJson) {
  if(tripJson.pickupDateTime.charAt(0) === '"') {
    tripJson.pickupDateTime = tripJson.pickupDateTime.substring(1, tripJson.pickupDateTime.length-1);
  }
  if(tripJson.vendorId.charAt(0) === '"') {
    tripJson.vendorId = tripJson.vendorId.substring(1, tripJson.vendorId.length-1);
  }
  if(tripJson.dropOffLocationId.charAt(0) === '"') {
    tripJson.dropOffLocationId = tripJson.dropOffLocationId.substring(1, tripJson.dropOffLocationId.length-1);
  }
  if(tripJson.pickupLocationId.charAt(0) === '"') {
    tripJson.pickupLocationId = tripJson.pickupLocationId.substring(1, tripJson.pickupLocationId.length-1);
  }
  if(tripJson.dropOffDatetime.charAt(0) === '"') {
    tripJson.dropOffDatetime = tripJson.dropOffDatetime.substring(1, tripJson.dropOffDatetime.length-1);
  }
  updateNumberOfTripsADay(tripJson.pickupDateTime)
  updateAverageVehiclesADay(tripJson.vendorId, tripJson.pickupDateTime)
  updateTripsWithoutDropOffId(tripJson.taxiType, tripJson.dropOffLocationId)
  updateAverageMinutesPerTrip(tripJson)
  if(tripJson.pickupLocationId === '149') {
    tripsFromMadison[tripJson.taxiType]++
  } else if(tripJson.pickupLocationId === '260') {
    tripsFromWoodside[tripJson.taxiType]++
  }
}

function updateNumberOfTripsADay(dateString) {
  if(dateString.charAt(0) === '"') {
    dateString = dateString.substring(1, dateString.length-1);
  }
  const newDateWithoutTime = new Date(dateString.substring(0, 10))
  if(tripsPerMonth[dateString.substring(0, 7)] === undefined) tripsPerMonth[dateString.substring(0, 7)] = 1
  else tripsPerMonth[dateString.substring(0, 7)]++
  for(let i = 0; i < numberOfTripsADayX.length; i++) {
    const curDate = new Date(numberOfTripsADayX[i])
    if(newDateWithoutTime < curDate) {
      numberOfTripsADayX.splice(i, 0, dateString.substring(0, 10));
      numberOfTripsADayY[0].splice(i, 0, 1);
      break
    } else if(newDateWithoutTime.getTime() == curDate.getTime()) {
      numberOfTripsADayY[0][i]++;
      break
    } else if(i === numberOfTripsADayX.length-1) {
      numberOfTripsADayX.push(dateString.substring(0, 10))
      numberOfTripsADayY[0].push(1)
      break
    }
  }
  if(numberOfTripsADayX.length === 0) {
    numberOfTripsADayX.push(dateString.substring(0, 10))
    numberOfTripsADayY[0].push(1)
  }
}

function updateAverageVehiclesADay(vendorId, dateString) {
  if(dateString.charAt(0) === '"') {
    dateString = dateString.substring(1, dateString.length-1);
  }
  if(vendorId.charAt(0) === '"') {
    vendorId = vendorId.substring(1, vendorId.length-1);
  }
  const newDateWithoutTime = new Date(dateString.substring(0, 10))
  for(let i = 0; i < vehiclesNumber.length; i++) {
    const curDate = new Date(vehiclesNumber[i].Date)
    if(newDateWithoutTime < curDate) {
      vehiclesNumber.splice(i, 0, {
        Date: dateString.substring(0, 10),
        vehicles: [vendorId]
      });
      addVehicleAndUpdateAverage()
      break
    } else if(newDateWithoutTime.getTime() == curDate.getTime()) {
      if(!searchVehiclesArray(i, vendorId)) addVehicleAndUpdateAverage()
      break
    } else if(i === vehiclesNumber.length-1) {
      vehiclesNumber.push({
        Date: dateString.substring(0, 10),
        vehicles: [vendorId]
      });
      addVehicleAndUpdateAverage()
      break
    }
  }
  if(vehiclesNumber.length === 0) {
    vehiclesNumber.push({
      Date: dateString.substring(0, 10),
      vehicles: [vendorId]
    });
    addVehicleAndUpdateAverage()
  }
}

function addVehicleAndUpdateAverage() {
  vehiclesAverage.totalVehicles++
  vehiclesAverage.average = vehiclesAverage.totalVehicles / vehiclesNumber.length
}

function searchVehiclesArray(index, key) {
  const length = vehiclesNumber[index].vehicles.length
  let start = 0, end = length - 1
  let middle = Math.floor(end/2)
  while(1) {
    const currentKey = vehiclesNumber[index].vehicles[middle]
    const areKeysEqual = checkStringEquality(key, currentKey)
    if(areKeysEqual === 0) return true
    else if(areKeysEqual === -1) {
      if(end === start) {
        vehiclesNumber[index].vehicles.splice(index, 0, key);
        return false
      }
      end = middle
    } else {
      if(end === start) {
        vehiclesNumber[index].vehicles.splice(index+1, 0, key);
        return false
      }
      start = middle+1
    }
    middle = Math.floor((end + start) / 2)
  }
}

function checkStringEquality(str1, str2) {
  for(let i = 0; i < str1.length; i++) {
    if(str1.charAt(i) === str2.charAt(i)) {
      if(i === str1.length - 1 && str1.length === str2.length) return 0
      continue
    }
    else if(str1.charAt(i) < str2.charAt(i)) return -1
    else return 1
  }
  return -1
}

function updateTripsWithoutDropOffId(taxiType, dropOffLocationId) {
  if(dropOffLocationId.charAt(0) === '"') {
    dropOffLocationId = dropOffLocationId.substring(1, dropOffLocationId.length-1);
  }
  if(dropOffLocationId.length === 0) {
    tripsWithoutDropOffId[taxiType]++
  }
}

function updateAverageMinutesPerTrip(trip) {
  const oneMinute = 60000
  const pickupDateTime = new Date(trip.pickupDateTime)
  const dropOffDatetime = new Date(trip.dropOffDatetime)
  const tripTime = (dropOffDatetime.getTime() - pickupDateTime.getTime()) / oneMinute
  minutesPerTrip[trip.taxiType + "Total"]++
  minutesPerTrip[trip.taxiType + "Sum"] += tripTime
  minutesPerTrip[trip.taxiType] = minutesPerTrip[trip.taxiType + "Sum"] / minutesPerTrip[trip.taxiType + "Total"]
}

setInterval(updateStatisticsInFile, 1000)

function updateStatisticsInFile() {
  var fileText = recordsNumber + '\n' + recordsNumber + '\n'
  const averageTripsADay = Object.entries(tripsPerMonth)
  for (const [month, count] of averageTripsADay) {
    fileText += `${month}: ${Math.round((count/30)*100) / 100}, `
  }
  fileText += '\n' + vehiclesAverage.totalVehicles + '\n'
  fileText += tripsFromWoodside.fhv + ', ' + tripsFromWoodside.yellow + ', '
                  + tripsFromWoodside.green
  fs.writeFile('results/results.txt', fileText, function (err) {
    if (err) throw err;
  });
}