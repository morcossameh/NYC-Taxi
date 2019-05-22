updateNumberOfTripsADayChart()
setInterval(updateNumberOfTripsADayChart, 1000)

function updateNumberOfTripsADayChart() {
  new Chartist.Bar('#tripsADayChart', {
    labels: numberOfTripsADayX,
    series: numberOfTripsADayY
  });

  new Chartist.Bar('#DropOffChart', {
    labels: ['fhv', 'yellow', 'green'],
    series: [[tripsWithoutDropOffId.fhv, tripsWithoutDropOffId.yellow, tripsWithoutDropOffId.green]]
  });

  new Chartist.Bar('#minutesATripChart', {
    labels: ['fhv', 'yellow', 'green'],
    series: [[minutesPerTrip.fhv, minutesPerTrip.yellow, minutesPerTrip.green]]
  });

  $('#avVehiclesADay').text(Math.round(vehiclesAverage.average))

  new Chartist.Bar('#tripsMadisonChart', {
    labels: ['fhv', 'yellow', 'green'],
    series: [[tripsFromMadison.fhv, tripsFromMadison.yellow, tripsFromMadison.green]]
  });
}